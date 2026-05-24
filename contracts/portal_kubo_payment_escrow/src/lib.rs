#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_kubo_payment_escrow {
    use ink::storage::Mapping;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum PaymentState {
        None,
        Reserved,
        Released,
        Refunded,
    }

    #[derive(Clone, Copy, scale::Encode, scale::Decode, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct EscrowPayment {
        payer: AccountId,
        provider: AccountId,
        amount: Balance,
        settlement_hash: Hash,
        state: PaymentState,
        reserved_at: Timestamp,
        finalized_at: Timestamp,
    }

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        EmptyPaymentId,
        InvalidAmount,
        AlreadyReserved,
        NotReserved,
        TransferFailed,
        NotAuthorized,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(storage)]
    pub struct PortalKuboPaymentEscrow {
        admin: AccountId,
        operators: Mapping<AccountId, bool>,
        payments: Mapping<Hash, EscrowPayment>,
    }

    #[ink(event)]
    pub struct PaymentReserved {
        #[ink(topic)]
        payment_id: Hash,
        #[ink(topic)]
        payer: AccountId,
        provider: AccountId,
        amount: Balance,
        settlement_hash: Hash,
    }

    #[ink(event)]
    pub struct PaymentReleased {
        #[ink(topic)]
        payment_id: Hash,
        #[ink(topic)]
        provider: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct PaymentRefunded {
        #[ink(topic)]
        payment_id: Hash,
        #[ink(topic)]
        payer: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OperatorUpdated {
        #[ink(topic)]
        operator: AccountId,
        enabled: bool,
    }

    impl PortalKuboPaymentEscrow {
        #[ink(constructor)]
        pub fn new() -> Self {
            let admin = Self::env().caller();
            let mut operators = Mapping::default();
            operators.insert(admin, &true);

            Self {
                admin,
                operators,
                payments: Mapping::default(),
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
        pub fn reserve_payment(
            &mut self,
            payment_id: Hash,
            provider: AccountId,
            settlement_hash: Hash,
        ) -> Result<()> {
            self.validate_payment_id(payment_id)?;
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::InvalidAmount);
            }
            if self.payments.contains(payment_id) {
                return Err(Error::AlreadyReserved);
            }

            let payment = EscrowPayment {
                payer: self.env().caller(),
                provider,
                amount,
                settlement_hash,
                state: PaymentState::Reserved,
                reserved_at: self.env().block_timestamp(),
                finalized_at: 0,
            };

            self.payments.insert(payment_id, &payment);
            self.env().emit_event(PaymentReserved {
                payment_id,
                payer: payment.payer,
                provider,
                amount,
                settlement_hash,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn release_payment(&mut self, payment_id: Hash) -> Result<()> {
            self.ensure_operator()?;
            let mut payment = self.require_reserved(payment_id)?;
            payment.state = PaymentState::Released;
            payment.finalized_at = self.env().block_timestamp();
            self.payments.insert(payment_id, &payment);
            self.env()
                .transfer(payment.provider, payment.amount)
                .map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(PaymentReleased {
                payment_id,
                provider: payment.provider,
                amount: payment.amount,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn refund_payment(&mut self, payment_id: Hash) -> Result<()> {
            self.ensure_operator()?;
            let mut payment = self.require_reserved(payment_id)?;
            payment.state = PaymentState::Refunded;
            payment.finalized_at = self.env().block_timestamp();
            self.payments.insert(payment_id, &payment);
            self.env()
                .transfer(payment.payer, payment.amount)
                .map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(PaymentRefunded {
                payment_id,
                payer: payment.payer,
                amount: payment.amount,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn payment_of(&self, payment_id: Hash) -> Option<EscrowPayment> {
            self.payments.get(payment_id)
        }

        #[ink(message)]
        pub fn admin(&self) -> AccountId {
            self.admin
        }

        #[ink(message)]
        pub fn is_operator(&self, account: AccountId) -> bool {
            self.operators.get(account).unwrap_or(false)
        }

        fn require_reserved(&self, payment_id: Hash) -> Result<EscrowPayment> {
            let payment = self.payments.get(payment_id).ok_or(Error::NotReserved)?;
            if payment.state != PaymentState::Reserved {
                return Err(Error::NotReserved);
            }
            Ok(payment)
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

        fn validate_payment_id(&self, payment_id: Hash) -> Result<()> {
            if payment_id == Hash::from([0; 32]) {
                Err(Error::EmptyPaymentId)
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
        fn reserves_and_releases_payment() {
            let accounts = accounts();
            test::set_value_transferred::<ink::env::DefaultEnvironment>(250);
            let mut contract = PortalKuboPaymentEscrow::new();
            let payment_id = Hash::from([1; 32]);

            contract
                .reserve_payment(payment_id, accounts.bob, Hash::from([9; 32]))
                .expect("reserve should succeed");
            contract
                .release_payment(payment_id)
                .expect("release should succeed");

            let payment = contract
                .payment_of(payment_id)
                .expect("payment should be stored");
            assert_eq!(payment.state, PaymentState::Released);
        }
    }
}
