#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_kubo_stablecoin {
    use ink::prelude::string::String;
    use ink::storage::Mapping;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotAdmin,
        InsufficientBalance,
        InsufficientAllowance,
        ZeroAddress,
        Overflow,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(storage)]
    pub struct PortalKuboStablecoin {
        admin: AccountId,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: Balance,
        balances: Mapping<AccountId, Balance>,
        allowances: Mapping<(AccountId, AccountId), Balance>,
    }

    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }

    #[ink(event)]
    pub struct Approval {
        #[ink(topic)]
        owner: AccountId,
        #[ink(topic)]
        spender: AccountId,
        value: Balance,
    }

    impl PortalKuboStablecoin {
        #[ink(constructor)]
        pub fn new(initial_supply: Balance) -> Self {
            let admin = Self::env().caller();
            let mut balances = Mapping::default();
            balances.insert(admin, &initial_supply);

            Self {
                admin,
                name: String::from("PortalKubo Stablecoin"),
                symbol: String::from("kUSD"),
                decimals: 14,
                total_supply: initial_supply,
                balances,
                allowances: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn name(&self) -> String {
            self.name.clone()
        }

        #[ink(message)]
        pub fn symbol(&self) -> String {
            self.symbol.clone()
        }

        #[ink(message)]
        pub fn decimals(&self) -> u8 {
            self.decimals
        }

        #[ink(message)]
        pub fn total_supply(&self) -> Balance {
            self.total_supply
        }

        #[ink(message)]
        pub fn balance_of(&self, owner: AccountId) -> Balance {
            self.balance_of_or_zero(owner)
        }

        #[ink(message)]
        pub fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance {
            self.allowances.get((owner, spender)).unwrap_or(0)
        }

        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, value: Balance) -> Result<()> {
            let from = self.env().caller();
            self.transfer_from_to(from, to, value)
        }

        #[ink(message)]
        pub fn approve(&mut self, spender: AccountId, value: Balance) -> Result<()> {
            let owner = self.env().caller();
            self.allowances.insert((owner, spender), &value);
            self.env().emit_event(Approval {
                owner,
                spender,
                value,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
        ) -> Result<()> {
            let spender = self.env().caller();
            let allowance = self.allowance(from, spender);
            if allowance < value {
                return Err(Error::InsufficientAllowance);
            }

            let next_allowance = allowance
                .checked_sub(value)
                .ok_or(Error::InsufficientAllowance)?;
            self.allowances.insert((from, spender), &next_allowance);
            self.transfer_from_to(from, to, value)
        }

        #[ink(message)]
        pub fn mint(&mut self, to: AccountId, value: Balance) -> Result<()> {
            self.ensure_admin()?;
            if to == AccountId::from([0u8; 32]) {
                return Err(Error::ZeroAddress);
            }

            let next_supply = self
                .total_supply
                .checked_add(value)
                .ok_or(Error::Overflow)?;
            let next_balance = self
                .balance_of_or_zero(to)
                .checked_add(value)
                .ok_or(Error::Overflow)?;

            self.total_supply = next_supply;
            self.balances.insert(to, &next_balance);
            self.env().emit_event(Transfer {
                from: None,
                to: Some(to),
                value,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn burn(&mut self, value: Balance) -> Result<()> {
            let owner = self.env().caller();
            let balance = self.balance_of_or_zero(owner);
            if balance < value {
                return Err(Error::InsufficientBalance);
            }

            let next_balance = balance
                .checked_sub(value)
                .ok_or(Error::InsufficientBalance)?;
            self.balances.insert(owner, &next_balance);
            self.total_supply = self.total_supply.saturating_sub(value);
            self.env().emit_event(Transfer {
                from: Some(owner),
                to: None,
                value,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn admin(&self) -> AccountId {
            self.admin
        }

        fn transfer_from_to(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
        ) -> Result<()> {
            if to == AccountId::from([0u8; 32]) {
                return Err(Error::ZeroAddress);
            }

            let from_balance = self.balance_of_or_zero(from);
            if from_balance < value {
                return Err(Error::InsufficientBalance);
            }

            let to_balance = self
                .balance_of_or_zero(to)
                .checked_add(value)
                .ok_or(Error::Overflow)?;

            let next_from_balance = from_balance
                .checked_sub(value)
                .ok_or(Error::InsufficientBalance)?;
            self.balances.insert(from, &next_from_balance);
            self.balances.insert(to, &to_balance);
            self.env().emit_event(Transfer {
                from: Some(from),
                to: Some(to),
                value,
            });
            Ok(())
        }

        fn balance_of_or_zero(&self, owner: AccountId) -> Balance {
            self.balances.get(owner).unwrap_or(0)
        }

        fn ensure_admin(&self) -> Result<()> {
            if self.env().caller() == self.admin {
                return Ok(());
            }

            Err(Error::NotAdmin)
        }
    }
}
