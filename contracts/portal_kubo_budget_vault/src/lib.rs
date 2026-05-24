#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_kubo_budget_vault {
    use ink::storage::Mapping;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum RunState {
        None,
        Funded,
        Running,
        Completed,
        Cancelled,
        Refunded,
    }

    #[derive(Clone, Copy, scale::Encode, scale::Decode, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct RunBudget {
        owner: AccountId,
        executor: AccountId,
        funded_amount: Balance,
        spent_amount: Balance,
        refunded_amount: Balance,
        expires_at: Timestamp,
        state: RunState,
        created_at: Timestamp,
        updated_at: Timestamp,
    }

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        EmptyRunId,
        InvalidAmount,
        InvalidExpiry,
        AlreadyFunded,
        NotFound,
        NotActive,
        Expired,
        OverBudget,
        NothingToRefund,
        TransferFailed,
        NotAuthorized,
        InvalidPaymentId,
        IncorrectRefundValue,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(storage)]
    pub struct PortalKuboBudgetVault {
        admin: AccountId,
        operators: Mapping<AccountId, bool>,
        budgets: Mapping<Hash, RunBudget>,
    }

    #[ink(event)]
    pub struct WorkflowFunded {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        owner: AccountId,
        executor: AccountId,
        amount: Balance,
        expires_at: Timestamp,
    }

    #[ink(event)]
    pub struct WorkflowStarted {
        #[ink(topic)]
        run_id: Hash,
    }

    #[ink(event)]
    pub struct WorkflowSpendRecorded {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        payment_id: Hash,
        amount: Balance,
    }

    #[ink(event)]
    pub struct WorkflowSpendRefundRecorded {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        payment_id: Hash,
        amount: Balance,
    }

    #[ink(event)]
    pub struct WorkflowCompleted {
        #[ink(topic)]
        run_id: Hash,
    }

    #[ink(event)]
    pub struct WorkflowCancelled {
        #[ink(topic)]
        run_id: Hash,
    }

    #[ink(event)]
    pub struct WorkflowRefunded {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        owner: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OperatorUpdated {
        #[ink(topic)]
        operator: AccountId,
        enabled: bool,
    }

    impl PortalKuboBudgetVault {
        #[ink(constructor)]
        pub fn new() -> Self {
            let admin = Self::env().caller();
            let mut operators = Mapping::default();
            operators.insert(admin, &true);

            Self {
                admin,
                operators,
                budgets: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn set_operator(&mut self, operator: AccountId, enabled: bool) -> Result<()> {
            self.ensure_admin()?;
            self.operators.insert(operator, &enabled);
            self.env().emit_event(OperatorUpdated { operator, enabled });
            Ok(())
        }

        #[ink(message, payable)]
        pub fn fund_workflow(
            &mut self,
            run_id: Hash,
            executor: AccountId,
            expires_at: Timestamp,
        ) -> Result<()> {
            self.validate_run_id(run_id)?;
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::InvalidAmount);
            }
            if expires_at <= self.env().block_timestamp() {
                return Err(Error::InvalidExpiry);
            }
            if self.budgets.contains(run_id) {
                return Err(Error::AlreadyFunded);
            }

            let now = self.env().block_timestamp();
            let budget = RunBudget {
                owner: self.env().caller(),
                executor,
                funded_amount: amount,
                spent_amount: 0,
                refunded_amount: 0,
                expires_at,
                state: RunState::Funded,
                created_at: now,
                updated_at: now,
            };

            self.budgets.insert(run_id, &budget);
            self.env().emit_event(WorkflowFunded {
                run_id,
                owner: budget.owner,
                executor,
                amount,
                expires_at,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn mark_running(&mut self, run_id: Hash) -> Result<()> {
            self.ensure_operator()?;
            let mut budget = self.require_budget(run_id)?;
            if budget.state != RunState::Funded {
                return Err(Error::NotActive);
            }

            budget.state = RunState::Running;
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env().emit_event(WorkflowStarted { run_id });
            Ok(())
        }

        #[ink(message)]
        pub fn record_spend(
            &mut self,
            run_id: Hash,
            payment_id: Hash,
            amount: Balance,
        ) -> Result<()> {
            self.ensure_operator()?;
            self.validate_payment_id(payment_id)?;
            if amount == 0 {
                return Err(Error::InvalidAmount);
            }

            let mut budget = self.require_active_budget(run_id)?;
            let available = budget
                .funded_amount
                .saturating_sub(budget.spent_amount)
                .saturating_sub(budget.refunded_amount);
            if amount > available {
                return Err(Error::OverBudget);
            }

            budget.spent_amount = budget.spent_amount.saturating_add(amount);
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env()
                .transfer(budget.executor, amount)
                .map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(WorkflowSpendRecorded {
                run_id,
                payment_id,
                amount,
            });
            Ok(())
        }

        #[ink(message, payable)]
        pub fn record_spend_refund(
            &mut self,
            run_id: Hash,
            payment_id: Hash,
            amount: Balance,
        ) -> Result<()> {
            self.ensure_operator()?;
            self.validate_payment_id(payment_id)?;
            if amount == 0 {
                return Err(Error::InvalidAmount);
            }
            if self.env().transferred_value() != amount {
                return Err(Error::IncorrectRefundValue);
            }

            let mut budget = self.require_active_budget(run_id)?;
            if amount > budget.spent_amount {
                return Err(Error::OverBudget);
            }

            budget.spent_amount = budget.spent_amount.saturating_sub(amount);
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env().emit_event(WorkflowSpendRefundRecorded {
                run_id,
                payment_id,
                amount,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn mark_completed(&mut self, run_id: Hash) -> Result<()> {
            self.ensure_operator()?;
            let mut budget = self.require_active_budget(run_id)?;
            budget.state = RunState::Completed;
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env().emit_event(WorkflowCompleted { run_id });
            Ok(())
        }

        #[ink(message)]
        pub fn cancel_workflow(&mut self, run_id: Hash) -> Result<()> {
            let mut budget = self.require_budget(run_id)?;
            if self.env().caller() != budget.owner && !self.is_operator(self.env().caller()) {
                return Err(Error::NotAuthorized);
            }
            if budget.state != RunState::Funded && budget.state != RunState::Running {
                return Err(Error::NotActive);
            }

            budget.state = RunState::Cancelled;
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env().emit_event(WorkflowCancelled { run_id });
            Ok(())
        }

        #[ink(message)]
        pub fn refund_unused(&mut self, run_id: Hash) -> Result<()> {
            let mut budget = self.require_budget(run_id)?;
            if self.env().caller() != budget.owner && !self.is_operator(self.env().caller()) {
                return Err(Error::NotAuthorized);
            }
            let refundable_state =
                budget.state == RunState::Completed || budget.state == RunState::Cancelled;
            if !refundable_state && self.env().block_timestamp() < budget.expires_at {
                return Err(Error::NotActive);
            }

            let refundable = budget
                .funded_amount
                .saturating_sub(budget.spent_amount)
                .saturating_sub(budget.refunded_amount);
            if refundable == 0 {
                return Err(Error::NothingToRefund);
            }

            budget.refunded_amount = budget.refunded_amount.saturating_add(refundable);
            if budget.spent_amount.saturating_add(budget.refunded_amount) >= budget.funded_amount {
                budget.state = RunState::Refunded;
            }
            budget.updated_at = self.env().block_timestamp();
            self.budgets.insert(run_id, &budget);
            self.env()
                .transfer(budget.owner, refundable)
                .map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(WorkflowRefunded {
                run_id,
                owner: budget.owner,
                amount: refundable,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn budget_of(&self, run_id: Hash) -> Option<RunBudget> {
            self.budgets.get(run_id)
        }

        #[ink(message)]
        pub fn available_amount(&self, run_id: Hash) -> Balance {
            self.budgets.get(run_id).map_or(0, |budget| {
                budget
                    .funded_amount
                    .saturating_sub(budget.spent_amount)
                    .saturating_sub(budget.refunded_amount)
            })
        }

        #[ink(message)]
        pub fn admin(&self) -> AccountId {
            self.admin
        }

        #[ink(message)]
        pub fn is_operator(&self, account: AccountId) -> bool {
            self.operators.get(account).unwrap_or(false)
        }

        fn require_budget(&self, run_id: Hash) -> Result<RunBudget> {
            self.budgets.get(run_id).ok_or(Error::NotFound)
        }

        fn require_active_budget(&self, run_id: Hash) -> Result<RunBudget> {
            let budget = self.require_budget(run_id)?;
            if budget.state != RunState::Funded && budget.state != RunState::Running {
                return Err(Error::NotActive);
            }
            if self.env().block_timestamp() >= budget.expires_at {
                return Err(Error::Expired);
            }
            Ok(budget)
        }

        fn ensure_admin(&self) -> Result<()> {
            if self.env().caller() == self.admin {
                Ok(())
            } else {
                Err(Error::NotAuthorized)
            }
        }

        fn ensure_operator(&self) -> Result<()> {
            if self.is_operator(self.env().caller()) {
                Ok(())
            } else {
                Err(Error::NotAuthorized)
            }
        }

        fn validate_run_id(&self, run_id: Hash) -> Result<()> {
            if run_id == Hash::from([0; 32]) {
                Err(Error::EmptyRunId)
            } else {
                Ok(())
            }
        }

        fn validate_payment_id(&self, payment_id: Hash) -> Result<()> {
            if payment_id == Hash::from([0; 32]) {
                Err(Error::InvalidPaymentId)
            } else {
                Ok(())
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        fn accounts() -> test::DefaultAccounts<ink::env::DefaultEnvironment> {
            test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        #[ink::test]
        fn funds_and_refunds_unused_budget() {
            let accounts = accounts();
            test::set_value_transferred::<ink::env::DefaultEnvironment>(1_000);
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(100);
            let mut contract = PortalKuboBudgetVault::new();
            let run_id = Hash::from([1; 32]);

            contract
                .fund_workflow(run_id, accounts.bob, 1_000)
                .expect("funding should succeed");
            assert_eq!(contract.available_amount(run_id), 1_000);

            contract.mark_running(run_id).expect("should start");
            contract.mark_completed(run_id).expect("should complete");
            contract.refund_unused(run_id).expect("should refund");

            let budget = contract.budget_of(run_id).expect("budget should exist");
            assert_eq!(budget.state, RunState::Refunded);
            assert_eq!(budget.refunded_amount, 1_000);
        }

        #[ink::test]
        fn rejects_overspend() {
            let accounts = accounts();
            test::set_value_transferred::<ink::env::DefaultEnvironment>(500);
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(100);
            let mut contract = PortalKuboBudgetVault::new();
            let run_id = Hash::from([1; 32]);

            contract
                .fund_workflow(run_id, accounts.bob, 1_000)
                .expect("funding should succeed");
            assert_eq!(
                contract.record_spend(run_id, Hash::from([2; 32]), 501),
                Err(Error::OverBudget)
            );
        }
    }
}
