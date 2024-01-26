
import { actionTypes, messages } from "@/helpers/message_consts";

export const useMessage = () => {


    const getTxMessages = (actionType: string) => {

        let titleMessage = "";
        let successMessage = "";
        let failMessage = "";
        switch (actionType) {
            case actionTypes.CREATE_DAO:
                titleMessage = messages.CREATE_DAO_TITLE;
                successMessage = messages.CREATE_DAO_SUCCESS;
                failMessage = messages.FAIL_CREATE_DAO;
                break;
            default:
                break;

        }
        return { titleMessage, successMessage, failMessage }
    }



    return { getTxMessages };
};