import { store } from "@/controller/store";
import { ContractPromise, call, toContractAbiMessage, WsProvider, ApiPromise, DecodedContractResult, WalletAccount } from "useink/core";
import daoMetadata from "@/contracts/dao.json";
import daoFactoryMetadata from "@/contracts/dao_factory.json";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { messages } from "@/helpers/message_consts";

let api = null;
let daoFactoryContract: ContractPromise = null;
const gasLimit = 3000n * 1000000n;
const storageDepositLimit = null;
const getSingletonApi = async () => {
    if (!api) {
        const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_ALEPH_RPC);
        api = await ApiPromise.create({ provider: wsProvider });
        daoFactoryContract = new ContractPromise(
            // contract.contract.api, 
            api,
            daoFactoryMetadata,
            process.env.NEXT_PUBLIC_DAO_FACTORY_ADDRESS
        );
    }
}

export const createDao = async (account: WalletAccount | undefined) => {

    try {
        if (!account) {
            return;
        }

        await getSingletonApi();

        let { kycForm, votingSettingsForm, stepsForm, contributorForm, memberForm } = store.getState().daoForm;

        store.dispatch(updateActionStatus({ actionName: actionNames.createDAOAction, value: true }));

        await daoFactoryContract.tx.createDao(
            { storageDepositLimit, gasLimit },
            parseInt(process.env.NEXT_PUBLIC_DAO_VERSION || "0"),
            kycForm.name,
            kycForm.description,
            kycForm.website,
            kycForm.email,
            kycForm.address,
            [kycForm.twitter, kycForm.discord, kycForm.telegram, kycForm.facebook],

            stepsForm.steps.map((step, index) => {
                return [
                    index,
                    step.title,
                    step.use_default_settings,
                    step.quorum,
                    step.threshold
                ]
            })
            ,

            stepsForm.steps.map((step, index) => {
                return step.step_members.map((member, m_index) => {
                    return member.address;
                })
            }),

            contributorForm.contributors.map(c => c.address),

            votingSettingsForm.quorum,
            votingSettingsForm.threshold,
            memberForm.members.map(m => m.address),
            memberForm.open,
            votingSettingsForm.allow_revoting
        ).signAndSend(account.address, { signer: account.wallet?.extension?.signer }, result => {
            if (result.status.isFinalized) {
                openNotification(
                    messages.CREATE_DAO_TITLE,
                    messages.CREATE_DAO_SUCCESS,
                    MESSAGE_TYPE.SUCCESS
                )
            } else if (result.status.isErrored) {
                openNotification(
                    messages.CREATE_DAO_TITLE,
                    messages.FAIL_CREATE_DAO,
                    MESSAGE_TYPE.ERROR
                )
            }
        }).catch((e) => {
            console.log(e);
            openNotification(
                messages.CREATE_DAO_TITLE,
                e.message,
                MESSAGE_TYPE.ERROR
            )
        });

    } catch (e) {
        console.log(e);
        openNotification(
            messages.CREATE_DAO_TITLE,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.createDAOAction, value: false }));

}

export const getDAOs = async () => {
    try {
        await getSingletonApi();
        let abiMessage = toContractAbiMessage(daoFactoryContract, "getDaos");
        if (!abiMessage.ok) {
            return;
        }
        const result = await call<string[]>(daoFactoryContract, abiMessage.value, "", []);

        if (result?.ok) {
            let daoAddresses = result.value.decoded;

            let promisesCalls: Promise<DecodedContractResult<unknown> | undefined>[] = [];
            daoAddresses = daoAddresses.reverse();
            for (let i = 0; i < daoAddresses.length; i++) {
                const daoContract = new ContractPromise(
                    api,
                    daoMetadata,
                    daoAddresses[i]);
                let daoAbiMessage = toContractAbiMessage(daoContract, "getInfo");

                if (!daoAbiMessage.ok) {
                    continue;
                }
                promisesCalls.push(call(daoContract, daoAbiMessage.value, "", []));

            }

            let daoReqs = await Promise.all(promisesCalls);

            let daoList: unknown[] = [];

            for (let i = 0; i < daoReqs.length; i++) {
                let daoInfo = daoReqs[i];
                if (daoInfo?.ok) {
                    daoList.push(daoInfo.value.decoded)
                }
            }

            console.log(daoList);


        } else {
            console.log(result?.error);
        }


    } catch (error) {
        console.log(error);
    }

}