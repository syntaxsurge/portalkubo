#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_kubo_proof {
    use ink::prelude::string::String;
    use ink::storage::Mapping;

    #[derive(Clone, scale::Encode, scale::Decode, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct ProofRecord {
        owner: AccountId,
        proof_hash: Hash,
        objective_hash: Hash,
        proof_uri: String,
        created_at: Timestamp,
        updated_at: Timestamp,
    }

    #[derive(Clone, Copy, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        EmptyRunId,
        EmptyProofHash,
        EmptyObjectiveHash,
        EmptyProofUri,
        ProofAlreadyExists,
        ProofNotFound,
        NotAuthorized,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(storage)]
    pub struct PortalKuboProof {
        admin: AccountId,
        operators: Mapping<AccountId, bool>,
        proofs: Mapping<Hash, ProofRecord>,
        proof_count: u64,
    }

    #[ink(event)]
    pub struct ProofAnchored {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        owner: AccountId,
        proof_hash: Hash,
        objective_hash: Hash,
        proof_uri: String,
    }

    #[ink(event)]
    pub struct ProofReplaced {
        #[ink(topic)]
        run_id: Hash,
        #[ink(topic)]
        owner: AccountId,
        proof_hash: Hash,
        objective_hash: Hash,
        proof_uri: String,
    }

    #[ink(event)]
    pub struct OperatorUpdated {
        #[ink(topic)]
        operator: AccountId,
        enabled: bool,
    }

    impl PortalKuboProof {
        #[ink(constructor)]
        pub fn new() -> Self {
            let admin = Self::env().caller();
            let mut operators = Mapping::default();
            operators.insert(admin, &true);

            Self {
                admin,
                operators,
                proofs: Mapping::default(),
                proof_count: 0,
            }
        }

        #[ink(message)]
        pub fn set_operator(&mut self, operator: AccountId, enabled: bool) -> Result<()> {
            self.ensure_admin()?;
            self.operators.insert(operator, &enabled);
            self.env().emit_event(OperatorUpdated { operator, enabled });
            Ok(())
        }

        #[ink(message)]
        pub fn anchor_own_proof(
            &mut self,
            run_id: Hash,
            proof_hash: Hash,
            objective_hash: Hash,
            proof_uri: String,
        ) -> Result<()> {
            let caller = self.env().caller();
            self.insert_proof(run_id, caller, proof_hash, objective_hash, proof_uri)
        }

        #[ink(message)]
        pub fn anchor_proof_for(
            &mut self,
            run_id: Hash,
            owner: AccountId,
            proof_hash: Hash,
            objective_hash: Hash,
            proof_uri: String,
        ) -> Result<()> {
            self.ensure_operator()?;
            self.insert_proof(run_id, owner, proof_hash, objective_hash, proof_uri)
        }

        #[ink(message)]
        pub fn replace_proof(
            &mut self,
            run_id: Hash,
            proof_hash: Hash,
            objective_hash: Hash,
            proof_uri: String,
        ) -> Result<()> {
            self.validate_hash(run_id, Error::EmptyRunId)?;
            self.validate_hash(proof_hash, Error::EmptyProofHash)?;
            self.validate_hash(objective_hash, Error::EmptyObjectiveHash)?;
            if proof_uri.is_empty() {
                return Err(Error::EmptyProofUri);
            }

            let mut record = self.proofs.get(run_id).ok_or(Error::ProofNotFound)?;
            let caller = self.env().caller();
            if caller != record.owner && !self.is_operator(caller) {
                return Err(Error::NotAuthorized);
            }

            record.proof_hash = proof_hash;
            record.objective_hash = objective_hash;
            record.proof_uri = proof_uri.clone();
            record.updated_at = self.env().block_timestamp();
            self.proofs.insert(run_id, &record);

            self.env().emit_event(ProofReplaced {
                run_id,
                owner: record.owner,
                proof_hash,
                objective_hash,
                proof_uri,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn proof_of(&self, run_id: Hash) -> Option<ProofRecord> {
            self.proofs.get(run_id)
        }

        #[ink(message)]
        pub fn proof_count(&self) -> u64 {
            self.proof_count
        }

        #[ink(message)]
        pub fn admin(&self) -> AccountId {
            self.admin
        }

        #[ink(message)]
        pub fn is_operator(&self, account: AccountId) -> bool {
            self.operators.get(account).unwrap_or(false)
        }

        fn insert_proof(
            &mut self,
            run_id: Hash,
            owner: AccountId,
            proof_hash: Hash,
            objective_hash: Hash,
            proof_uri: String,
        ) -> Result<()> {
            self.validate_hash(run_id, Error::EmptyRunId)?;
            self.validate_hash(proof_hash, Error::EmptyProofHash)?;
            self.validate_hash(objective_hash, Error::EmptyObjectiveHash)?;
            if proof_uri.is_empty() {
                return Err(Error::EmptyProofUri);
            }
            if self.proofs.contains(run_id) {
                return Err(Error::ProofAlreadyExists);
            }

            let record = ProofRecord {
                owner,
                proof_hash,
                objective_hash,
                proof_uri: proof_uri.clone(),
                created_at: self.env().block_timestamp(),
                updated_at: self.env().block_timestamp(),
            };

            self.proofs.insert(run_id, &record);
            self.proof_count = self.proof_count.saturating_add(1);
            self.env().emit_event(ProofAnchored {
                run_id,
                owner,
                proof_hash,
                objective_hash,
                proof_uri,
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

        fn ensure_operator(&self) -> Result<()> {
            if self.is_operator(self.env().caller()) {
                Ok(())
            } else {
                Err(Error::NotAuthorized)
            }
        }

        fn validate_hash(&self, value: Hash, error: Error) -> Result<()> {
            if value == Hash::from([0; 32]) {
                Err(error)
            } else {
                Ok(())
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn anchors_and_reads_proof() {
            let mut contract = PortalKuboProof::new();
            let run_id = Hash::from([1; 32]);
            let proof_hash = Hash::from([2; 32]);
            let objective_hash = Hash::from([3; 32]);

            contract
                .anchor_own_proof(run_id, proof_hash, objective_hash, String::from("ipfs://proof"))
                .expect("proof should be anchored");

            let record = contract.proof_of(run_id).expect("proof should exist");
            assert_eq!(record.proof_hash, proof_hash);
            assert_eq!(record.objective_hash, objective_hash);
            assert_eq!(record.proof_uri, String::from("ipfs://proof"));
            assert_eq!(contract.proof_count(), 1);
        }

        #[ink::test]
        fn prevents_duplicate_proofs() {
            let mut contract = PortalKuboProof::new();
            let run_id = Hash::from([1; 32]);
            let proof_hash = Hash::from([2; 32]);
            let objective_hash = Hash::from([3; 32]);

            assert!(contract
                .anchor_own_proof(run_id, proof_hash, objective_hash, String::from("ipfs://proof"))
                .is_ok());
            assert_eq!(
                contract.anchor_own_proof(
                    run_id,
                    proof_hash,
                    objective_hash,
                    String::from("ipfs://proof-2"),
                ),
                Err(Error::ProofAlreadyExists)
            );
        }
    }
}
