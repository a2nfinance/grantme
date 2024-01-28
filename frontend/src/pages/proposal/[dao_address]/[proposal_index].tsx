import { AddressButton } from "@/components/common/AddressButton";
import { ProposalVoting } from "@/components/proposal/ProposalVoting";
import { useAppSelector } from "@/controller/hooks";
import { getDaoProposalDetail } from "@/core/dao";
import { convertU64ToLocalTime } from "@/helpers/data_converter";
import { useAddress } from "@/hooks/useAddress";
import { Button, Card, Col, Descriptions, Divider, Row } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProposalDetail() {
    const { selectedProposal, detail: dao } = useAppSelector(state => state.daoDetail);
    const { getShortAddress } = useAddress();
    const router = useRouter();
    useEffect(() => {
        let contractAddress = router.query["dao_address"];
        let proposalIndex = router.query["proposal_index"];
        if (contractAddress && proposalIndex) {
            getDaoProposalDetail(contractAddress.toString(), parseInt(proposalIndex.toString()));
        }
    }, [router.query])
    return (
        <>
            <Head>
                <title>Proposal: {selectedProposal.title}</title>
            </Head>
            <Row style={{ maxWidth: 1020 }} gutter={8}>
            <Col span={14}>
                <Card title={"Proposal Information"}>
                    <Descriptions column={2} layout="vertical">
                        <Descriptions.Item label={"Title"}>
                            {selectedProposal.title}
                        </Descriptions.Item>
                        <Descriptions.Item label={"Proposer"}>
                            <AddressButton address={selectedProposal.proposer} />
                        </Descriptions.Item>
                        <Descriptions.Item label={"Start date"}>
                            {convertU64ToLocalTime(selectedProposal.startDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label={"End date"}>
                            {convertU64ToLocalTime(selectedProposal.endDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label={"Amount will be calculated in fiat"}>
                            {selectedProposal.useFiat ? "Yes" : "No"}
                        </Descriptions.Item>
                        {
                            selectedProposal.useFiat && <Descriptions.Item label={"Fiat amount"}>
                                {selectedProposal.paymentAmountFiat} USD
                            </Descriptions.Item>
                        }

                        {
                            !selectedProposal.useFiat && <Descriptions.Item label={"Token amount"}>
                                {selectedProposal.paymentEmountCrypto} TZERO
                            </Descriptions.Item>
                        }

                        <Descriptions.Item label={"Allow early execute"}>
                            {selectedProposal.allowEarlyExecuted ? "Yes" : "No"}
                        </Descriptions.Item>

                        <Descriptions.Item label={"Executed"}>
                            {selectedProposal.executed ? "Yes" : "No"}
                        </Descriptions.Item>

                    </Descriptions>
                    <Divider />
                    <Descriptions column={1} layout="vertical">
                        <Descriptions.Item label={"Description"}>
                            {selectedProposal.description}
                        </Descriptions.Item>
                    </Descriptions>
                    <Divider />
                    <Descriptions column={2} layout="vertical">
                        <Descriptions.Item label={"Global quorum"}>
                            {dao.global_voting_quorum} %
                        </Descriptions.Item>
                        <Descriptions.Item label={"Global threshold"}>
                            {dao.global_voting_threshold} %
                        </Descriptions.Item>
                        <Descriptions.Item label={"Allow revoting"}>
                            {dao.allow_revoting ? "Yes" : "No"}
                        </Descriptions.Item>
                        <Descriptions.Item label={"DAO"}>
                            <Button onClick={() => router.push(`/dao/detail/${dao.contract_address}`)}>{dao.name}</Button>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            </Col>
            <Col span={10}>
                <ProposalVoting />
            </Col>

        </Row>
        </>
        
    )
}