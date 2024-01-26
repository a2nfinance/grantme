import { VotingStatus } from '@/controller/dao/daoDetailSlice';
import { convertVotingStatus } from '@/helpers/data_converter';
import { Progress, Tooltip } from 'antd';

export const ThresholdSlider = ({ threshold, votingStatus }: { threshold: number, votingStatus: VotingStatus }) => {
    votingStatus = convertVotingStatus(votingStatus);
    return (
        <Tooltip title={`${votingStatus.agree} agree | ${votingStatus.disagree} disagree |  ${votingStatus.neutral} abstain `}>
            <Progress percent={threshold} success={{
                percent: votingStatus.agree * 100 / (votingStatus.agree + votingStatus.disagree + votingStatus.neutral)
            }} />
        </Tooltip>
    )

}
