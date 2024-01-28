import { DAOList } from "@/components/dao/DAOList";
import { Divider, Typography } from "antd";
import Head from "next/head";

const { Title } = Typography;
export default function DaoList() {
    return (
        <>
            <Head>
                <title>All DAOs</title>
            </Head>
            <Title level={3}>{"ALL DAOs".toUpperCase()}</Title >
            <Divider />
            <DAOList />
        </>
    )
}