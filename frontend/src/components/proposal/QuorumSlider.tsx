import { VotingStatus } from '@/controller/dao/daoDetailSlice';
import { convertVotingStatus } from '@/helpers/data_converter';
import { Progress, Tooltip } from 'antd';

export const QuorumSlider = ({ quorum, votingStatus, stepMembers }: { quorum: number, votingStatus: VotingStatus, stepMembers: string[] }) => {
    votingStatus = convertVotingStatus(votingStatus);
    return (
        <Tooltip title={`${votingStatus.agree + votingStatus.disagree + votingStatus.neutral} voter(s) / ${stepMembers.length} total step members.`}>
            <Progress percent={quorum} success={{
                percent: (votingStatus.agree + votingStatus.disagree + votingStatus.neutral) * 100 / stepMembers.length
            }} />
        </Tooltip>
    )

}
