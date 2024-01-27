import daoMetadata from "@/contracts/dao.json";
import { DaoDetail, Step, VotingStatus, setDAODetail, setProps } from "@/controller/dao/daoDetailSlice";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { store } from "@/controller/store";
import { convertDaoDetailData, convertVotingStatus } from "@/helpers/data_converter";
import { messages } from "@/helpers/message_consts";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { ApiPromise, ContractPromise, WalletAccount, WsProvider, call, toContractAbiMessage } from "useink/core";
import { executeTransaction } from "./do_transaction";

let api = null;
let daoContract: ContractPromise = null;
let previousAdress = "";
const singletonDAOContract = async (daoAddress: string) => {
    if (daoAddress) {
        if (!daoContract || previousAdress !== daoAddress) {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_ALEPH_RPC);
            api = await ApiPromise.create({ provider: wsProvider });
            daoContract = new ContractPromise(
                api,
                daoMetadata,
                daoAddress
            );
            previousAdress = daoAddress;
        }
    }
}

export const getDAODetail = async (daoAddress: string) => {
    try {
        if (!daoAddress) {
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.loadDAODetailAction, value: true }));
        await singletonDAOContract(daoAddress);
        let daoAbiMessage = toContractAbiMessage(daoContract, "getInfo");


        if (!daoAbiMessage.ok) {
            return;
        }

        let result = await call<any[]>(daoContract, daoAbiMessage.value, "", []);
        if (result?.ok) {
            let daoDetail = convertDaoDetailData(result.value.decoded);
            store.dispatch(setDAODetail({ ...daoDetail, contract_address: daoAddress }));
        }

        let getMemberMessage = toContractAbiMessage(daoContract, "getNormalMembers");
        if (!getMemberMessage.ok) {
            return;
        }

        result = await call<string[]>(daoContract, getMemberMessage.value, "", []);
        if (result?.ok) {
            let members = result.value.decoded;
            store.dispatch(setProps({ att: "members", value: members }));
        }
    } catch (error) {
        console.log(error);
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.loadDAODetailAction, value: false }));
}

export const getPrograms = async (daoAddress: string) => {
    try {
        if (!daoAddress) {
            return;
        }
        await singletonDAOContract(daoAddress);
        let daoAbiMessage = toContractAbiMessage(daoContract, "getPrograms");

        if (!daoAbiMessage.ok) {
            return;
        }

        let result = await call<any[]>(daoContract, daoAbiMessage.value, "", []);
        if (result?.ok) {
            let programs = result.value.decoded;
            console.log(programs);

            store.dispatch(setProps({ att: "programs", value: programs }));
        }
    } catch (error) {
        console.log(error);
    }
}

export const createProgram = async (account: WalletAccount | undefined, formValues: FormData) => {
    try {
        if (!account?.address) {
            return;
        }

        let { detail } = store.getState().daoDetail;

        store.dispatch(updateActionStatus({ actionName: actionNames.createProgramAction, value: true }));
        await singletonDAOContract(detail.contract_address || "");

        let args = [
            formValues["title"],
            formValues["description"],
            new Date(formValues["date"][0]).getTime(),
            new Date(formValues["date"][1]).getTime(),
        ]

        await executeTransaction(
            daoContract,
            "createProgram",
            args,
            account,
            messages.CREATE_PROGRAM_TITLE,
            messages.CREATE_PROGRAM_SUCCESS,
            messages.FAIL_CREATE_PROGRAM,
            () => getPrograms(detail.contract_address || "")
        )

    } catch (e) {
        console.log(e);
        openNotification(
            messages.CREATE_PROGRAM_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.createProgramAction, value: false }));
}

export const newProposal = async (account: WalletAccount | undefined, formValues: FormData) => {
    try {
        if (!account) {
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.newProposalAction, value: true }));
        let { selectedProgram, detail } = store.getState().daoDetail;

        let args = [
            selectedProgram.programIndex,
            formValues["title"],
            formValues["description"],
            new Date(formValues["date"][0]).getTime(),
            new Date(formValues["date"][1]).getTime(),
            formValues["use_fiat"],
            formValues["payment_amount_fiat"] || 0,
            "AZERO/USD",
            formValues["payment_amount_crypto"] || 0,
            detail.contract_address,
            formValues["to"],
            formValues["allow_early_executed"]
        ];

        await executeTransaction(
            daoContract,
            "createProposal",
            args,
            account,
            messages.CREATE_PROPOSAL_TITLE,
            messages.CREATE_PROPOSAL_SUCCESS,
            messages.FAIL_CREATE_PROPOSAL,
            // Need refresh the current program's proposals here
        )
    } catch (e) {
        console.log(e);
        openNotification(
            messages.CREATE_PROPOSAL_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.newProposalAction, value: false }));
}




export const getProgramProposals = async () => {
    try {
        let { selectedProgram, detail } = store.getState().daoDetail;
        await singletonDAOContract(detail.contract_address || "");
        let daoAbiMessage = toContractAbiMessage(daoContract, "getProgramProposals");

        if (!daoAbiMessage.ok) {
            return;
        }

        let result = await call<any[]>(daoContract, daoAbiMessage.value, "", [selectedProgram.programIndex]);
        if (result?.ok) {
            let proposals = result.value.decoded;
            store.dispatch(setProps({ att: "programProposals", value: proposals }));
        }
    } catch (error) {
        console.log(error);
    }
}


export const getWhitelistedContributors = async () => {
    try {
        let { detail } = store.getState().daoDetail;
        await singletonDAOContract(detail.contract_address || "");
        let daoAbiMessage = toContractAbiMessage(daoContract, "getWhitelistedContributors");

        if (!daoAbiMessage.ok) {
            return;
        }

        let result = await call<any[]>(daoContract, daoAbiMessage.value, "", []);
        if (result?.ok) {
            let contributors = result.value.decoded;
            store.dispatch(setProps({ att: "contributors", value: contributors }));
        }
    } catch (error) {
        console.log(error);
    }
}


export const fundDAO = async (account: WalletAccount | undefined, fundAmount: number) => {
    try {
        if (!account?.address) {
            return;
        }

        let { detail } = store.getState().daoDetail;

        store.dispatch(updateActionStatus({ actionName: actionNames.fundDAOAction, value: true }));
        await singletonDAOContract(detail.contract_address || "");

        await executeTransaction(
            daoContract,
            "fund",
            [],
            account,
            messages.FUND_TITLE,
            messages.FUND_SUCCESS,
            messages.FAIL_TO_FUND,
            () => getBalanceAndPriceInUSD(),
            {
                value: BigInt(fundAmount * (10 ** 12))
            }
        )

    } catch (e) {
        console.log(e);
        openNotification(
            messages.FUND_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.fundDAOAction, value: false }));
}



export const getBalanceAndPriceInUSD = async () => {
    try {
        let balance = 0;
        let price = 0;
        let { detail } = store.getState().daoDetail;
        await singletonDAOContract(detail.contract_address || "");
        let balanceAbiMessage = toContractAbiMessage(daoContract, "getContractBalance");

        if (!balanceAbiMessage.ok) {
            return;
        }

        let result = await call<string>(daoContract, balanceAbiMessage.value, "", []);
        if (result?.ok) {
            balance = Number(BigInt(result.value.decoded.replaceAll(",", ""))) / Number(BigInt(10 ** 12));

        }

        let priceAbiMessage = toContractAbiMessage(daoContract, "getPrice");

        if (!priceAbiMessage.ok) {
            return;
        }

        let priceResult = await call<string[]>(daoContract, priceAbiMessage.value, "", ["AZERO/USD"]);

        if (priceResult?.ok) {
            price = Number(BigInt(priceResult.value.decoded[1].replaceAll(",", ""))) / Number(BigInt(10 ** 18));
        }
        let balanceInUSD = `${balance.toFixed(2)} - ${(balance * price).toFixed(3)}`
        store.dispatch(setProps({ att: "balanceInUSD", value: balanceInUSD }));
    } catch (error) {
        console.log(error);
    }
}

export const getDaoProposalDetail = async (daoAddress: string, proposalIndex: number) => {
    try {
        // init contracts
        await singletonDAOContract(daoAddress);
        let { detail } = store.getState().daoDetail;
        // if dao detail existed
        if (!detail.admin) {
            await getDAODetail(daoAddress);
        }
        await getProposalInfo(daoAddress, proposalIndex);
        getStepMembers(daoAddress);
        getStepVotings(daoAddress, proposalIndex);
    } catch (e) {
        console.log(e);
    }
}

export const getProposalInfo = async (daoAddress: string, proposalIndex: number) => {
    try {
        // init contracts
        await singletonDAOContract(daoAddress);
        let getProposalAbiMessage = toContractAbiMessage(daoContract, "getProposal");

        if (!getProposalAbiMessage.ok) {
            return;
        }

        let proposalReq = await call(daoContract, getProposalAbiMessage.value, "", [proposalIndex]);
        // get voting status
        if (proposalReq?.ok) {
            let proposal = proposalReq.value.decoded;
            if (proposal) {
                store.dispatch(setProps({ att: "selectedProposal", value: proposal }));
            }
        }
    } catch (e) {
        console.log(e);
    }
}

export const getStepMembers = async (daoAddress: string) => {
    try {
        // init contracts
        await singletonDAOContract(daoAddress);
        // get proposal detail here
        let getStepmembersAbiMessage = toContractAbiMessage(daoContract, "getStepMembers");

        if (!getStepmembersAbiMessage.ok) {
            return;
        }

        let stepMembersReq = await call(daoContract, getStepmembersAbiMessage.value, "", []);
        // get voting status
        if (stepMembersReq?.ok) {
            let stepMembers = stepMembersReq.value.decoded;

            store.dispatch(setProps({ att: "stepMembers", value: stepMembers }));

        }
    } catch (e) {
        console.log(e);
    }
}

export const getStepVotings = async (daoAddress: string, programIndex: number) => {
    try {
        // init contracts
        await singletonDAOContract(daoAddress);
        // get proposal detail here
        let getStepVotingAbiMessage = toContractAbiMessage(daoContract, "getStepsVotingStatus");

        if (!getStepVotingAbiMessage.ok) {
            return;
        }

        let stepVotingReq = await call(daoContract, getStepVotingAbiMessage.value, "", [programIndex]);
        // get voting status
        if (stepVotingReq?.ok) {
            let stepVotings = stepVotingReq.value.decoded;

            store.dispatch(setProps({ att: "stepVotings", value: stepVotings }));

        }
    } catch (e) {
        console.log(e);
    }
}

export const doVote = async (account: WalletAccount | undefined, stepIndex: number, value: number) => {
    try {
        if (!account?.address) {
            return;
        }

        let { detail, selectedProposal } = store.getState().daoDetail;

        store.dispatch(updateActionStatus({ actionName: actionNames.votingAction, value: true }));

        await singletonDAOContract(detail.contract_address || "");

        await executeTransaction(
            daoContract,
            "voting",
            [selectedProposal.proposalIndex, stepIndex, value],
            account,
            messages.VOTING_TITLE,
            messages.VOTING_SUCCESS,
            messages.FAIL_TO_VOTE,
            () => getStepVotings(detail.contract_address || "", selectedProposal.proposalIndex),
        )

    } catch (e) {
        console.log(e);
        openNotification(
            messages.VOTING_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.votingAction, value: false }));
}


export const isAllowToExecute = () => {
    let { stepMembers, stepVotings, detail: daoDetail } = store.getState().daoDetail;

    let allow = true;
    let quorum = daoDetail.global_voting_quorum;
    let threshold = daoDetail.global_voting_threshold;

    for (let i = 0; i < stepVotings.length; i++) {
        let numMembers = stepMembers[i].length;
        let step = daoDetail.steps[i];
        if (!step.useDefaultSettings) {
            quorum = step.quorum;
            threshold = step.threshold;
        }
        let votingStatus = convertVotingStatus(stepVotings[i]);
        let acceptedQuorum = ((votingStatus.agree + votingStatus.disagree + votingStatus.neutral) * 100 / numMembers) >= quorum;
        let acceptedThreshold = (votingStatus.agree * 100 / (votingStatus.agree + votingStatus.disagree + votingStatus.neutral)) >= threshold;
        if (!acceptedQuorum || !acceptedThreshold) {
            allow = false;
            break;
        }
    }
    return allow;

}

export const executeProposal = async (account: WalletAccount | undefined) => {
    try {
        if (!account?.address) {
            return;
        }

        let { detail, selectedProposal } = store.getState().daoDetail;

        store.dispatch(updateActionStatus({ actionName: actionNames.executeAction, value: true }));

        await singletonDAOContract(detail.contract_address || "");

        await executeTransaction(
            daoContract,
            "executeProposal",
            [selectedProposal.proposalIndex],
            account,
            messages.EXECUTE_PROPOSAL_TITLE,
            messages.EXECUTE_PROPOSAL_SUCCESS,
            messages.FAIL_TO_EXECUTE,
            () => getDaoProposalDetail(detail.contract_address || "", selectedProposal.proposalIndex),
        )

    } catch (e) {
        console.log(e);
        openNotification(
            messages.EXECUTE_PROPOSAL_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.executeAction, value: false }));
}




