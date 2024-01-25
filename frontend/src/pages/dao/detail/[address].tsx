import { DaoStatistic } from "@/components/dao/detail/DaoStatistic";
import { DaoTabs } from "@/components/dao/detail/DaoTabs";
import { DetailItem } from "@/components/dao/detail/DetailItem";
import { getDAODetail } from "@/core/dao";
import { Col, Row } from "antd";
import { useRouter } from "next/router";
import { useEffect } from "react";
export default function DAODetail() {
    const router = useRouter();
    useEffect(() => {
        if (router.query["address"]) {
            getDAODetail(router.query["address"].toString());
        }
    }, [router.query["address"]])

    return (
        <Row gutter={16}>
            <Col span={8}>
                <DetailItem />
            </Col>
            <Col span={16}>
                <DaoStatistic />
                <DaoTabs />
            </Col>
        </Row>
    )
}