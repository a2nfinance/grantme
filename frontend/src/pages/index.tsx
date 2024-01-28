import { RecentDAOList } from "@/components/dao/RecentDAOList";
import { Divider, Typography } from "antd";
import Head from "next/head";
const {Title} = Typography;
export default function Index() {
    return (
        <>  
            <Head>
                <title>Grantme homepage</title>
            </Head>
            <Title level={3}>{"RECENT DAOs".toUpperCase()}</Title >
            <Divider />
            <RecentDAOList />
        </>
    )
}