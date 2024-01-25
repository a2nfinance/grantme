import daoMetadata from "@/contracts/dao.json";
import { setDAODetail, setProps } from "@/controller/dao/daoDetailSlice";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { store } from "@/controller/store";
import { convertDaoDetailData } from "@/helpers/data_converter";
import { messages } from "@/helpers/message_consts";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { ApiPromise, ContractPromise, WalletAccount, WsProvider, call, toContractAbiMessage } from "useink/core";
import { executeTransaction } from "./do_transaction";

let api = null;
let daoContract: ContractPromise = null;

const singletonDAOContract = async (daoAddress: string) => {
    if (daoAddress) {
        if (!daoContract || daoContract.address !== daoAddress) {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_ALEPH_RPC);
            api = await ApiPromise.create({ provider: wsProvider });
            daoContract = new ContractPromise(
                api,
                daoMetadata,
                daoAddress
            );
        }
    }
}

export const getDAODetail = async (daoAddress: string) => {
    try {
        if (!daoAddress) {
            return;
        }
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
    } catch (error) {
        console.log(error);
    }
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