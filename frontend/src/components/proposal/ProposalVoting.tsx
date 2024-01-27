import { useAppSelector } from "@/controller/hooks"
import { doVote, executeProposal, isAllowToExecute } from "@/core/dao"
import { Alert, Badge, Button, Card, Collapse, Descriptions, Divider, Space } from "antd"
import { useWallet } from "useink"
import { QuorumSlider } from "./QuorumSlider"
import { ThresholdSlider } from "./ThresholdSlider"

export const ProposalVoting = () => {
    const { detail: dao, stepMembers, stepVotings, selectedProposal } = useAppSelector(state => state.daoDetail)
    const { account } = useWallet();
    const { votingAction, executeAction } = useAppSelector(state => state.process);

    return (
        <Card title={"Voting progress"}>
            <Space direction="vertical" style={{ width: "100%" }}>
                {
                    !selectedProposal.executed
                    && (stepMembers.length > 0)
                    && isAllowToExecute()
                    && <Button type="primary" loading={executeAction} size="large" block onClick={() => executeProposal(account)}>Execute</Button>
                }
                {
                    selectedProposal.executed && <Button type="primary" block disabled={true} size="large">Executed Proposal</Button>
                }
                {
                    stepVotings.map((step, index) => {
                        let isStepMember = stepMembers[index].indexOf(account?.address || "") !== -1;

                        let item = <Collapse
                            defaultActiveKey={0}
                            items={[
                                {
                                    label: <>
                                        <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }} /> {dao.steps[index].title}
                                    </>,
                                    key: index,
                                    children: <>
                                        <Descriptions column={3}>
                                            <Descriptions.Item label={"Aggree"}>
                                                {step.agree}
                                            </Descriptions.Item>
                                            <Descriptions.Item label={"Disagree"}>
                                                {step.disagree}
                                            </Descriptions.Item>
                                            <Descriptions.Item label={"Abstain"}>
                                                {step.neutral}
                                            </Descriptions.Item>
                                        </Descriptions>
                                        <Descriptions column={1}>
                                            <Descriptions.Item label="Use global settings">
                                                {dao.steps[index].useDefaultSettings ? "Yes" : "No"}
                                            </Descriptions.Item>

                                        </Descriptions>
                                        {
                                            !dao.steps[index].useDefaultSettings && <Descriptions column={2}>
                                                <Descriptions.Item label="Custom threshold">
                                                    {dao.steps[index].threshold} %
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Custom quorum">
                                                    {dao.steps[index].quorum} %
                                                </Descriptions.Item>
                                            </Descriptions>
                                        }
                                        <Divider />
                                        <Descriptions column={1}>
                                            <Descriptions.Item label={"Threshold"}>
                                                <ThresholdSlider
                                                    threshold={
                                                        dao.steps[index].useDefaultSettings ? dao.global_voting_threshold : dao.steps[index].threshold
                                                    } votingStatus={stepVotings[index]} />
                                            </Descriptions.Item>
                                            <Descriptions.Item label={"Quorum"}>
                                                <QuorumSlider
                                                    quorum={
                                                        dao.steps[index].useDefaultSettings ? dao.global_voting_quorum : dao.steps[index].quorum
                                                    } votingStatus={stepVotings[index]} stepMembers={stepMembers[index]} />
                                            </Descriptions.Item>
                                        </Descriptions>
                                        <Divider />
                                        {
                                            !selectedProposal.executed && !isStepMember && <>
                                                <Alert message={"You are not a step member to vote"} type="warning" showIcon />
                                                <Divider />
                                            </>
                                        }
                                        {!selectedProposal.executed && <Space style={{ width: "100%" }} wrap>
                                            <Button disabled={!isStepMember} loading={votingAction} type="primary" onClick={() => doVote(account, index, 1)}>Aggree</Button>
                                            <Button disabled={!isStepMember} loading={votingAction} type="dashed" onClick={() => doVote(account, index, 2)}>Reject</Button>
                                            <Button disabled={!isStepMember} loading={votingAction} type="dashed" onClick={() => doVote(account, index, 3)}>Abstain</Button>
                                        </Space>
                                        }
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