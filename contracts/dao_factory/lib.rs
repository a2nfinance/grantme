#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao_factory {
    use dao::{DaoRef, Step};
    use ink::prelude::vec::Vec;
    use ink::ToAccountId;
    use ink::prelude::string::String;
    #[ink(storage)]
    pub struct DaoFactory {
        owner: AccountId,
        oracle_address: AccountId,
        daos: Vec<AccountId>,
        dao_code_hash: Hash,
    }
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum DaoFactoryError {
        CouldNotCreateDAO,
        SameDaoCodeHash,
        NotOwner,
    }
    impl DaoFactory {
        // owner # deploy account
        #[ink(constructor)]
        pub fn new(owner: AccountId, oracle_address: AccountId, dao_code_hash: Hash) -> Self {
            Self {
                owner: owner,
                oracle_address: oracle_address,
                daos: Vec::new(),
                dao_code_hash: dao_code_hash,
            }
        }

        #[ink(message)]
        pub fn create_dao(
            &mut self,
            version: u8,
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
        ) -> Result<AccountId, DaoFactoryError> {
            let dao_ref = DaoRef::new(
                self.oracle_address,
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
                allow_revoting,
            )
            .endowment(0) /* Amount of value transferred as part of the call.
             * It should not be required but the API of `*Ref` pattern
             * does not allow for calling `instantiate()`
             * on a builder where `endowment` is not set.*/
            .code_hash(self.dao_code_hash)
            .salt_bytes(
                &[
                    version.to_le_bytes().as_ref(),
                    Self::env().caller().as_ref(),
                ]
                .concat()[..4],
            )
            .try_instantiate().map_err(|_| DaoFactoryError::CouldNotCreateDAO).unwrap().unwrap();

            let dao_address =
                <DaoRef as ToAccountId<super::dao_factory::Environment>>::to_account_id(&dao_ref);
            self.daos.push(dao_address);

            Ok(dao_address)
        }

        #[ink(message)]
        pub fn update_dao_code_hash(
            &mut self,
            new_dao_code_hash: Hash,
        ) -> Result<(), DaoFactoryError> {
            if Self::env().caller() != self.owner {
                return Err(DaoFactoryError::NotOwner);
            }

            if new_dao_code_hash == self.dao_code_hash {
                return Err(DaoFactoryError::SameDaoCodeHash);
            }

            self.dao_code_hash = new_dao_code_hash;

            Ok(())
        }

        #[ink(message)]
        pub fn get_dao_hash(&self) -> Hash {
            self.dao_code_hash
        }

        #[ink(message)]
        pub fn get_daos(&self) -> Vec<AccountId> {
            self.daos.to_vec()
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        #[ink::test]
        fn test_new_constructor() {
            let owner: AccountId = AccountId::from([0x01; 32]);
            let oracle_address: AccountId = AccountId::from([0x02; 32]);
            let dao_code_hash: Hash = Hash::from([0x03; 32]);
            let new_dao_code_hash: Hash = Hash::from([0x04; 32]);

            let mut dao_factory: DaoFactory = DaoFactory::new(owner, oracle_address, dao_code_hash);
            assert_eq!(dao_factory.get_dao_hash(), dao_code_hash);
            let update_dao_code_hash: Result<(), DaoFactoryError> =
                dao_factory.update_dao_code_hash(new_dao_code_hash);

            assert_eq!(update_dao_code_hash.is_ok(), true);
        }
    }

    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::build_message;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test(additional_contracts = "../dao/Cargo.toml")]
        async fn test_create_dao(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Mock DATA
            let owner: AccountId = AccountId::from([0x01; 32]);
            let oracle_address: AccountId = AccountId::from([0x02; 32]);

            let step1_member = AccountId::from([0x05; 32]);
            let step2_member = AccountId::from([0x06; 32]);
            let whitelisted_contributor = AccountId::from([0x07; 32]);
            let normal_member = AccountId::from([0x08; 32]);

            // Upload DAO contract and get code hash.

            let dao_code_hash = client
            .upload("dao", &ink_e2e::bob(), None)
            .await
            .expect("uploading `updated_incrementer` failed")
            .code_hash;
            let dao_code_hash = dao_code_hash.as_ref().try_into().unwrap();

            // Init DAO Factory contract with params
            let constructor = DaoFactoryRef::new(owner, oracle_address, dao_code_hash);
            let dao_factory_account_id = client
                .instantiate("dao_factory", &ink_e2e::bob(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            // Create a new DAO.
            let create_dao = build_message::<DaoFactoryRef>(dao_factory_account_id.clone())
                .call(|dao_factory| dao_factory.create_dao(
                    1,
                    "Name".to_string(),
                    "Description".to_string(),
                    "Website".to_string(),
                    "Email".to_string(),
                    "Address".to_string(),
                    vec!["twitter".to_string(), "facebook".to_string()],
                    vec![
                        Step {
                            step_index: 0,
                            title: "Step 1".to_string(),
                            use_default_settings: true,
                            quorum: 0,
                            threshold: 0,
                        },
                        Step {
                            step_index: 1,
                            title: "Step 2".to_string(),
                            use_default_settings: true,
                            quorum: 0,
                            threshold: 0,
                        },
                    ],
                    vec![vec![step1_member], vec![step2_member]],
                    vec![whitelisted_contributor],
                    100,
                    100,
                    vec![normal_member],
                    false,
                    false,
                ));

            let create_dao_result = client.call(&ink_e2e::alice(), create_dao, 0, None).await.expect("Create DAO failed");
                
            let mut dao_account_id: AccountId = AccountId::from([0x0; 32]);
            match create_dao_result.return_value() {
                Ok(dao_address) => dao_account_id = dao_address,
                _ => ()
            }     
            assert_ne!(dao_account_id.clone(), AccountId::from([0x0; 32]));

            // Test get the created dao information
            let get_dao_info = build_message::<DaoRef>(dao_account_id.clone())
            .call(|dao| dao.get_info());

            let get_dao_info_result = client.call(&ink_e2e::bob(), get_dao_info, 0, None).await.expect("Get failed");
            
            let dao_info = get_dao_info_result.return_value();

            assert_eq!(dao_info.2, "Name".to_string());

            // Test get_daos
            let get_daos = build_message::<DaoFactoryRef>(dao_factory_account_id.clone())
            .call(|dao_factory| dao_factory.get_daos());

            let get_daos_result = client.call(&ink_e2e::bob(), get_daos, 0, None).await.expect("Get failed");

            assert_eq!(get_daos_result.return_value().len(), 1);
            
            Ok(())
        }
        
    }
}
