use ink::primitives::{AccountId};
use ink::prelude::string::String;
#[derive(scale::Decode, scale::Encode, Debug)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout, Clone)
)]
pub struct Step {
    pub step_index: u8,
    pub title: String,
    pub use_default_settings: bool,
    pub quorum: u8,
    pub threshold: u8,
}

#[derive(scale::Decode, scale::Encode, Debug)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout, Clone)
)]
pub struct Proposal {
    pub proposal_index: u32,
    pub proposer: AccountId,
    pub title: String,
    pub description: String,
    pub start_date: u64,
    pub end_date: u64,
    pub use_fiat: bool,
    pub payment_amount_fiat: u32,
    pub cryto_fiat_key: String,
    pub payment_amount_crypto: u128,
    pub token: AccountId,
    pub to: AccountId,
    pub allow_early_executed: bool,
    pub executed: bool
}

#[derive(scale::Decode, scale::Encode, Debug)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout, Clone)
)]
pub struct ProposalVoting {
    pub agree: u32,
    pub disagree: u32,
    pub neutral: u32
}

impl Default for ProposalVoting {
    fn default() -> Self {
        Self {
            agree: 0,
            disagree: 0,
            neutral: 0
        }
    }
}

impl Default for Step {
    fn default() -> Self {
        Self {
            step_index: 0,
            title: "".to_string(),
            use_default_settings: true,
            quorum: 0,
            threshold: 0,
        }
    }
}

impl Default for Proposal {
    fn default() -> Self {
        Self {
            proposal_index: 0,
            proposer: AccountId::from([0x00; 32]),
            title: "".to_string(),
            description: "".to_string(),
            start_date: 0,
            end_date: 0,
            use_fiat: false,
            payment_amount_fiat: 0,
            cryto_fiat_key: "AZERO/USD".to_string(),
            payment_amount_crypto: 0,
            token: AccountId::from([0x00; 32]),
            to: AccountId::from([0x00; 32]),
            allow_early_executed: true,
            executed: false
        }
    }
}