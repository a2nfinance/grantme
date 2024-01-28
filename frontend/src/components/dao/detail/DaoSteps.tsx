import { AddressButton } from "@/components/common/AddressButton"
import { useAppSelector } from "@/controller/hooks"
import { addNewStepMember, getStepMembers, removeStepMember } from "@/core/dao"
import { Badge, Button, Card, Collapse, Descriptions, Divider, Input, Popover, Select, Space, Table } from "antd"
import { useCallback, useEffect, useState } from "react"
import { useWallet } from "useink"

export const DaoSteps = () => {
    const { detail: dao, stepMembers, stepVotings, selectedProposal } = useAppSelector(state => state.daoDetail)
    const { account } = useWallet();
    const { addStepMemberAction, removeStepMemberAction } = useAppSelector(state => state.process);
    const [newStepMember, setNewStepMember] = useState<string>("");
    const [stepIndex, setStepIndex] = useState<number>(0);


    const handleAddNewStepMember = useCallback(() => {
        addNewStepMember(account, stepIndex, newStepMember)
    }, [newStepMember, account, stepIndex])

    useEffect(() => {
        if (dao.contract_address) {
            getStepMembers(dao.contract_address)
        }
    }, [dao?.contract_address])

    return (
        <Card title={"All Steps"} style={{ width: 600, marginRight: "auto", marginLeft: "auto" }}>

            <Space>
                <Popover content={
                    <Space direction="vertical">
                        <Select size={"large"} style={{ width: "100%" }} options={
                            dao.steps.map(step => {
                                return {
                                    label: step.title,
                                    value: step.stepIndex
                                }
                            })
                        } onChange={(value) => setStepIndex(value)} />
                        <Input size="large" placeholder="address" onChange={(e) => setNewStepMember(e.target.value)} />

                        <Button size="large" loading={addStepMemberAction} disabled={account?.address !== dao.admin} onClick={() => handleAddNewStepMember()}>Submit</Button>
                    </Space>
                }
                >
                    <Button type="primary" loading={addStepMemberAction} disabled={account?.address !== dao.admin}

                    >
                        New step member</Button>
                </Popover>
                <span> Only DAO admin can add/remove step members!</span>
            </Space>
            <Divider />
            <Space direction="vertical" style={{ width: "100%" }}>

                {
                    dao.steps.map((step, index) => {
                        let isAdmin = account?.address === dao.admin;
                        let item = <Collapse
                            defaultActiveKey={0}
                            items={[
                                {
                                    label: <>
                                        <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }} /> {step.title}
                                    </>,
                                    key: index,
                                    children: <>
                                        <Descriptions column={1}>
                                            <Descriptions.Item label="Use global voting settings">
                                                {step.useDefaultSettings ? "Yes" : "No"}
                                            </Descriptions.Item>

                                        </Descriptions>
                                        {
                                            !step.useDefaultSettings && <Descriptions column={2}>
                                                <Descriptions.Item label="Custom threshold">
                                                    {step.threshold} %
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Custom quorum">
                                                    {step.quorum} %
                                                </Descriptions.Item>
                                            </Descriptions>
                                        }

                                        {stepMembers.length > 0 && <Table
                                            pagination={false}
                                            columns={[
                                                {
                                                    key: `step-${index}-member`,
                                                    dataIndex: "address",
                                                    title: "Address",
                                                    render: (_, record, memberIndex) => (
                                                        <AddressButton key={`step-${index}-member-${memberIndex}`} address={record.address} />
                                                    )
                                                },
                                                {
                                                    key: `step-${index}-action`,
                                                    dataIndex: "action",
                                                    title: "Action",
                                                    render: (_, record, memberIndex) => (
                                                        <Button
                                                            loading={removeStepMemberAction}
                                                            disabled={!isAdmin}
                                                            key={`step-${index}-member-${memberIndex}-remove`}
                                                            onClick={() => removeStepMember(account, index, record.address)}>
                                                            Remove
                                                        </Button>
                                                    )
                                                }
                                            ]}
                                            dataSource={stepMembers[index].map(m => ({ address: m }))}
                                        />}
                                    </>
                                }
                            ]}
                        />
                        return item
                    })
                }
            </Space>

        </Card>
    )
}