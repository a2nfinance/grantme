
import { Button, Card, Collapse, Descriptions, Divider, Space } from "antd";
import { useRouter } from "next/router";

import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { createDao } from "@/core/dao_factory";
import { useAddress } from "@/hooks/useAddress";
import { headStyle } from "@/theme/layout";
import { useCallback } from "react";
import { useWallet } from "useink";

export const ReviewAndApprove = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { account } = useWallet();
    const { kycForm, votingSettingsForm, stepsForm, contributorForm, memberForm } = useAppSelector(state => state.daoForm);
    const { getShortAddress, openLinkToExplorer } = useAddress();
    const { createDAOAction } = useAppSelector(state => state.process);

    const handleCreateDAO = useCallback(() => {
        createDao(account);
    }, [account])
    return (
        <Card title="Summary" headStyle={headStyle} style={{ maxWidth: 680 }} extra={
            <Button type="primary" htmlType='button' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 4 }))} size='large'>Back</Button>
        }>
            <Descriptions title={"General Information"} column={2} layout="vertical">
                <Descriptions.Item label="Name">
                    {kycForm.name}
                </Descriptions.Item>
                <Descriptions.Item label="Website">
                    {kycForm.website}
                </Descriptions.Item>
                <Descriptions.Item label="Who can create proposal">
                    {memberForm.open ? "Everyone" : "Only members"}
                </Descriptions.Item>

            </Descriptions>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label="Short description">
                    {kycForm.description}
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Collapse
                items={[{
                    key: '1',
                    label: 'Voting settings',
                    children: <Descriptions title="Voting settings" column={2} layout="vertical">
                        <Descriptions.Item label="Quorum">
                            {votingSettingsForm.quorum} %
                        </Descriptions.Item>

                        <Descriptions.Item label="Threshold">
                            {votingSettingsForm.threshold} %
                        </Descriptions.Item>
                        <Descriptions.Item label="Allow revoting">
                            {votingSettingsForm.allow_revoting ? "Yes" : "No"}
                        </Descriptions.Item>


                    </Descriptions>
                }]}
            />

            <Divider />

            <Collapse
                items={[{
                    key: '1',
                    label: 'Workflow steps',
                    children: <Space direction="vertical">{

                        stepsForm.steps.map((step, index) => {
                            return (
                                <Card title={`Step (${index})`}>
                                    <Descriptions column={2}  layout="vertical">
                                        <Descriptions.Item label={"Title"}>
                                            {step.title}
                                        </Descriptions.Item>
                                        <Descriptions.Item label={"Use global voting settings"}>
                                            {step.use_default_settings ? "Yes" : "No"}
                                        </Descriptions.Item>

                                        {!step.use_default_settings && <Descriptions.Item label={"Custom quorum"}>
                                            {step.quorum} %

                                        </Descriptions.Item>}
                                        {!step.use_default_settings && <Descriptions.Item label={"Custom threshold"}>
                                            {step.threshold} %
                                        </Descriptions.Item>}

                                    </Descriptions>

                                    <Descriptions column={1} layout="vertical">

                                        <Descriptions.Item label="Step members">
                                            <Space>
                                                {step.step_members.map((member, m_index) => {
                                                    return <Button key={`step-member-${index}-${m_index}`}>{getShortAddress(member.address)}</Button>
                                                })}
                                            </Space>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            )
                        })

                    }</Space>
                }]}
            />


            <Divider />

            <Collapse
                items={[{
                    key: '1',
                    label: 'Whitelisted contributors',
                    children: <Descriptions column={1} layout="vertical">
                        <Space>
                            {
                                contributorForm.contributors.map((m, index) => {
                                    return <Button key={`contributor-${index}`}>{getShortAddress(m.address)}</Button>
                                })
                            }
                        </Space>
                    </Descriptions>
                }]}
            />

            <Divider />
            <Collapse
                items={[{
                    key: '1',
                    label: 'Initial members',
                    children: <Descriptions column={1} layout="vertical">
                        <Descriptions.Item>
                            <Space>
                                {
                                    memberForm.members.map((m, index) => {
                                        return <Button key={`member-${index}`}>{getShortAddress(m.address)}</Button>
                                    })
                                }
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>
                }]}
            />
            <br />

            <Button disabled={!account} loading={createDAOAction} type="primary" size="large" block onClick={() => handleCreateDAO()}>
                Submit
            </Button>

        </Card>
    )
}