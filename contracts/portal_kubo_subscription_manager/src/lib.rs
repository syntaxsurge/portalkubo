#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_kubo_subscription_manager {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    const PERIOD: Timestamp = 30 * 24 * 60 * 60 * 1_000;

    #[derive(Clone, Copy, scale::Encode, scale::Decode, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Subscription {
        plan_key: u8,
        paid_until: Timestamp,
        canceled_at: Timestamp,
        auto_renew: bool,
    }

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        InvalidPlan,
        UnknownPlan,
        IncorrectPayment,
        NoActiveSubscription,
        InvalidRecipient,
        EmptyBalance,
        InsufficientBalance,
        TransferFailed,
        NotAuthorized,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(storage)]
    pub struct PortalKuboSubscriptionManager {
        admin: AccountId,
        plan_prices: Mapping<u8, Balance>,
        subscriptions: Mapping<AccountId, Subscription>,
        known_subscribers: Mapping<AccountId, bool>,
        subscribers: Vec<AccountId>,
    }

    #[ink(event)]
    pub struct SubscriptionPaid {
        #[ink(topic)]
        team: AccountId,
        plan_key: u8,
        paid_until: Timestamp,
    }

    #[ink(event)]
    pub struct SubscriptionRenewed {
        #[ink(topic)]
        team: AccountId,
        plan_key: u8,
        paid_until: Timestamp,
    }

    #[ink(event)]
    pub struct SubscriptionCanceled {
        #[ink(topic)]
        team: AccountId,
        canceled_at: Timestamp,
    }

    #[ink(event)]
    pub struct AutoRenewalUpdated {
        #[ink(topic)]
        team: AccountId,
        enabled: bool,
    }

    #[ink(event)]
    pub struct PlanPriceUpdated {
        plan_key: u8,
        price: Balance,
    }

    #[ink(event)]
    pub struct TreasuryWithdrawn {
        #[ink(topic)]
        recipient: AccountId,
        amount: Balance,
    }

    impl PortalKuboSubscriptionManager {
        #[ink(constructor)]
        pub fn new(base_price: Balance, plus_price: Balance) -> Self {
            let admin = Self::env().caller();
            let mut plan_prices = Mapping::default();
            plan_prices.insert(1, &base_price);
            plan_prices.insert(2, &plus_price);

            Self {
                admin,
                plan_prices,
                subscriptions: Mapping::default(),
                known_subscribers: Mapping::default(),
                subscribers: Vec::new(),
            }
        }

        #[ink(message)]
        pub fn set_plan_price(&mut self, plan_key: u8, price: Balance) -> Result<()> {
            self.ensure_admin()?;
            if plan_key == 0 {
                return Err(Error::InvalidPlan);
            }
            self.plan_prices.insert(plan_key, &price);
            self.env().emit_event(PlanPriceUpdated { plan_key, price });
            Ok(())
        }

        #[ink(message, payable)]
        pub fn pay_subscription(&mut self, team: AccountId, plan_key: u8) -> Result<Timestamp> {
            let paid_until = self.activate_subscription(team, plan_key)?;
            self.env().emit_event(SubscriptionPaid {
                team,
                plan_key,
                paid_until,
            });
            Ok(paid_until)
        }

        #[ink(message, payable)]
        pub fn renew_subscription(&mut self, plan_key: u8) -> Result<Timestamp> {
            let team = self.env().caller();
            let paid_until = self.activate_subscription(team, plan_key)?;
            self.env().emit_event(SubscriptionRenewed {
                team,
                plan_key,
                paid_until,
            });
            Ok(paid_until)
        }

        #[ink(message)]
        pub fn cancel_subscription(&mut self) -> Result<()> {
            self.cancel_for(self.env().caller())
        }

        #[ink(message)]
        pub fn cancel_subscription_for(&mut self, team: AccountId) -> Result<()> {
            self.ensure_admin()?;
            self.cancel_for(team)
        }

        #[ink(message)]
        pub fn set_auto_renew(&mut self, enabled: bool) -> Result<()> {
            let team = self.env().caller();
            let mut subscription = self.subscriptions.get(team).unwrap_or(Subscription {
                plan_key: 0,
                paid_until: 0,
                canceled_at: 0,
                auto_renew: false,
            });
            subscription.auto_renew = enabled;
            self.subscriptions.insert(team, &subscription);
            self.env().emit_event(AutoRenewalUpdated { team, enabled });
            Ok(())
        }

        #[ink(message)]
        pub fn withdraw(&mut self, recipient: AccountId, amount: Balance) -> Result<()> {
            self.ensure_admin()?;
            let balance = self.env().balance();
            let payout = if amount == 0 { balance } else { amount };
            if payout == 0 {
                return Err(Error::EmptyBalance);
            }
            if payout > balance {
                return Err(Error::InsufficientBalance);
            }
            self.env()
                .transfer(recipient, payout)
                .map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(TreasuryWithdrawn {
                recipient,
                amount: payout,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn plan_price(&self, plan_key: u8) -> Balance {
            self.plan_prices.get(plan_key).unwrap_or(0)
        }

        #[ink(message)]
        pub fn paid_until(&self, team: AccountId) -> Timestamp {
            self.subscriptions
                .get(team)
                .map_or(0, |subscription| subscription.paid_until)
        }

        #[ink(message)]
        pub fn is_subscription_active(&self, team: AccountId) -> bool {
            self.paid_until(team) > self.env().block_timestamp()
        }

        #[ink(message)]
        pub fn subscription_of(&self, team: AccountId) -> Option<Subscription> {
            self.subscriptions.get(team)
        }

        #[ink(message)]
        pub fn subscriber_count(&self) -> u32 {
            self.subscribers.len() as u32
        }

        #[ink(message)]
        pub fn subscriber_at(&self, index: u32) -> Option<AccountId> {
            self.subscribers.get(index as usize).copied()
        }

        #[ink(message)]
        pub fn subscribers(&self, offset: u32, limit: u32) -> Vec<AccountId> {
            let total = self.subscribers.len() as u32;
            if offset >= total || limit == 0 {
                return Vec::new();
            }

            let end = core::cmp::min(total, offset.saturating_add(limit));
            let mut page = Vec::new();
            let mut index = offset;
            while index < end {
                if let Some(account) = self.subscribers.get(index as usize) {
                    page.push(*account);
                }
                index = index.saturating_add(1);
            }
            page
        }

        #[ink(message)]
        pub fn admin(&self) -> AccountId {
            self.admin
        }

        fn activate_subscription(&mut self, team: AccountId, plan_key: u8) -> Result<Timestamp> {
            if plan_key == 0 {
                return Err(Error::InvalidPlan);
            }
            let price = self.plan_prices.get(plan_key).unwrap_or(0);
            if price == 0 {
                return Err(Error::UnknownPlan);
            }
            if self.env().transferred_value() != price {
                return Err(Error::IncorrectPayment);
            }

            let mut subscription = self.subscriptions.get(team).unwrap_or(Subscription {
                plan_key,
                paid_until: 0,
                canceled_at: 0,
                auto_renew: false,
            });
            let now = self.env().block_timestamp();
            let start = if subscription.paid_until > now {
                subscription.paid_until
            } else {
                now
            };
            let paid_until = start.saturating_add(PERIOD);

            if !self.known_subscribers.get(team).unwrap_or(false) {
                self.known_subscribers.insert(team, &true);
                self.subscribers.push(team);
            }

            subscription.plan_key = plan_key;
            subscription.paid_until = paid_until;
            subscription.canceled_at = 0;
            self.subscriptions.insert(team, &subscription);
            Ok(paid_until)
        }

        fn cancel_for(&mut self, team: AccountId) -> Result<()> {
            let mut subscription = self
                .subscriptions
                .get(team)
                .ok_or(Error::NoActiveSubscription)?;
            let now = self.env().block_timestamp();
            if subscription.paid_until <= now {
                return Err(Error::NoActiveSubscription);
            }

            subscription.paid_until = now;
            subscription.canceled_at = now;
            subscription.auto_renew = false;
            self.subscriptions.insert(team, &subscription);
            self.env().emit_event(SubscriptionCanceled {
                team,
                canceled_at: now,
            });
            Ok(())
        }

        fn ensure_admin(&self) -> Result<()> {
            if self.env().caller() == self.admin {
                Ok(())
            } else {
                Err(Error::NotAuthorized)
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
        fn pays_and_cancels_subscription() {
            let accounts = accounts();
            test::set_value_transferred::<ink::env::DefaultEnvironment>(100);
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(1_000);
            let mut contract = PortalKuboSubscriptionManager::new(100, 200);

            let paid_until = contract
                .pay_subscription(accounts.alice, 1)
                .expect("payment should succeed");
            assert!(paid_until > 1_000);
            assert!(contract.is_subscription_active(accounts.alice));
            assert_eq!(contract.subscriber_count(), 1);

            contract
                .cancel_subscription()
                .expect("cancel should succeed");
            assert!(!contract.is_subscription_active(accounts.alice));
        }

        #[ink::test]
        fn rejects_wrong_payment_amount() {
            test::set_value_transferred::<ink::env::DefaultEnvironment>(99);
            let mut contract = PortalKuboSubscriptionManager::new(100, 200);

            assert_eq!(
                contract.renew_subscription(1),
                Err(Error::IncorrectPayment)
            );
        }
    }
}
