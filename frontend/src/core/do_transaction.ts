import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import { ContractPromise, WalletAccount, call, toContractAbiMessage } from "useink/core";
const storageDepositLimit = null;

export const executeTransaction = async (
    contract: ContractPromise,
    fnName: string,
    args: any[],
    account: WalletAccount,
    messageTitle: string,
    successMessage: string,
    errorMessage: string,
    callback?: Function
) => {

    let abiMessage = toContractAbiMessage(contract, fnName);
    if (!abiMessage?.ok) {
        return;
    }

    // Check gas
    const resp = await call(
        contract,
        abiMessage.value,
        account.address,
        args
    );

    if (!resp || !resp.ok) return;

    const { gasConsumed, gasRequired, storageDeposit } = resp.value.raw;

    await contract.tx[fnName](
        { storageDepositLimit, gasLimit: gasRequired },
        ...args
    ).signAndSend(account.address, { signer: account.wallet?.extension?.signer }, result => {
        if (result.status.isFinalized) {
            openNotification(
                messageTitle,
                successMessage,
                MESSAGE_TYPE.SUCCESS
            );
            callback?.();
        } else if (result.status.isErrored) {
            openNotification(
                messageTitle,
                errorMessage,
                MESSAGE_TYPE.ERROR
            )
        }
    }).catch((e) => {
        console.log(e);
        openNotification(
            messageTitle,
            e.message,
            MESSAGE_TYPE.ERROR
        )
    });
}