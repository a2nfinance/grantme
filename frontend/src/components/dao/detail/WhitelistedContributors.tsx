import { useAppSelector } from "@/controller/hooks"
import { fundDAO, getWhitelistedContributors } from "@/core/dao";
import { useAddress } from "@/hooks/useAddress";
import { Button, Divider, Input, Popover, Space, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "useink";

export const WhitelistedContributors = () => {
    const { contributors, detail } = useAppSelector(state => state.daoDetail);
    const { account } = useWallet();
    const { getShortAddress } = useAddress();
    const [fundAmount, setFundAmount] = useState<number>(0);
    const {fundDAOAction} = useAppSelector(state => state.process);

    const columns = [
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => (
                <Button>{getShortAddress(record.address)}</Button>
            )
        },


        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                // <Popover key={`popover-${index}`} content={
                //     <Space direction="vertical">
                //         <Button block onClick={() => handleViewDetail(record, index)}>View detail</Button>
                //         <Divider />
                //         <Button block onClick={() => handleNewProposal(record, index)}>New proposal</Button>
                //         <Button block onClick={() => handleOpenProposalList(record, index)}>View proposals</Button>
                //         <Divider />
                //     </Space>
                // }>
                //     <Button type="primary">actions</Button>
                // </Popover>
                <></>
            )

        },
    ];

    const handleSendFund = useCallback(() => {
        fundDAO(account, fundAmount);
    }, [fundAmount, account?.address])
    useEffect(() => {
        getWhitelistedContributors();
    }, [])
    return (
        <>

            <Space>
                <Popover content={
                    <Space>
                        <Input type="number" size="large" placeholder="amount" onChange={(e) => setFundAmount(parseFloat(e.target.value))}/>
                        <Button size="large" loading={fundDAOAction} disabled={account?.address !== detail.admin} onClick={() => handleSendFund()}>Send</Button>
                    </Space>
                }
                    >
                    <Button type="primary" loading={fundDAOAction} disabled={account?.address !== detail.admin}

                    >
                        Fund</Button>
                </Popover>
                <span> Only whitelisted contributors can fund this DAO</span>
            </Space>


            <Divider />
            <Table
                pagination={false}
                dataSource={contributors.map(m => ({
                    address: m
                }))}
                columns={columns}
            />
        </>
    )
}