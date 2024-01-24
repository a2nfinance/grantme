import { useMessage } from "@/hooks/useMessage";
import { notification } from "antd";
import { useNotifications } from "useink/notifications";

export const TxNotifications = ({ actionType }: {actionType: string}) => {
    const { notifications, removeNotification  } = useNotifications();
    const {getTxMessages} = useMessage();
    const {titleMessage, successMessage, failMessage} = getTxMessages(actionType);
    return <>
        {notifications.map(m => {
            if (m.message.toLowerCase() === "finalized") {
                notification.success({
                    message: titleMessage,
                    description: successMessage
                })
            } else if (m.message.toLocaleLowerCase() === "errored") {
                notification.error({
                    message: titleMessage,
                    description: failMessage
                })
            } else {
                notification.info({
                    message: titleMessage,
                    description: m.message
                })
            }

            removeNotification(m.id);

            return "";
        })}
    </>
}