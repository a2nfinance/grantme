import { DAOSkeleton } from "@/components/common/DAOSkeleton";
import { DaoStatistic } from "@/components/dao/detail/DaoStatistic";
import { DaoTabs } from "@/components/dao/detail/DaoTabs";
import { DetailItem } from "@/components/dao/detail/DetailItem";
import { useAppSelector } from "@/controller/hooks";
import { getDAODetail } from "@/core/dao";
import { Col, Row } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
export default function DAODetail() {
    const {loadDAODetailAction} = useAppSelector(state => state.process);
    const router = useRouter();
    useEffect(() => {
        let contractAddress = router.query["address"];
        if (contractAddress) {
            getDAODetail(contractAddress.toString());
        }
    }, [router.query])
    if (loadDAODetailAction) {
        return <DAOSkeleton />
    }
    return (
        <>
        <Head>
                <title>DAO details</title>
            </Head>
            <Row gutter={16}>
            <Col span={8}>
                <DetailItem />
            </Col>
            <Col span={16}>
                <DaoStatistic />
                <DaoTabs />
            </Col>
        </Row>
        </>
       
    )
}