import { DAOCreationProgress } from "@/components/dao/DAOCreationProgress";
import { WhitelistedContributors, General, Members, VotingSettings, Steps } from "@/components/dao/form";
import { ReviewAndApprove } from "@/components/dao/form/ReviewAndApprove";
import { useAppSelector } from "@/controller/hooks";
import { Col, Row, Space } from "antd";
import Head from "next/head";

export default function NewDAO() {
    const { currentStep } = useAppSelector(state => state.daoForm);
    return (
        <div style={{ maxWidth: 1440, minWidth: 900, margin: "auto" }}>
             <Head>
                <title>New DAO</title>
            </Head>
            <Row gutter={10}>
                <Col span={14}>

                    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                        {currentStep === 0 && <General />}
                        {currentStep === 1 && <VotingSettings />}
                        {currentStep === 2 && <Steps />}
                        {currentStep === 3 && <WhitelistedContributors />}
                        {currentStep === 4 && <Members />}
                        {currentStep === 5 && <ReviewAndApprove />}
                    </Space>
                </Col>
                <Col span={10}><DAOCreationProgress /></Col>
            </Row>

        </div>
    )
}