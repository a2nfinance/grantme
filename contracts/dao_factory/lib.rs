#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao_factory {
    use dao::{DaoRef, Step};
    use ink::prelude::vec::Vec;
    use ink::ToAccountId;
    use ink::prelude::string::String;
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct DaoFactory {
        owner: AccountId,
        oracle_address: AccountId,
        daos: Vec<AccountId>,
        dao_code_hash: Hash,
        // Only whitelisted creators can create DAO when Open is false
        whitelisted_creators: Vec<AccountId>,
        // Num of creators' DAOs
        num_creator_daos: Mapping<AccountId, u8>,
        // How many DAOs a creator can create 
        limited_number: u8,
        // True: anyone can create new DAO, False: Only whitelisted creators
        open: bool,
        
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum DaoFactoryError {
        CouldNotCreateDAO,
        SameDaoCodeHash,
        NotOwner,
        DaoCreatorExisted,
        NotInWhitelistedCreators,
        ExceedLimitedDAONumber,
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
                whitelisted_creators: Vec::new(),
                num_creator_daos: Mapping::default(),
                limited_number: 5,
                open: true
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
            let caller = Self::env().caller();

            // Check creation previlege
            if !self.open {
                if !self.whitelisted_creators.contains(&caller) {
                    return Err(DaoFactoryError::NotInWhitelistedCreators);
                }
            }

            let num_creator_daos: u8 = self.num_creator_daos.get(caller).unwrap_or_default();
            if num_creator_daos >= 5 {
                return Err(DaoFactoryError::ExceedLimitedDAONumber);
            }


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
            self.num_creator_daos.insert(caller, &(num_creator_daos + 1));
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
        pub fn add_whitelisted_creator(&mut self, creator: AccountId) -> Result<(), DaoFactoryError> {
            
            // Only DAO Factory owner can do
            if Self::env().caller() != self.owner {
                return Err(DaoFactoryError::NotOwner);
            }

            // Whether the DAO creator is existed
            if self.whitelisted_creators.contains(&creator) {
                return Err(DaoFactoryError::DaoCreatorExisted);
            }

            // Add the whitelisted DAO creator here
            self.whitelisted_creators.push(creator);
            Ok(())
        }

        #[ink(message)]
        pub fn change_open(&mut self, open: bool) -> Result<(), DaoFactoryError> {
            // Only DAO Factory owner can do
            if Self::env().caller() != self.owner {
                return Err(DaoFactoryError::NotOwner);
            }

            self.open = open;
            Ok(())
        }

        #[ink(message)]
        pub fn change_limited_number(&mut self, limited_number: u8) -> Result<(), DaoFactoryError> {
            // Only DAO Factory owner can do
            if Self::env().caller() != self.owner {
                return Err(DaoFactoryError::NotOwner);
            }

            self.limited_number = limited_number;
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

        fn get_mock_accounts() -> (AccountId, AccountId) {
            let owner: AccountId = AccountId::from([0x01; 32]);
            let oracle_address: AccountId = AccountId::from([0x02; 32]);
            (owner, oracle_address)
        }

        fn init_dao_factory() -> DaoFactory {
            let dao_code_hash: Hash = Hash::from([0x03; 32]);
            let mock_accounts = get_mock_accounts();
            let dao_factory: DaoFactory = DaoFactory::new(mock_accounts.0, mock_accounts.1, dao_code_hash);
            dao_factory
        }

        #[ink::test]
        fn test_init() {
            let dao_code_hash: Hash = Hash::from([0x03; 32]);
            let dao_factory = init_dao_factory();
            let dao_hash = dao_factory.get_dao_hash();
            assert_eq!(dao_code_hash, dao_hash);
        }

        #[ink::test]
        fn test_update_dao_hash() {
          
            let new_dao_code_hash: Hash = Hash::from([0x04; 32]);
            let mut dao_factory = init_dao_factory();
            let update_dao_code_hash: Result<(), DaoFactoryError> =
                dao_factory.update_dao_code_hash(new_dao_code_hash);
            assert_eq!(update_dao_code_hash.is_ok(), true);

        }

        #[ink::test]
        fn test_add_whitelisted_creator() {
            let new_creator: AccountId = AccountId::from([0x03; 32]);
            let mut dao_factory = init_dao_factory();
            let add_creator: Result<(), DaoFactoryError> =
                dao_factory.add_whitelisted_creator(new_creator);
            assert_eq!(add_creator.is_ok(), true);
            
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
