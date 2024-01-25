import { store } from "@/controller/store";
import { ContractPromise, call, toContractAbiMessage, WsProvider, ApiPromise, DecodedContractResult, WalletAccount } from "useink/core";
import daoMetadata from "@/contracts/dao.json";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { messages } from "@/helpers/message_consts";
import { convertDaoDetailData } from "@/helpers/data_converter";
import { setDAODetail } from "@/controller/dao/daoDetailSlice";

let api = null;
let daoContract: ContractPromise = null;
const gasLimit = 3000n * 1000000n;
const storageDepositLimit = null;

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
            console.log(result.value.decoded);
            let daoDetail = convertDaoDetailData(result.value.decoded);
            console.log(daoDetail);

            store.dispatch(setDAODetail(daoDetail));
        }
    } catch (error) {
        console.log(error);
    }
}