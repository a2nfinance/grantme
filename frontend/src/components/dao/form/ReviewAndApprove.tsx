
import { Button, Card, Descriptions, Divider, Form, Space, Tag } from "antd";
import { useRouter } from "next/router";

import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { useAddress } from "@/hooks/useAddress";
import { headStyle } from "@/theme/layout";
import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { createDAO } from "@/core/dao";
import { useWallet } from "useink";

export const ReviewAndApprove = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { account } = useWallet();
    const { kycForm, votingSettingsForm, stepsForm, contributorForm, memberForm } = useAppSelector(state => state.daoForm);
    const { getShortAddress, openLinkToExplorer } = useAddress();
    const { createDAOAction } = useAppSelector(state => state.process)
    return (
        <Card title="Summary" headStyle={headStyle} style={{ maxWidth: 500 }} extra={
            <Button type="primary" htmlType='button' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 4 }))} size='large'>Back</Button>
        }>
            <Descriptions title={"General Info"} column={2} layout="vertical">
                <Descriptions.Item label="Name">
                    {kycForm.name}
                </Descriptions.Item>
                <Descriptions.Item label="Website">
                    {kycForm.website}
                </Descriptions.Item>

            </Descriptions>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label="Short description">
                    {kycForm.description}
                </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Descriptions title="Voting settings" column={2} layout="vertical">
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
            <Divider />
            <Descriptions title="Workflow steps" column={1} layout="vertical">
                {
                    stepsForm.steps.map((step, index) => {
                        return (
                            <Descriptions.Item label={`Step (${index}): ${step.title}`}>
                                {step.use_default_settings ? "Use global voting settings" : "Custom voting settings"}
                                <br/>
                                {step.use_default_settings ? "" : <>
                                    Custom quorum: {step.quorum}<br/>
                                    Custom threshold: {step.threshold}
                                </>}
                                <br/>
                                
                                <Space>
                                    {step.step_members.map((member, m_index) => {
                                        return <Button key={`step-member-${index}-${m_index}`}>{getShortAddress(member.address)}</Button>
                                    })}
                                </Space>
                            </Descriptions.Item>
                        )
                    })
                }
            </Descriptions>
            <Divider />
            <Descriptions title="Whitelisted contributors" column={1} layout="vertical">
                <Space>
                    {
                        contributorForm.contributors.map((m, index) => {
                            return <Button key={`contributor-${index}`}>{getShortAddress(m.address)}</Button>
                        })
                    }
                </Space>
            </Descriptions>
            <Divider />

            <Descriptions title="Inital members" column={1} layout="vertical">
                <Descriptions.Item label="Who can create proposal">
                    {memberForm.open ? "Everyone" : "Only members"}
                </Descriptions.Item>
                <Descriptions.Item label="Members">
                    <Space>
                        {
                            memberForm.members.map((m, index) => {
                                return <Button key={`member-${index}`}>{getShortAddress(m.address)}</Button>
                            })
                        }
                    </Space>
                </Descriptions.Item>
            </Descriptions>

            <Button disabled={!account} loading={createDAOAction} type="primary" size="large" block onClick={() => createDAO(account)}>
                Submit
            </Button>
        </Card>
    )
}
