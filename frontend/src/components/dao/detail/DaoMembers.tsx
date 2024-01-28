import { AddressButton } from "@/components/common/AddressButton";
import { useAppSelector } from "@/controller/hooks";
import { addNewMember, getWhitelistedContributors, removeOldMember } from "@/core/dao";
import { Button, Divider, Input, Popover, Space, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "useink";

export const DaoMembers = () => {
    const { members, detail } = useAppSelector(state => state.daoDetail);
    const { account } = useWallet();

    const [newMember, setNewMember] = useState<string>("");
    const { addMemberAction, removeMemberAction } = useAppSelector(state => state.process);

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
                    loading={removeMemberAction}
                    onClick={() => removeOldMember(account, record.address)}>Remove</Button>

            )

        },
    ];

    const handleAddNewMember = useCallback(() => {
        addNewMember(account, newMember)
    }, [newMember, account])
    useEffect(() => {
        getWhitelistedContributors();
    }, [])
    return (
        <>

            <Space>
                <Popover content={
                    <Space>
                        <Input size="large" placeholder="address" onChange={(e) => setNewMember(e.target.value)} />
                        <Button size="large" loading={addMemberAction} disabled={account?.address !== detail.admin} onClick={() => handleAddNewMember()}>Submit</Button>
                    </Space>
                }
                >
                    <Button type="primary" loading={addMemberAction} disabled={account?.address !== detail.admin}

                    >
                        New member</Button>
                </Popover>
                <span> Only DAO admin can add new members!</span>
            </Space>


            <Divider />
            <Table
                pagination={false}
                dataSource={members.map(m => ({
                    address: m
                }))}
                columns={columns}
            />
        </>
    )
}