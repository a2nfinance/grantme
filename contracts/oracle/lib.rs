#![cfg_attr(not(feature = "std"), no_std, no_main)]

pub use self::oracle_anchor::TokenPriceStorageRef;

#[ink::contract]
pub mod oracle_anchor {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::{traits::ManualKey, Lazy, Mapping};

    use dia_oracle_getter::OracleGetters;
    use dia_oracle_setter::OracleSetters;

    #[ink::storage_item]
    struct TokenPriceStruct {
        owner: AccountId,
        updater: AccountId,
        pairs: Mapping<String, (u64, u128)>,
    }

    #[ink(storage)]
    pub struct TokenPriceStorage {
        data: Lazy<TokenPriceStruct, ManualKey<0x1>>,
    }

    #[ink(event)]
    pub struct OwnershipTransferred {
        #[ink(topic)]
        previous_owner: Option<AccountId>,
        #[ink(topic)]
        new_owner: AccountId,
    }

    #[ink(event)]
    pub struct UpdaterChanged {
        #[ink(topic)]
        old: Option<AccountId>,
        #[ink(topic)]
        new: AccountId,
    }

    #[ink(event)]
    pub struct TokenPriceChanged {
        #[ink(topic)]
        pair: String,
        price: u128,
        timestamp: u64,
    }

    impl OracleSetters for TokenPriceStorage {
        #[ink(message)]
        fn transfer_ownership(&mut self, new_owner: AccountId) {
            let caller: AccountId = self.env().caller();

            let mut tps: TokenPriceStruct = self.data.get().expect("self.data not set");

            assert!(caller == tps.owner, "only owner can transfer ownership");
            tps.owner = new_owner;
            self.data.set(&tps);
            self.env().emit_event(OwnershipTransferred {
                previous_owner: Some(caller),
                new_owner,
            });
        }

        #[ink(message)]
        fn set_updater(&mut self, updater: AccountId) {
            let caller: AccountId = self.env().caller();

            let mut tps: TokenPriceStruct = self.data.get().expect("self.data not set");

            assert!(caller == tps.owner, "only owner can set updater");
            tps.updater = updater;
            self.data.set(&tps);
            self.env().emit_event(UpdaterChanged {
                old: Some(caller),
                new: updater,
            });
        }

        #[ink(message)]
        fn set_price(&mut self, pair: String, price: u128) {
            let caller: AccountId = self.env().caller();
            let mut tps: TokenPriceStruct = self.data.get().expect("self.data not set");
            assert!(caller == tps.updater, "only updater can set price");
            let current_timestamp: u64 = self.env().block_timestamp();

            // create new record

            tps.pairs.insert(pair.clone(), &(current_timestamp, price));

            self.data.set(&tps);

            self.env().emit_event(TokenPriceChanged {
                pair,
                price,
                timestamp: current_timestamp,
            });
        }

        #[ink(message)]
        fn set_prices(&mut self, pairs: Vec<(String, u128)>) {
            let caller: AccountId = self.env().caller();
            let mut tps: TokenPriceStruct = self.data.get().expect("self.data not set");
            assert!(caller == tps.updater, "only updater can set price");
            let current_timestamp: u64 = self.env().block_timestamp();

            // create new record
            for (pair, price) in pairs {
                tps.pairs.insert(pair.clone(), &(current_timestamp, price));
                self.env().emit_event(TokenPriceChanged {
                    pair,
                    price,
                    timestamp: current_timestamp,
                });
            }

            self.data.set(&tps);
        }
    }

    impl OracleGetters for TokenPriceStorage {
        #[ink(message)]
        fn get_updater(&self) -> AccountId {
            self.data.get().unwrap().updater
        }

        #[ink(message)]
        fn get_latest_price(&self, pair: String) -> Option<(u64, u128)> {
            self.data.get().unwrap().pairs.get(pair)
        }

        #[ink(message)]
        fn get_latest_prices(&self, pairs: Vec<String>) -> Vec<Option<(u64, u128)>> {
            let mut result = Vec::new();
            let data = self.data.get().unwrap();
            for pair in pairs {
                result.push(data.pairs.get(pair));
            }
            result
        }
    }

    impl Default for TokenPriceStorage {
        fn default() -> Self {
            Self::new()
        }
    }

    impl TokenPriceStorage {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller: AccountId = Self::env().caller();
            Self::env().emit_event(OwnershipTransferred {
                previous_owner: None,
                new_owner: caller,
            });
            Self::env().emit_event(UpdaterChanged {
                old: None,
                new: caller,
            });

            let tps = TokenPriceStruct {
                owner: caller,
                updater: caller,
                pairs: Mapping::new(),
            };

            let mut ldata = Lazy::new();
            ldata.set(&tps);

            Self { data: ldata }
        }

        #[ink(message)]
        pub fn code_hash(&self) -> Hash {
            self.env().own_code_hash().unwrap_or(Default::default())
        }

        #[ink(message)]
        pub fn set_code(&mut self, code_hash: [u8; 32]) {
            let caller: AccountId = self.env().caller();
            let tps: TokenPriceStruct = self.data.get().expect("self.data not set");
            assert!(caller == tps.owner, "only owner can set set code");

            ink::env::set_code_hash(&code_hash).unwrap_or_else(|err| {
                panic!("Failed to `set_code_hash` to {code_hash:?} due to {err:?}")
            });
            ink::env::debug_println!("Switched code hash to {:?}.", code_hash);
        }
    }
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::{
            env::hash::{Blake2x256, CryptoHash, HashOutput},
            primitives::Clear,
        };

        struct PrefixedValue<'a, 'b, T> {
            pub prefix: &'a [u8],
            pub value: &'b T,
        }

        impl<X> scale::Encode for PrefixedValue<'_, '_, X>
        where
            X: scale::Encode,
        {
            #[inline]
            fn size_hint(&self) -> usize {
                self.prefix.size_hint() + self.value.size_hint()
            }

            #[inline]
            fn encode_to<T: scale::Output + ?Sized>(&self, dest: &mut T) {
                self.prefix.encode_to(dest);
                self.value.encode_to(dest);
            }
        }

        #[ink::test]
        fn default_works() {
            let token_price_storage: TokenPriceStorage = TokenPriceStorage::new();
            assert_eq!(
                token_price_storage.get_latest_price("abc".to_string()),
                None
            );
        }

        type Event = <TokenPriceStorage as ::ink::reflect::ContractEventBase>::Type;

        fn assert_transfer_ownership_event(
            event: &ink::env::test::EmittedEvent,
            expected_old: Option<AccountId>,
            expected_new: AccountId,
        ) {
            let decoded_event = <Event as scale::Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer");
            if let Event::OwnershipTransferred(OwnershipTransferred {
                previous_owner,
                new_owner,
            }) = decoded_event
            {
                assert_eq!(
                    previous_owner, expected_old,
                    "encountered invalid OwnershipTransferred.old"
                );
                assert_eq!(
                    new_owner, expected_new,
                    "encountered invalid OwnershipTransferred.new"
                );
            } else {
                panic!("encountered unexpected event kind: expected a OwnershipTransferred event")
            }

            fn encoded_into_hash<T>(entity: &T) -> Hash
            where
                T: scale::Encode,
            {
                let mut result: ink::primitives::Hash = Hash::CLEAR_HASH;
                let len_result: usize = result.as_ref().len();
                let encoded: Vec<u8> = entity.encode();
                let len_encoded: usize = encoded.len();
                if len_encoded <= len_result {
                    result.as_mut()[..len_encoded].copy_from_slice(&encoded);
                    return result;
                }
                let mut hash_output: [u8; 32] =
                    <<Blake2x256 as HashOutput>::Type as Default>::default();
                <Blake2x256 as CryptoHash>::hash(&encoded, &mut hash_output);
                let copy_len: usize = core::cmp::min(hash_output.len(), len_result);
                result.as_mut()[0..copy_len].copy_from_slice(&hash_output[0..copy_len]);
                result
            }

            let expected_topics: [Hash; 3] = [
                encoded_into_hash(&PrefixedValue {
                    prefix: b"",
                    value: b"TokenPriceStorage::OwnershipTransferred",
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::OwnershipTransferred::previous_owner",
                    value: &expected_old,
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::OwnershipTransferred::new_owner",
                    value: &expected_new,
                }),
            ];
            for (n, (actual_topic, expected_topic)) in
                event.topics.iter().zip(expected_topics).enumerate()
            {
                let topic: Hash = <Hash as scale::Decode>::decode(&mut &actual_topic[..])
                    .expect("encountered invalid topic encoding");
                assert_eq!(topic, expected_topic, "encountered invalid topic at {n}");
            }
        }

        fn assert_updater_event(
            event: &ink::env::test::EmittedEvent,
            expected_old: Option<AccountId>,
            expected_new: AccountId,
        ) {
            let decoded_event = <Event as scale::Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer");
            if let Event::UpdaterChanged(UpdaterChanged { old, new }) = decoded_event {
                assert_eq!(old, expected_old, "encountered invalid UpdaterChanged.old");
                assert_eq!(new, expected_new, "encountered invalid UpdaterChanged.new");
            } else {
                panic!("encountered unexpected event kind: expected a UpdaterChanged event")
            }

            fn encoded_into_hash<T>(entity: &T) -> Hash
            where
                T: scale::Encode,
            {
                let mut result: ink::primitives::Hash = Hash::CLEAR_HASH;
                let len_result: usize = result.as_ref().len();
                let encoded: Vec<u8> = entity.encode();
                let len_encoded: usize = encoded.len();
                if len_encoded <= len_result {
                    result.as_mut()[..len_encoded].copy_from_slice(&encoded);
                    return result;
                }
                let mut hash_output: [u8; 32] =
                    <<Blake2x256 as HashOutput>::Type as Default>::default();
                <Blake2x256 as CryptoHash>::hash(&encoded, &mut hash_output);
                let copy_len: usize = core::cmp::min(hash_output.len(), len_result);
                result.as_mut()[0..copy_len].copy_from_slice(&hash_output[0..copy_len]);
                result
            }

            let expected_topics: [Hash; 3] = [
                encoded_into_hash(&PrefixedValue {
                    prefix: b"",
                    value: b"TokenPriceStorage::UpdaterChanged",
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::UpdaterChanged::old",
                    value: &expected_old,
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::UpdaterChanged::new",
                    value: &expected_new,
                }),
            ];
            for (n, (actual_topic, expected_topic)) in
                event.topics.iter().zip(expected_topics).enumerate()
            {
                let topic: Hash = <Hash as scale::Decode>::decode(&mut &actual_topic[..])
                    .expect("encountered invalid topic encoding");
                assert_eq!(topic, expected_topic, "encountered invalid topic at {n}");
            }
        }

        fn assert_token_price_changed_event(
            event: &ink::env::test::EmittedEvent,
            expected_pair: String,
            expected_price: u128,
            expected_timestamp: u64,
        ) {
            let decoded_event = <Event as scale::Decode>::decode(&mut &event.data[..])
                .expect("encountered invalid contract event data buffer");
            if let Event::TokenPriceChanged(TokenPriceChanged {
                pair,
                price,
                timestamp,
            }) = decoded_event
            {
                assert_eq!(
                    pair, expected_pair,
                    "encountered invalid TokenPriceChanged.pair"
                );
                assert_eq!(
                    price, expected_price,
                    "encountered invalid TokenPriceChanged.price"
                );
                assert_eq!(
                    timestamp, expected_timestamp,
                    "encountered invalid TokenPriceChanged.timestamp"
                );
            } else {
                panic!("encountered unexpected event kind: expected a TokenPriceChanged event")
            }

            fn encoded_into_hash<T>(entity: &T) -> Hash
            where
                T: scale::Encode,
            {
                let mut result: Hash = Hash::CLEAR_HASH;
                let len_result: usize = result.as_ref().len();
                let encoded: Vec<u8> = entity.encode();
                let len_encoded: usize = encoded.len();
                if len_encoded <= len_result {
                    result.as_mut()[..len_encoded].copy_from_slice(&encoded);
                    return result;
                }
                let mut hash_output: [u8; 32] =
                    <<Blake2x256 as HashOutput>::Type as Default>::default();
                <Blake2x256 as CryptoHash>::hash(&encoded, &mut hash_output);
                let copy_len: usize = core::cmp::min(hash_output.len(), len_result);
                result.as_mut()[0..copy_len].copy_from_slice(&hash_output[0..copy_len]);
                result
            }

            let expected_topics: [Hash; 4] = [
                encoded_into_hash(&PrefixedValue {
                    prefix: b"",
                    value: b"TokenPriceStorage::TokenPriceChanged",
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::TokenPriceChanged::pair",
                    value: &expected_pair,
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::TokenPriceChanged::price",
                    value: &expected_price,
                }),
                encoded_into_hash(&PrefixedValue {
                    prefix: b"TokenPriceStorage::TokenPriceChanged::timestamp",
                    value: &expected_timestamp,
                }),
            ];
            for (n, (actual_topic, expected_topic)) in
                event.topics.iter().zip(expected_topics).enumerate()
            {
                let topic: Hash = <Hash as scale::Decode>::decode(&mut &actual_topic[..])
                    .expect("encountered invalid topic encoding");
                assert_eq!(topic, expected_topic, "encountered invalid topic at {n}");
            }
        }

        #[ink::test]
        fn transfer_ownership_works() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();
            token_price_storage.transfer_ownership(AccountId::from([0x02; 32]));
            assert_eq!(
                token_price_storage.data.get().unwrap().owner,
                AccountId::from([0x02; 32]),
                "transfer ownership failed"
            );

            let emitted_events: Vec<ink::env::test::EmittedEvent> =
                ink::env::test::recorded_events().collect::<Vec<_>>();
            assert_eq!(emitted_events.len(), 3);
            assert_transfer_ownership_event(&emitted_events[0], None, AccountId::from([0x01; 32]));
            assert_transfer_ownership_event(
                &emitted_events[2],
                Some(AccountId::from([0x01; 32])),
                AccountId::from([0x02; 32]),
            );
        }

        #[ink::test]
        fn set_updater_works() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();
            token_price_storage.set_updater(AccountId::from([0x02; 32]));
            assert_eq!(
                token_price_storage.get_updater(),
                AccountId::from([0x02; 32])
            );

            let emitted_events: Vec<ink::env::test::EmittedEvent> =
                ink::env::test::recorded_events().collect::<Vec<_>>();
            assert_eq!(emitted_events.len(), 3);
            assert_updater_event(&emitted_events[1], None, AccountId::from([0x01; 32]));
            assert_updater_event(
                &emitted_events[2],
                Some(AccountId::from([0x01; 32])),
                AccountId::from([0x02; 32]),
            );
        }

        #[ink::test]
        fn set_price_works() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();

            const PRICE: u128 = 1001;
            token_price_storage.set_price("abc".to_string(), PRICE);
            assert_eq!(
                token_price_storage.get_latest_price("abc".to_string()),
                Some((0, PRICE))
            );

            assert_token_price_changed_event(
                &ink::env::test::recorded_events().collect::<Vec<_>>()[2],
                "abc".to_string(),
                PRICE,
                0,
            );
        }

        #[ink::test]
        fn set_price_multiple_works() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();

            const PRICE: u128 = 1001;

            token_price_storage.set_price("abc".to_string(), PRICE);

            let mut latest_price = token_price_storage.get_latest_price("abc".to_string());
            assert_eq!(latest_price, Some((0, PRICE)));

            token_price_storage.set_price("abc".to_string(), PRICE + 10);

            latest_price = token_price_storage.get_latest_price("abc".to_string());

            assert_eq!(latest_price, Some((0, PRICE + 10)));
        }

        #[ink::test]
        #[should_panic]
        fn set_price_panic() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();
            // change caller
            let account: AccountId = AccountId::from([0x2; 32]);
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(account);
            token_price_storage.set_price("abc".to_string(), 100);
        }

        #[ink::test]
        #[should_panic]
        fn set_updater_panic() {
            let mut token_price_storage: TokenPriceStorage = TokenPriceStorage::new();
            // change caller
            let account: AccountId = AccountId::from([0x2; 32]);
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(account);
            token_price_storage.set_updater(AccountId::from([0x01; 32]));
        }
    }
    #[cfg(all(test, feature = "e2e-tests"))]
    #[cfg_attr(all(test, feature = "e2e-tests"), allow(unused_imports))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::build_message;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = TokenPriceStorageRef::new();
            const PRICE: u128 = 1001;

            let contract_acc_id = client
                .instantiate("dia_oracle", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            let set_price_message = build_message::<TokenPriceStorageRef>(contract_acc_id)
                .call(|tps| tps.set_price("abc".to_string(), PRICE));

            let _set_price_res = client
                .call(&ink_e2e::alice(), set_price_message, 0, None)
                .await
                .expect("set failed");

            let get_price_message = build_message::<TokenPriceStorageRef>(contract_acc_id)
                .call(|tps| tps.get_latest_price("abc".to_string()));

            let get_price_res = client
                .call(&ink_e2e::alice(), get_price_message, 0, None)
                .await
                .expect("get failed");

            let price = get_price_res.return_value().expect("Value is None").1;
            assert_eq!(price, PRICE);

            Ok(())
        }
    }
}
