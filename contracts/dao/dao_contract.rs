#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::prelude::string::String;
use ink::prelude::vec::Vec;
use crate::types::*;
use crate::errors::*;

#[ink::trait_definition]
pub trait IDao {
    #[ink(message)]
        pub fn get_info(
            &self,
        ) -> (
            AccountId,
            AccountId,
            String,
            String,
            String,
            String,
            String,
            Vec<String>,
            Vec<Step>,
            Vec<Proposal>,
            Vec<AccountId>,
            u8,
            u8,
            Vec<AccountId>,
            bool,
            bool,
        );

    #[ink(message)]
    pub fn create_proposal(
        &mut self,
        title: String,
        description: String,
        start_date: Timestamp,
        end_date: Timestamp,
        use_fiat: bool,
        payment_amount_fiat: u32,
        payment_amount_crypto: Balance,
        token: AccountId,
        to: AccountId,
        allow_early_executed: bool
    ) -> Result<(), Error>;

    #[ink(message)]
    pub fn voting(&mut self, proposal_index: u32, step: u8, value: u8) -> Result<(), Error>;

}

#[ink::contract]
pub mod dao {
    // use ink::contract_ref;
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;
    use crate::types::*;
    use crate::errors::*;


    #[ink(storage)]
    pub struct Dao {
        owner: AccountId,
        admin: AccountId,
        name: String,
        description: String,
        website: String,
        email: String,
        address: String,
        social_accounts: Vec<String>,
        steps: Vec<Step>,
        step_members: Vec<Vec<AccountId>>,
        proposals: Vec<Proposal>,
        // proposal index, step index, proposal voting
        proposal_voting_status: Mapping<(u32, u8), ProposalVoting>,
        whitelisted_contributors: Vec<AccountId>,
        global_voting_quorum: u8,
        global_voting_threshold: u8,
        normal_members: Vec<AccountId>,
        open: bool,
        status: bool,
        // Member address, proposal index, step index, value
        member_voted: Mapping<(AccountId, u32, u8), u8>,
        allow_revoting: bool
    }

    impl super::IDao for Dao {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(
            admin: AccountId,
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
            allow_revoting: bool
        ) -> Self {
            Self {
                owner: Self::env().caller(),
                admin: admin,
                name: name,
                description: description,
                website: website,
                email: email,
                address: address,
                social_accounts: social_accounts,
                steps: steps,
                step_members: step_members,
                proposals: Vec::new(),
                proposal_voting_status: Mapping::default(),
                whitelisted_contributors: whitelisted_contributors,
                global_voting_quorum: global_voting_quorum,
                global_voting_threshold: global_voting_threshold,
                normal_members: normal_members,
                open: open,
                status: true,
                member_voted: Mapping::default(),
                allow_revoting: allow_revoting
            }
        }
        // owner: AccountId,
        // admin: AccountId,
        // name: String,
        // description: String,
        // website: String,
        // email: String,
        // address: String,
        // social_accounts: Vec<String>,
        // steps: Vec<Step>,
        // proposals: Vec<Proposal>,
        // whitelisted_contributors: Vec<AccountId>,
        // global_voting_quorum: u8,
        // global_voting_threshold: u8,
        // normal_members: Vec<AccountId>,
        // status: bool
        #[ink(message)]
        pub fn get_info(
            &self,
        ) -> (
            AccountId,
            AccountId,
            String,
            String,
            String,
            String,
            String,
            Vec<String>,
            Vec<Step>,
            Vec<Proposal>,
            Vec<AccountId>,
            u8,
            u8,
            Vec<AccountId>,
            bool,
            bool,
        ) {
            (
                self.owner,
                self.admin.clone(),
                self.name.clone(),
                self.description.clone(),
                self.website.clone(),
                self.email.clone(),
                self.address.clone(),
                self.social_accounts.clone(),
                self.steps.clone(),
                self.proposals.clone(),
                self.whitelisted_contributors.clone(),
                self.global_voting_quorum.clone(),
                self.global_voting_threshold.clone(),
                self.normal_members.clone(),
                self.open,
                self.status,
            )
        }

        #[ink(message)]
        pub fn create_proposal(
            &mut self,
            title: String,
            description: String,
            start_date: Timestamp,
            end_date: Timestamp,
            use_fiat: bool,
            payment_amount_fiat: u32,
            payment_amount_crypto: Balance,
            token: AccountId,
            to: AccountId,
            allow_early_executed: bool
        ) -> Result<(), Error> {
            // Check whether guests or members are allowed to make a proposal.

            // Setup proposal
            let count_proposal = self.proposals.len() as u32;
            let proposal = Proposal {
                proposal_index: count_proposal,
                proposer: Self::env().caller(),
                title: title,
                description: description,
                start_date: start_date,
                end_date: end_date,
                use_fiat: use_fiat,
                payment_amount_fiat: payment_amount_fiat,
                payment_amount_crypto: payment_amount_crypto,
                token: token,
                to: to,
                allow_early_executed: allow_early_executed,
                executed: false
            };

            self.proposals.push(proposal);
            // Init proposal voting status
            let steps_len: u8 = self.steps.len() as u8;
            let mut i: u8 = 0;

            loop {
                if i >= steps_len {
                    break;
                }
                self.proposal_voting_status.insert(
                    (count_proposal, i),
                    &ProposalVoting {
                        agree: 0,
                        disagree: 0,
                        neutral: 0
                    },
                );
                i += 1;
            }

            Ok(())
        }
        // Value: 1 - agree, 2 - disagree, 3 - neutral
        #[ink(message)]
        pub fn voting(&mut self, proposal_index: u32, step: u8, value: u8) -> Result<(), Error> {
            let num_proposals: u32 = self.proposals.len() as u32;
            if proposal_index > num_proposals {
                return Err(Error::ProposalIndexOutOfBound);
            }
            // Check voting previlege
            // Must be step member
            if !self._is_allow_vote(step, Self::env().caller()) {
                return Err(Error::NotAllowVoting);
            }
            // Check time contraint
            let proposal: &Proposal = &self.proposals[proposal_index as usize];
            if proposal.start_date > Self::env().block_timestamp() {
                return Err(Error::VotingHasNotStarted);
            } 

            if proposal.end_date < Self::env().block_timestamp() {
                return Err(Error::VotingHasEnded);
            } 

            // Check member voted or not
            let mut voting_status: ProposalVoting = self.proposal_voting_status.get((proposal_index, step)).unwrap_or_default();

            let is_voted: u8 =  self.member_voted.get((Self::env().caller(), proposal_index, step)).unwrap_or_default();
            if is_voted != 0 {
                if self.allow_revoting {
                    let voted_value: u8 = self.member_voted.get((Self::env().caller(), proposal_index, step));
                    if voted_value == value {
                        return Err(Error::SameVotingOption);
                    }
                    if voted_value == 1 {
                        voting_status.agree -= 1;
                    }
                    if voted_value == 2 {
                        voting_status.disagree -= 1;
                    }
        
                    if voted_value == 3 {
                        voting_status.disagree -= 1;
                    }

                    self.member_voted.insert((Self::env().caller(), proposal_index, step), &value);

                } else {
                    return Err(Error::NotAllowRevoting);
                }
            } else {
                self.member_voted.insert((Self::env().caller(), proposal_index, step), &value);
            }
            
            if value == 1 {
                voting_status.agree += 1;
            }
            if value == 2 {
                voting_status.disagree += 1;
            }

            if value == 3 {
                voting_status.disagree += 1;
            }

            self.proposal_voting_status.insert((proposal_index, step), &voting_status);
            
            Ok(())

        }

        #[ink(message)]
        pub fn execute_proposal(&mut self, proposal_index: u32) -> Result<(), Error> {
            // Check index
            let num_proposals: u32 = self.proposals.len() as u32;
            if proposal_index > num_proposals {
                return Err(Error::ProposalIndexOutOfBound);
            }
            
            let proposal: &Proposal = &self.proposals[proposal_index as usize];
            let current_timestamp: Timestamp = Self::env().block_timestamp();
            // Check time contraints
            if current_timestamp < proposal.start_date {
                return Err(Error::VotingHasNotStarted);
            }
            // Check allow revoting, if yes must be disable allow early execute
            // Check allow early executed, if no, this proposal can be executed when the voting time has ended
            if self.allow_revoting || !proposal.allow_early_executed {

                if current_timestamp < proposal.end_date {
                    return Err(Error::VotingHasNotEnd);
                }
            } 

            // Check voting status
            let mut allow_executed: bool = true;
            let mut i: u8 = 0;
            let steps_len: u8 = self.steps.len() as u8;
            loop {
                if i >= steps_len {
                    break;
                }
                let step: &Step = &self.steps[i as usize];
                let voting_status: ProposalVoting = self.proposal_voting_status.get((proposal_index, i)).unwrap_or_default();
                let mut quorum = step.quorum;
                let mut threshold = step.threshold;
                if step.use_default_settings {
                   quorum = self.global_voting_quorum;
                   threshold = self.global_voting_threshold;
                }

                if !self._is_allow_executed(i, voting_status, threshold, quorum) {
                    allow_executed = false;
                    break;
                }
                i += 1;
            }

            // Executed here
            if allow_executed {
                let mut amount: Balance = 0;
                // Transfer token
                if proposal.use_fiat {
                    // Diadata here
                } else {
                    amount = proposal.payment_amount_crypto;
                }
                if self.env().transfer(proposal.to, amount).is_err() {
                    panic!("error transferring")
                }
                
            }

            Ok(())
            
        }

        #[ink(message)]
        pub fn get_steps_voting_status(&self, proposal_index: u32) -> Vec<ProposalVoting> {
            let mut step_votings: Vec<ProposalVoting> = Vec::new();
            let steps_len: u8 = self.steps.len() as u8;
            let mut i: u8 = 0;
            loop {
                if i >= steps_len {
                    break;
                }
                let step_voting: ProposalVoting = self.proposal_voting_status.get((proposal_index, i)).unwrap_or_default();
                step_votings.push(step_voting);
                i += 1;
            }
            step_votings
        }

        #[ink(message)]
        pub fn add_normal_member(&mut self, new_member: AccountId) -> Result<(), Error> {
            // Check normal member exist
            // Add normal member

            Ok(())
        }

        #[ink(message)]
        pub fn remove_normal_member(&mut self, new_member: AccountId) -> Result<(), Error> {
            // Check normal member exist
            // Add normal member

            Ok(())
        }

        #[ink(message)]
        pub fn add_step_members(&mut self, new_step_member: AccountId) -> Result<(), Error> {

            Ok(())
        }

        #[ink(message)]
        pub fn remove_step_members(&mut self, new_step_member: AccountId) -> Result<(), Error> {

            Ok(())
        }

        // Private functions

        fn _is_allow_executed(&self, step_index: u8, voting_status: ProposalVoting, threshold: u8, quorum: u8) -> bool {
            let mut is_allow_executed: bool = false;
            let agree: u32 = voting_status.agree;
            let disagree: u32 = voting_status.disagree;
            let neutral: u32 = voting_status.neutral;
            let members: &Vec<AccountId> = &self.step_members[step_index as usize];
            let member_len: u8 = members.len() as u8;
            if member_len > 0 {
                let total_member_votings = agree + disagree + neutral;
                if total_member_votings * 100 >= (threshold * member_len) as u32 && agree * 100 >= total_member_votings * (quorum as u32) {
                    is_allow_executed = true;
                } else {
                    is_allow_executed = false;
                }
            }
            is_allow_executed
        }

        fn _is_allow_vote(&self, step_index: u8, caller: AccountId) -> bool {
            let mut is_allow_vote: bool = false;
            let step_members: &Vec<AccountId> = &self.step_members[step_index as usize];
            if step_members.contains(&caller) {
                is_allow_vote = true;
            }

            is_allow_vote
 
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// We test a simple use case of our contract.
        #[ink::test]
        fn it_works() {
            let admin_acc = AccountId::from([0x01; 32]);
            let step1_member = AccountId::from([0x02; 32]);
            let step2_member = AccountId::from([0x03; 32]);
            let whitelisted_contributor = AccountId::from([0x04; 32]);
            let normal_member = AccountId::from([0x05; 32]);
            let token = AccountId::from([0x06; 32]);
            let recipient = AccountId::from([0x07; 32]);
            let mut dao = Dao::new(
                admin_acc,
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
                true,
                false
            );

            let _ = dao.create_proposal(
                "Title".to_string(),
                "Description".to_string(),
                0,
                1000 * 1000,
                false,
                0,
                0,
                token,
                recipient,
                true
            );

            let (_, admin, name, _, _, _, _, _, _, proposals, _, _, _, normal_members, _, _) =
                dao.get_info();

            assert_eq!(admin, admin_acc);
            assert_eq!(name, "Name".to_string());
            assert_eq!(normal_members.len(), 1);
            assert_eq!(proposals[0].title, "Title".to_string());
        }
    }

    // #[cfg(all(test, feature = "e2e-tests"))]
    // mod e2e_tests {
    //     /// Imports all the definitions from the outer scope so we can use them here.
    //     use super::*;

    //     /// A helper function used for calling contract messages.
    //     use ink_e2e::build_message;

    //     /// The End-to-End test `Result` type.
    //     type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

    //     /// We test that we can upload and instantiate the contract using its default constructor.
    //     #[ink_e2e::test]
    //     async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
    //         // Given
    //         let constructor = DaoRef::default();

    //         // When
    //         let contract_account_id = client
    //             .instantiate("dao", &ink_e2e::alice(), constructor, 0, None)
    //             .await
    //             .expect("instantiate failed")
    //             .account_id;

    //         // Then
    //         let get = build_message::<DaoRef>(contract_account_id.clone())
    //             .call(|dao| dao.get());
    //         let get_result = client.call_dry_run(&ink_e2e::alice(), &get, 0, None).await;
    //         assert!(matches!(get_result.return_value(), false));

    //         Ok(())
    //     }

    //     /// We test that we can read and write a value from the on-chain contract contract.
    //     #[ink_e2e::test]
    //     async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
    //         // Given
    //         let constructor = DaoRef::new(false);
    //         let contract_account_id = client
    //             .instantiate("dao", &ink_e2e::bob(), constructor, 0, None)
    //             .await
    //             .expect("instantiate failed")
    //             .account_id;

    //         let get = build_message::<DaoRef>(contract_account_id.clone())
    //             .call(|dao| dao.get());
    //         let get_result = client.call_dry_run(&ink_e2e::bob(), &get, 0, None).await;
    //         assert!(matches!(get_result.return_value(), false));

    //         // When
    //         let flip = build_message::<DaoRef>(contract_account_id.clone())
    //             .call(|dao| dao.flip());
    //         let _flip_result = client
    //             .call(&ink_e2e::bob(), flip, 0, None)
    //             .await
    //             .expect("flip failed");

    //         // Then
    //         let get = build_message::<DaoRef>(contract_account_id.clone())
    //             .call(|dao| dao.get());
    //         let get_result = client.call_dry_run(&ink_e2e::bob(), &get, 0, None).await;
    //         assert!(matches!(get_result.return_value(), true));

    //         Ok(())
    //     }
    // }
}
