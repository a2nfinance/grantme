#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao_factory {
    use ink::prelude::vec::Vec;
    use dao::dao_contract::{
        DaoRef
    };
    #[ink(storage)]
    pub struct DaoFactory {
        owner_address: AccountId
        oracle: AccountId,
        daos: Vec<AccountId>,
        dao_code_hash: Hash
    }
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        CouldNotCreateDAO,
        SameDaoCodeHash,
        NotOwner
    }
    impl DaoFactory {
        // owner # deploy account
        #[ink(constructor)]
        pub fn new(owner: AccountId, oracle_address: AccountId, dao_code_hash: Hash) -> Self {
            Self { 
                owner: owner,
                owner_address: oracle_address,
                daos: Vec::new(),
                dao_code_hash: dao_code_hash
            }
        }

        #[ink(message)]
        pub fn create_dao(
            &mut self,
            name: String,
            description: String,
            website: String,
            email: String,
            address: String,
            social_accounts: Vec<String>,
            steps: Vec<Step>,
            step_members: Vec<Vec<AccountId>>,
            whitelisted_contributors: Vec<AccountId>,
            global_voting_quorum: u8,
            global_voting_threshold: u8,
            normal_members: Vec<AccountId>,
            open: bool,
            allow_revoting: bool,
        ) -> Result<(), Error> {
            let dao_ref = DaoRef::new(
                Self::env().caller(),
                name,
                description,
                website,
                email,
                address,
                social_accounts,
                steps,
                step_members,
                whitelisted_contributors,
                global_voting_quorum,
                global_voting_threshold,
                normal_members,
                open,
                allow_revoting
            )
            .endowment(0) /* Amount of value transferred as part of the call. 
                           * It should not be required but the API of `*Ref` pattern 
                           * does not allow for calling `instantiate()` 
                           * on a builder where `endowment` is not set.*/
            .code_hash(self.dao_code_hash)
            .salt_bytes(&[version.to_le_bytes().as_ref(), Self::env().caller().as_ref()].concat()[..4])
            .instantiate();

            let dao_address =
                <DaoRef as ToAccountId<
                    super::dao_factory::Environment,
                >>::to_account_id(&dao_ref);
            
            self.daos.push(dao_address);

            Ok(())
        }

        #[ink(message)]
        pub fn update_dao_code_hash(&mut self, new_dao_code_hash: Hash) -> Result<(), Error> {
            if Self::env().caller() != self.owner {
                return Err(Error::NotOwner);
            }

            if new_dao_code_hash == self.dao_code_hash {
                return Err(Error::SameDaoCodeHash);
            }


        }


    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

       
    }

}
