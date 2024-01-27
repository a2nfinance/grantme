import { AddressButton } from "@/components/common/AddressButton";
import { useAppSelector } from "@/controller/hooks";
import { getProgramProposals } from "@/core/dao";
import { convertU64ToLocalTime } from "@/helpers/data_converter";
import { useAddress } from "@/hooks/useAddress";
import { Button, Table } from "antd";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const ViewProposals = () => {
    const router = useRouter();
    const { selectedProgram, detail, programProposals } = useAppSelector(state => state.daoDetail);
    const { getShortAddress } = useAddress();
    useEffect(() => {
        getProgramProposals();
    }, [detail.contract_address, selectedProgram.programIndex])
    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title'
        },
        {
            title: 'Start date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (_, record) => (
                convertU64ToLocalTime(record.startDate)
            )
        },
        {
            title: 'End date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (_, record) => (
                convertU64ToLocalTime(record.endDate)
            )
        },
        {
            title: 'Beneficiary',
            dataIndex: 'to',
            key: 'to',
            render: (_, record) => (
                <AddressButton address={record.to} />
            )
        },
        {
            title: 'Executed',
            dataIndex: 'executed',
            key: 'executed',
            render: (_, record) => (
                record.executed ? "Yes" : "No"
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                <Button onClick={() => router.push(`/proposal/${detail.contract_address}/${record.proposalIndex}`)}>View detail</Button>
            )

        },
    ];
    return (
        <Table
            pagination={false}
            dataSource={programProposals}
            columns={columns}
        />
    )
}