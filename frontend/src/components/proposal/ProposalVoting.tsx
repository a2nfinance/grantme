import { useAppSelector } from "@/controller/hooks"
import { Alert, Badge, Button, Card, Descriptions, Divider, Flex, Space } from "antd"
import { useEffect } from "react"
import { ThresholdSlider } from "./ThresholdSlider"
import { QuorumSlider } from "./QuorumSlider"
import { useWallet } from "useink"
import { doVote, isAllowToExecute } from "@/core/dao"

export const ProposalVoting = () => {
    const { selectedProposal, detail: dao, stepMembers, stepVotings } = useAppSelector(state => state.daoDetail)
    const { account } = useWallet();
    const { votingAction } = useAppSelector(state => state.process);
    // useEffect(() => {
    //     // get step members
    //     // get voting status
    // }, [selectedProposal.proposalIndex])
    return (
        <Card title={"Voting progress"}>
            {
                stepVotings.map((step, index) => {
                    let isStepMember = stepMembers[index].indexOf(account?.address || "") !== -1;
                    return <Card
                        title={
                            <>
                                <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }} /> {dao.steps[index].title}
                            </>
                        }>
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
                            !isStepMember && <>
                                <Alert message={"You are not a step member to vote"} type="warning" showIcon />
                                <Divider />
                            </>
                        }
                        <Space style={{ width: "100%" }} wrap>
                            <Button disabled={!isStepMember} loading={votingAction} type="primary" onClick={() => doVote(account, index, 1)}>Aggree</Button>
                            <Button disabled={!isStepMember} loading={votingAction} type="dashed" onClick={() => doVote(account, index, 2)}>Reject</Button>
                            <Button disabled={!isStepMember} loading={votingAction} type="dashed" onClick={() => doVote(account, index, 3)}>Abstain</Button>
                        </Space>
                        {
                            isAllowToExecute(
                                step,
                                stepMembers[index].length,
                                dao.steps[index].useDefaultSettings ? dao.global_voting_threshold : dao.steps[index].threshold,
                                dao.steps[index].useDefaultSettings ? dao.global_voting_quorum : dao.steps[index].quorum,
                            ) && <>
                                <Divider />
                                <Button type="primary" block size="large">Execute</Button>
                            </>
                        }
                    </Card>
                })
            }
        </Card>
    )
}