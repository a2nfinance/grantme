import { RecentDAOList } from "@/components/dao/RecentDAOList";
import { Divider, Typography } from "antd";
const {Title} = Typography;
export default function Index() {
    return (
        <>
            <Title level={3}>{"RECENT DAOs".toUpperCase()}</Title >
            <Divider />
            <RecentDAOList />
        </>
    )
}