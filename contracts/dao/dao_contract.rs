#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod dao {
    use ink::contract_ref;
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    use crate::errors::*;
    use crate::types::*;

    use dia_oracle_getter::OracleGetters;

    #[ink(storage)]
    pub struct Dao {
        oracle: contract_ref!(OracleGetters),
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
        allow_revoting: bool,
    }

    impl Dao {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(
            oracle_address:  AccountId,
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
            allow_revoting: bool,
        ) -> Self {
            Self {
                oracle: oracle_address.into(),
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
                allow_revoting: allow_revoting,
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
            cryto_fiat_key: String,
            payment_amount_crypto: Balance,
            token: AccountId,
            to: AccountId,
            allow_early_executed: bool,
        ) -> Result<(), Error> {
            // Check whether guests or members are allowed to make a proposal.
            let caller = Self::env().caller();
            if !self.open {
                if !self.normal_members.contains(&caller) {
                    return Err(Error::NotANormalMember);
                }
            } 
            // Setup proposal
            let count_proposal = self.proposals.len() as u32;
            let proposal = Proposal {
                proposal_index: count_proposal,
                proposer: caller,
                title: title,
                description: description,
                start_date: start_date,
                end_date: end_date,
                use_fiat: use_fiat,
                payment_amount_fiat: payment_amount_fiat,
                cryto_fiat_key: cryto_fiat_key,
                payment_amount_crypto: payment_amount_crypto,
                token: token,
                to: to,
                allow_early_executed: allow_early_executed,
                executed: false,
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
                        neutral: 0,
                    },
                );
                i += 1;
            }

            Ok(())
        }
        // Value: 1 - agree, 2 - disagree, 3 - neutral
        #[ink(message)]
        pub fn voting(&mut self, proposal_index: u32, step: u8, value: u8) -> Result<(), Error> {
            if !vec![1,2,3].contains(&value) {
                return Err(Error::IncorrectVotingOption);
            }
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
            let mut voting_status: ProposalVoting = self
                .proposal_voting_status
                .get((proposal_index, step))
                .unwrap_or_default();

            let voted_value: u8 = self
                .member_voted
                .get((Self::env().caller(), proposal_index, step))
                .unwrap_or_default();
            if voted_value != 0 {
                if self.allow_revoting {
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

                    self.member_voted
                        .insert((Self::env().caller(), proposal_index, step), &value);
                } else {
                    return Err(Error::NotAllowRevoting);
                }
            } else {
                self.member_voted
                    .insert((Self::env().caller(), proposal_index, step), &value);
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

            self.proposal_voting_status
                .insert((proposal_index, step), &voting_status);

            Ok(())
        }

        #[ink(message)]
        pub fn execute_proposal(&mut self, proposal_index: u32) -> Result<(), Error> {
            // Check index
            let num_proposals: u32 = self.proposals.len() as u32;
            if proposal_index > num_proposals {
                return Err(Error::ProposalIndexOutOfBound);
            }

            let proposal = &self.proposals[proposal_index as usize];
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
                let voting_status: ProposalVoting = self
                    .proposal_voting_status
                    .get((proposal_index, i))
                    .unwrap_or_default();
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
                let mut amount: u128 = 0;
                // Transfer token
                if proposal.use_fiat {
                    // Diadata here
                    let option_price: Option<(u64, u128)> = self.oracle.get_latest_price((*proposal.cryto_fiat_key).to_string());
                    let mut fetch_price_success = true;
                    match option_price {
                        Some((_, price128)) => amount = (proposal.payment_amount_fiat as u128) * price128,
                        None => fetch_price_success = false
                    }
                    if !fetch_price_success {
                        return Err(Error::CouldNotGetOraclePrice);
                    }
                } else {
                    amount = proposal.payment_amount_crypto;
                }
                // Check balance
                if self.env().balance() < amount {
                    return Err(Error::NotEnoughBalance);
                }

                if self.env().transfer(proposal.to, amount).is_err() {
                    panic!("error transferring")
                }

                self.proposals[proposal_index as usize].executed = true; 
            }

            Ok(())
        }

        #[ink(message)]
        pub fn get_proposal(&self, proposal_index: u32) -> Option<Proposal> {
            let num_proposals: u32 = self.proposals.len() as u32;
            if num_proposals < proposal_index {
                return None;
            } 
            let proposal = &self.proposals[proposal_index as usize];
            Some(proposal.clone())
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
                let step_voting: ProposalVoting = self
                    .proposal_voting_status
                    .get((proposal_index, i))
                    .unwrap_or_default();
                step_votings.push(step_voting);
                i += 1;
            }
            step_votings
        }

        #[ink(message)]
        pub fn add_normal_member(&mut self, new_member: AccountId) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            // Check normal member exist
            if self.normal_members.contains(&new_member) {
                return Err(Error::NormalMemberExisted);
            }
            // Add normal member
            self.normal_members.push(new_member);

            Ok(())
        }

        #[ink(message)]
        pub fn remove_normal_member(&mut self, old_member: AccountId) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            // Add normal member
            self.normal_members.retain(|&x| x != old_member);
            Ok(())
        }

        #[ink(message)]
        pub fn add_step_members(
            &mut self,
            step_index: u8,
            new_step_member: AccountId,
        ) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }

            let step_members: &mut Vec<AccountId> = &mut self.step_members[step_index as usize];

            if step_members.contains(&new_step_member) {
                return Err(Error::StepMemberExisted);
            }

            step_members.push(new_step_member);

            self.step_members[step_index as usize] = step_members.to_vec();

            Ok(())
        }

        #[ink(message)]
        pub fn remove_step_members(&mut self, step_index: u8, old_step_member: AccountId) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }

            let step_members: &mut Vec<AccountId> = &mut self.step_members[step_index as usize];

            step_members.retain(|&x| x != old_step_member);

            self.step_members[step_index as usize] = step_members.to_vec();
            Ok(())
        }

        #[ink(message)]
        pub fn get_contract_balance(&self) -> u128 {
            self.env().balance()
        }

        #[ink(message)]
        pub fn get_price(&self, key: String) -> Option<(u64, u128)> {
            self.oracle.get_latest_price(key)
        }
        // Private functions

        fn _is_allow_executed(
            &self,
            step_index: u8,
            voting_status: ProposalVoting,
            threshold: u8,
            quorum: u8,
        ) -> bool {
            let mut is_allow_executed: bool = false;
            let agree: u32 = voting_status.agree;
            let disagree: u32 = voting_status.disagree;
            let neutral: u32 = voting_status.neutral;
            let members: &Vec<AccountId> = &self.step_members[step_index as usize];
            let member_len: u8 = members.len() as u8;
            if member_len > 0 {
                let total_member_votings = agree + disagree + neutral;
                if total_member_votings * 100 >= (threshold * member_len) as u32
                    && agree * 100 >= total_member_votings * (quorum as u32)
                {
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
            let oracle_contract = AccountId::from([0x01; 32]);

            // init DAO
            let mut dao = Dao::new(
                oracle_contract,
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
                false,
                false,
            );

            // Created proposal
            ink::env::test::set_caller::<Environment>(normal_member);
            let result: Result<(), Error> = dao.create_proposal(
                "Title".to_string(),
                "Description".to_string(),
                0,
                1000 * 1000,
                false,
                0,
                "AZERO/USD".to_string(),
                200,
                token,
                recipient,
                true,
            );

            let mut success: bool = false;
            let mut error: String = "".to_string();
            match result {
                Ok(()) => success = true,
                Err(Error::NotANormalMember) => error = "NotANormalMember".to_string(),
                _ => ()
            }

            let (_, admin, name, _, _, _, _, _, _, proposals, _, _, _, normal_members, _, _) =
                dao.get_info();
            assert_eq!(admin, admin_acc);
            assert_eq!(name, "Name".to_string());
            assert_eq!(normal_members.len(), 1);
            if success {
                assert_eq!(proposals[0].title, "Title".to_string());
            } else {
                assert!(false, "{}", error);
            }

            // Voting

            //// Step 0: member voting
            ink::env::test::set_caller::<Environment>(step1_member);
            //// proposal index, step, value
            let _ = dao.voting(0, 0, 1);
            let proposal_votings: Vec<ProposalVoting> = dao.get_steps_voting_status(0);
            assert_eq!(proposal_votings[0].agree, 1);
            //// Step 1: member voting
            ink::env::test::set_caller::<Environment>(step2_member);
            //// proposal index, step, value
            let _ = dao.voting(0, 1, 1);
            let proposal_votings: Vec<ProposalVoting> = dao.get_steps_voting_status(0);
            assert_eq!(proposal_votings[1].agree, 1);
            let previous_balance = dao.get_contract_balance();
            // executed proposal
            let _ = dao.execute_proposal(0);
            let after_balance = dao.get_contract_balance();
            let proposal = dao.get_proposal(0);
            assert_eq!(proposal.is_some(), true);
            assert_eq!(proposal.unwrap().executed, true);
            assert_eq!(previous_balance - after_balance, 200)
        }
    }
}
