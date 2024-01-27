import { AddressButton } from "@/components/common/AddressButton";
import { useAppSelector } from "@/controller/hooks";
import { addNewContributor, addNewMember, fundDAO, getWhitelistedContributors, removeOldContributor } from "@/core/dao";
import { Button, Divider, Input, Popover, Space, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "useink";

export const WhitelistedContributors = () => {
    const { contributors, detail } = useAppSelector(state => state.daoDetail);
    const { account } = useWallet();
    const [fundAmount, setFundAmount] = useState<number>(0);
    const { fundDAOAction, removeContributorAction, addContributorAction } = useAppSelector(state => state.process);
    const [newContributor, setNewContributor] = useState<string>("");
    const columns = [
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => (
                <AddressButton address={record.address} />
            )
        },


        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                <Button
                    key={`remove-${index}`}
                    loading={removeContributorAction}
                    onClick={() => removeOldContributor(account, record.address)}>Remove</Button>
            )

        },
    ];

    const handleSendFund = useCallback(() => {
        fundDAO(account, fundAmount);
    }, [fundAmount, account?.address])

    const handleAddNewContributor = useCallback(() => {
        addNewContributor(account, newContributor)
    }, [newContributor, account?.address])

    useEffect(() => {
        getWhitelistedContributors();
    }, [])
    return (
        <>

            <Space>
                <Popover content={
                    <Space>
                        <Input type="number" size="large" placeholder="amount" onChange={(e) => setFundAmount(parseFloat(e.target.value))} />
                        <Button size="large" loading={fundDAOAction} disabled={contributors.indexOf(account?.address || "") === -1} onClick={() => handleSendFund()}>Send</Button>
                    </Space>
                }
                >
                    <Button type="primary" loading={fundDAOAction} disabled={contributors.indexOf(account?.address || "") === -1}

                    >
                        Fund</Button>
                </Popover>
                <span> Only whitelisted contributors can fund this DAO</span>
            </Space>


            <Divider />
            <Space>
                <Popover content={
                    <Space>
                        <Input size="large" placeholder="address" onChange={(e) => setNewContributor(e.target.value)} />
                        <Button size="large" loading={addContributorAction} disabled={account?.address !== detail.admin} onClick={() => handleAddNewContributor()}>Submit</Button>
                    </Space>
                }
                >
                    <Button type="primary" loading={addContributorAction} disabled={account?.address !== detail.admin}

                    >
                        New contributor</Button>
                </Popover>
                <span> Only DAO admin can add new contributors!</span>
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