#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum Error {
    NotAllowMakeProposal,
    ProposalIndexOutOfBound,
    VotingHasNotStarted,
    VotingHasEnded,
    VotingHasNotEnd,
    NotAllowRevoting,
    SameVotingOption,
    IncorrectVotingOption,
    NotAllowVoting,
    NotAdmin,
    NormalMemberExisted,
    NotANormalMember,
    StepMemberExisted,
    CouldNotGetOraclePrice,
    NotEnoughBalance,
    NotWhitelistedContributor,
    ZeroFundAmount,
    ProgramIndexOutOfBound,
    ProgramHasNotStarted,
    ProgramHasEnded,
    ContributorExisted,
    ProposalHasExecuted
}
