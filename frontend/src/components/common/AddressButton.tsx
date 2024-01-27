import { useAddress } from "@/hooks/useAddress"
import { CopyOutlined } from "@ant-design/icons";
import { Button, message } from "antd"

export const AddressButton = ({ address }: { address: string }) => {
    const { getShortAddress } = useAddress();
    const [messageApi, contextHolder] = message.useMessage();
    return (
        <>
            {contextHolder}
            <Button onClick={
                () => {
                    window.navigator.clipboard.writeText(address);
                    messageApi.success("Copied address");
                }
            }>{getShortAddress(address)}</Button>
        </>
    )
}