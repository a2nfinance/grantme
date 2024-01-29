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
        programs: Vec<Program>,
        program_to_proposals: Vec<Vec<u32>>
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
                programs: Vec::new(),
                program_to_proposals: Vec::new()
            }
        }


        #[ink(message, payable)]
        pub fn fund(&self) -> Result<(), Error> {
            let caller = Self::env().caller();
            if !self.whitelisted_contributors.contains(&caller) {
                return Err(Error::NotWhitelistedContributor);
            }

            let amount = self.env().transferred_value();

            if amount == 0 {
                return Err(Error::ZeroFundAmount);
            }

            Ok(())

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
        // open: bool,
        // status: bool,
        // allow_revoting: bool
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
            // count proposal
            u32,
            // count whitelisted contributors
            u32,
            u8,
            u8,
            // count normal member
            u32,
            // count programs
            u32,
            bool,
            bool,
            bool
        ) {
            (
                self.owner,
                self.admin,
                self.name.clone(),
                self.description.clone(),
                self.website.clone(),
                self.email.clone(),
                self.address.clone(),
                self.social_accounts.clone(),
                self.steps.clone(),
                self.proposals.len() as u32,
                self.whitelisted_contributors.len() as u32,
                self.global_voting_quorum,
                self.global_voting_threshold,
                self.normal_members.len() as u32,
                self.programs.len() as u32,
                self.open,
                self.status,
                self.allow_revoting
            )
        }

        #[ink(message)] 
        pub fn create_program(&mut self, title: String, description: String, start_date: u64, end_date: u64) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }

            let num_programs: u32 = self.programs.len() as u32;

            let program = Program {
                program_index: num_programs,
                title: title,
                description: description,
                start_date: start_date,
                end_date: end_date
            };

            self.programs.push(program);
            self.program_to_proposals.push(Vec::new());
            Ok(())
        }
        #[ink(message)]
        pub fn create_proposal(
            &mut self,
            program_index: u32,
            title: String,
            description: String,
            start_date: u64,
            end_date: u64,
            use_fiat: bool,
            payment_amount_fiat: u32,
            cryto_fiat_key: String,
            payment_amount_crypto: u128,
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
            // Check program exist
            if (self.programs.len() as u32) < program_index {
                return Err(Error::ProgramIndexOutOfBound);
            }   

            let program: &Program = &self.programs[program_index as usize];

            if program.start_date > Self::env().block_timestamp() {
                return Err(Error::ProgramHasNotStarted);
            }

            if program.end_date < Self::env().block_timestamp() {
                return Err(Error::ProgramHasEnded);
            }

            // Setup proposal
            let count_proposal = self.proposals.len() as u32;
            let proposal = Proposal {
                program_index: program_index,
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
            // Insert to program
            self.program_to_proposals[program_index  as usize].push(count_proposal);

            Ok(())
        }
        // Value: 1 - agree, 2 - disagree, 3 - neutral
        #[ink(message)]
        pub fn voting(&mut self, proposal_index: u32, step: u8, value: u8) -> Result<(), Error> {
            if !Vec::from([1,2,3]).contains(&value) {
                return Err(Error::IncorrectVotingOption);
            }
            let num_proposals: u32 = self.proposals.len() as u32;
            if proposal_index >= num_proposals {
                return Err(Error::ProposalIndexOutOfBound);
            }

            // Check voting previlege
            // Must be step member
            if !self._is_allow_vote(step, Self::env().caller()) {
                return Err(Error::NotAllowVoting);
            }
            // Check time contraint
            let proposal: &Proposal = &self.proposals[proposal_index as usize];

            if proposal.executed {
                return Err(Error::ProposalHasExecuted);
            }

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
            if proposal_index >= num_proposals {
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
                let mut amount: u128 = proposal.payment_amount_crypto;
                // Transfer token
                if proposal.use_fiat {
                    // Diadata here
                    let option_price: Option<(u64, u128)> = self.oracle.get_latest_price(proposal.cryto_fiat_key.clone());
                    let mut fetch_price_success = true;
                    let mut latest_price: u128 = 0;
                    match option_price {
                        Some((_, price128)) => latest_price = price128,
                        None => fetch_price_success = false
                    }
                    
                    if !fetch_price_success {
                        return Err(Error::CouldNotGetOraclePrice);
                    }
                    // Formula: tzero_amount = payment_amount_fiat * 10^18 * 10^12 / latest_price 
                    // To avoid overflow using: tzero_amount = payment_amount * 10^18 / (latest_price/10^12)
                    // TZERO & AZERO have decimals is 12
                    // price128 has decimals is 18
                    amount = (proposal.payment_amount_fiat as u128).checked_mul(10_u128.pow(18)).unwrap_or_default();
                    latest_price = latest_price.checked_div(10_u128.pow(12)).unwrap_or_default();
                    amount = amount.checked_div(latest_price).unwrap_or_default();
                    // Need to check again later.
                    if amount == 0 {
                        return Err(Error::ZeroSendingAmount);
                    }
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
        pub fn add_whitelisted_contributor(&mut self, new_contributor: AccountId) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            // Check contributor exist
            if self.whitelisted_contributors.contains(&new_contributor) {
                return Err(Error::ContributorExisted);
            }
            // Add contributor
            self.whitelisted_contributors.push(new_contributor);

            Ok(())
        }

        #[ink(message)]
        pub fn remove_whitelisted_contributor(&mut self, old_member: AccountId) -> Result<(), Error> {
            let caller = Self::env().caller();
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            // remove contributor
            self.whitelisted_contributors.retain(|&x| x != old_member);
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

        // Get functions

        #[ink(message)]
        pub fn get_proposal(&self, proposal_index: u32) -> Option<Proposal> {
            let num_proposals: u32 = self.proposals.len() as u32;
            if num_proposals <= proposal_index {
                return None;
            } 
            let proposal = &self.proposals[proposal_index as usize];
            Some(proposal.clone())
        }

        #[ink(message)]
        pub fn get_program(&self, program_index: u32) -> Option<Program> {
            let num_programs: u32 = self.programs.len() as u32;
            if num_programs <= program_index {
                return None;
            } 
            let program = &self.programs[program_index as usize];
            Some(program.clone())
        }

        #[ink(message)]
        pub fn get_programs(&self) -> Vec<Program> {
            self.programs.clone()
        }

        #[ink(message)]
        pub fn get_program_proposals(&self, program_index: u32) -> Option<Vec<Proposal>> {
            let num_programs: u32 = self.programs.len() as u32;
            if num_programs <= program_index {
                return None;
            } 
            let proposal_indexes: &Vec<u32> = &self.program_to_proposals[program_index as usize];
            let mut proposals: Vec<Proposal> = Vec::new();
            let mut i: u32 = 0;
            loop {
                if i >= (proposal_indexes.len() as u32) {
                    break;
                }

                proposals.push(self.proposals[proposal_indexes[i as usize] as usize].clone());
                i += 1;
            }

            Some(proposals)
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
        pub fn get_step_members(&self) -> Vec<Vec<AccountId>> {
            self.step_members.clone()
        }

        #[ink(message)]
        pub fn get_normal_members(&self) -> Vec<AccountId> {
            self.normal_members.clone()
        }

        #[ink(message)]
        pub fn get_contract_balance(&self) -> u128 {
            self.env().balance()
        }

        #[ink(message)]
        pub fn get_price(&self, key: String) -> Option<(u64, u128)> {
            self.oracle.get_latest_price(key)
        }

        #[ink(message)]
        pub fn get_whitelisted_contributors(&self) -> Vec<AccountId> {
            self.whitelisted_contributors.clone()
        }

        #[ink(message)]
        pub fn get_member_voted(&self, member: AccountId, proposal_index: u32, step_index: u8) -> u8 {
            let voted_value: u8 = self
            .member_voted
            .get((member, proposal_index, step_index))
            .unwrap_or_default();
            voted_value
        }

        #[ink(message)]
        pub fn get_proposal_payment_amount_from_oracle(&self, proposal_index: u32) -> Result<(u128, u128, u128), Error> {
            let num_proposals: u32 = self.proposals.len() as u32;
            if proposal_index >= num_proposals {
                return Err(Error::ProposalIndexOutOfBound);
            }
            
            let proposal = &self.proposals[proposal_index as usize];
            if !proposal.use_fiat {
                return Ok((0, 0,0))
            }

            let mut amount: u128 = 0;
            let option_price: Option<(u64, u128)> = self.oracle.get_latest_price(proposal.cryto_fiat_key.clone());
            let mut fetch_price_success = true;
            match option_price {
                Some((_, price128)) => amount = (proposal.payment_amount_fiat as u128) * price128,
                None => fetch_price_success = false
            }
            
            if !fetch_price_success {
                return Err(Error::CouldNotGetOraclePrice);
            }

            let correct_amount = amount.checked_div(10_u128.pow(6)).unwrap_or_default();

            Ok((amount, correct_amount, self.env().balance()))

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
        use ink::env::{
            test::{set_caller}
        };

        fn get_mock_accounts() -> (AccountId, AccountId, AccountId, AccountId, AccountId, AccountId) {
            let admin_acc = AccountId::from([0x01; 32]);
            let step1_member = AccountId::from([0x02; 32]);
            let step2_member = AccountId::from([0x03; 32]);
            let whitelisted_contributor = AccountId::from([0x04; 32]);
            let normal_member = AccountId::from([0x05; 32]);
            let oracle_contract = AccountId::from([0x00; 32]);
            (admin_acc, step1_member, step2_member, whitelisted_contributor, normal_member, oracle_contract)
        }

        fn get_mock_proposal_params() -> (AccountId, AccountId) {
            let token = AccountId::from([0x06; 32]);
            let recipient = AccountId::from([0x07; 32]);
            (token, recipient)
        }


        fn init_dao() -> Dao {
            let mock_accounts = get_mock_accounts();
            let dao = Dao::new(
                mock_accounts.5,
                mock_accounts.0,
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
                vec![vec![mock_accounts.1], vec![mock_accounts.2]],
                vec![mock_accounts.3],
                100,
                100,
                vec![mock_accounts.4],
                false,
                false,
            );
            dao
        }

        #[ink::test]
        fn test_init_dao() {
            let dao = init_dao();
            let info = dao.get_info();
            assert_eq!(info.2, "Name".to_string());
            assert_eq!(info.8.len(), 2);
        }

        #[ink::test]
        fn test_create_program_success() {
            let mut dao = init_dao();
            let mock_accounts = get_mock_accounts();
            set_caller::<Environment>(mock_accounts.0);
            let _ = dao.create_program(
                "Program Title".to_string(),
                "Program Description".to_string(),
                0,
                1000 * 1000
            );

            let program = dao.get_program(0);
            assert!(program.is_some(), "Fail to create new program");
        }

        #[ink::test]
        fn test_create_program_fail() {
            let mut dao = init_dao();
            let mock_accounts = get_mock_accounts();
            set_caller::<Environment>(mock_accounts.1);

            let result: Result<(), Error> = dao.create_program(
                "Program Title".to_string(),
                "Program Description".to_string(),
                0,
                1000 * 1000
            );

            assert!(result.is_err(), "Only admin can create programs");
        }
        
        #[ink::test] 
        fn test_create_proposal() {
            let mut dao = init_dao();
            let mock_param = get_mock_proposal_params();
            let mock_accounts = get_mock_accounts();
            set_caller::<Environment>(mock_accounts.0);
            // Create program
            let _ = dao.create_program(
                "Program Title".to_string(),
                "Program Description".to_string(),
                0,
                1000 * 1000
            );

            let program = dao.get_program(0);
            assert!(program.is_some(), "Fail to create new program");

            // Create proposal

            set_caller::<Environment>(mock_accounts.4);
            let result: Result<(), Error> = dao.create_proposal(
                0,
                "Title".to_string(),
                "Description".to_string(),
                0,
                1000 * 1000,
                false,
                0,
                "AZERO/USD".to_string(),
                200,
                mock_param.0,
                mock_param.1,
                true
            );

            assert!(result.is_ok(), "Fail to create proposal");

        }

        #[ink::test]
        fn test_voting_and_execute_proposal() {
            let mut dao = init_dao();
            let mock_param = get_mock_proposal_params();
            let mock_accounts = get_mock_accounts();
            set_caller::<Environment>(mock_accounts.0);
            // Create program
            let _ = dao.create_program(
                "Program Title".to_string(),
                "Program Description".to_string(),
                0,
                1000 * 1000
            );

            let program = dao.get_program(0);
            assert!(program.is_some(), "Fail to create new program");

            // Create proposal

            set_caller::<Environment>(mock_accounts.4);
            let result: Result<(), Error> = dao.create_proposal(
                0,
                "Title".to_string(),
                "Description".to_string(),
                0,
                1000 * 1000,
                false,
                0,
                "AZERO/USD".to_string(),
                200,
                mock_param.0,
                mock_param.1,
                true
            );

            assert!(result.is_ok(), "Fail to create proposal");


            // Step 0: member voting
            set_caller::<Environment>(mock_accounts.1);
            let _ = dao.voting(0, 0, 1);
            let proposal_votings: Vec<ProposalVoting> = dao.get_steps_voting_status(0);
            assert_eq!(proposal_votings[0].agree, 1);

            // Step 1: member voting
            set_caller::<Environment>(mock_accounts.2);
            let _ = dao.voting(0, 1, 1);
            let proposal_votings: Vec<ProposalVoting> = dao.get_steps_voting_status(0);
            assert_eq!(proposal_votings[1].agree, 1);

            let previous_balance = dao.get_contract_balance();

            // execute proposal
            let _ = dao.execute_proposal(0);

            // Check balance after execution
            let after_balance = dao.get_contract_balance();
            let proposal = dao.get_proposal(0);
            assert_eq!(proposal.is_some(), true);
            assert_eq!(proposal.unwrap().executed, true);
            assert_eq!(previous_balance - after_balance, 200)
        } 
    }


    #[cfg(all(test, feature = "e2e-tests"))]
    #[cfg_attr(all(test, feature = "e2e-tests"), allow(unused_imports))]
    mod e2e_tests {
        use super::*;
        use dia_oracle_setter::OracleSetters;
        use dia_oracle::TokenPriceStorageRef;
        use ink_e2e::build_message;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn test_oracle_integration(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let admin_acc = AccountId::from([0x01; 32]);
            let step1_member = AccountId::from([0x02; 32]);
            let step2_member = AccountId::from([0x03; 32]);
            let whitelisted_contributor = AccountId::from([0x04; 32]);
            let normal_member = AccountId::from([0x05; 32]);
            
            // init Oracle contract
            // AZERO/USD - 2024/23/01
            const PRICE: u128 = 1_071_576_625_798_566_000;

            let constructor = TokenPriceStorageRef::new();
            let contract_acc_id = client
                .instantiate("dia_oracle", &ink_e2e::alice(), constructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            //init DAO
            let dao_contructor = DaoRef::new(
                contract_acc_id,
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

            let dao_contract_acc_id = client
                .instantiate("dao", &ink_e2e::alice(), dao_contructor, 0, None)
                .await
                .expect("instantiate failed")
                .account_id;

            // set price for oracle
            let set_price_message = build_message::<TokenPriceStorageRef>(contract_acc_id.clone())
                .call(|tps| tps.set_price("AZERO/USD".to_string(), PRICE));

            let _set_price_res = client
                .call(&ink_e2e::alice(), set_price_message, 0, None)
                .await
                .expect("set failed");

            let get_price_message = build_message::<TokenPriceStorageRef>(contract_acc_id.clone())
                .call(|tps| tps.get_latest_price("AZERO/USD".to_string()));

            let get_price_res = client
                .call(&ink_e2e::alice(), get_price_message, 0, None)
                .await
                .expect("get failed");

            let latest_price = get_price_res.return_value().expect("Value is None").1;
            assert_eq!(latest_price, PRICE);

            // get price for oracle from DAO contract

            let get_price_message_example =
                build_message::<DaoRef>(dao_contract_acc_id.clone())
                    .call(|dao| dao.get_price("AZERO/USD".to_string()));

            let get_price_res_example = client
                .call(&ink_e2e::alice(), get_price_message_example, 0, None)
                .await
                .expect("get failed");

            let latest_price = get_price_res_example
                .return_value()
                .expect("Value is None")
                .1;
            assert_eq!(latest_price, PRICE);
            Ok(())
        }
    }
}
