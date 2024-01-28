import daoMetadata from "@/contracts/dao.json";
import daoFactoryMetadata from "@/contracts/dao_factory.json";
import { DaoDetail } from "@/controller/dao/daoDetailSlice";
import { setDAOProps } from "@/controller/dao/daoSlice";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { store } from "@/controller/store";
import { convertDaoDetailData } from "@/helpers/data_converter";
import { messages } from "@/helpers/message_consts";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { ApiPromise, ContractPromise, DecodedContractResult, WalletAccount, WsProvider, call, toContractAbiMessage } from "useink/core";
import { executeTransaction } from "./do_transaction";

let api;
let daoFactoryContract: ContractPromise;

const singletonDaoFactoryContract = async () => {
    if (!api) {
        const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_ALEPH_RPC);
        api = await ApiPromise.create({ provider: wsProvider });
        daoFactoryContract = new ContractPromise(
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

        await singletonDaoFactoryContract();

        let { kycForm, votingSettingsForm, stepsForm, contributorForm, memberForm } = store.getState().daoForm;

        store.dispatch(updateActionStatus({ actionName: actionNames.createDAOAction, value: true }));

        let args = [
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
        ];

        await executeTransaction(
            daoFactoryContract,
            "createDao",
            args,
            account,
            messages.CREATE_DAO_TITLE,
            messages.CREATE_DAO_SUCCESS,
            messages.FAIL_CREATE_DAO
        );

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
        await singletonDaoFactoryContract();
        let abiMessage = toContractAbiMessage(daoFactoryContract, "getDaos");
        if (!abiMessage.ok) {
            return;
        }
        const result = await call<string[]>(daoFactoryContract, abiMessage.value, "", []);

        if (result?.ok) {
            let daoAddresses = result.value.decoded;

            let promisesCalls: Promise<DecodedContractResult<any[]> | undefined>[] = [];
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

            let daoList: DaoDetail[] = [];

            for (let i = 0; i < daoReqs.length; i++) {
                let daoInfo = daoReqs[i];
                if (daoInfo?.ok) {

                    let daoDetail = convertDaoDetailData(daoInfo.value.decoded);
                    daoList.push({ ...daoDetail, contract_address: daoAddresses[i] });


                }
            }

            store.dispatch(setDAOProps({ att: "daos", value: daoList }));


        } else {
            console.log(result?.error);
        }



    } catch (error) {
        console.log(error);
    }

    store.dispatch(setDAOProps({ att: "isLoadingDAOs", value: false }));

}