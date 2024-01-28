import { headStyle } from '@/theme/layout';
import { Card, Steps } from 'antd';
import { useAppSelector } from '../../controller/hooks';

export const DAOCreationProgress = () => {
    const { currentStep } = useAppSelector(state => state.daoForm)
    return (
        <Card title={"Steps"} headStyle={headStyle}>
            <Steps
                direction='vertical'
                current={currentStep}
                items={[
                    {
                        title: 'General information',
                        description: "DAO basic information and social networks"
                    },
                    {
                        title: 'Voting settings',
                        description: "Define options such as global quorum, global threshold, and revoting."
                    },
                    {
                        title: 'Workflow Steps',
                        description: "A proposal needs reviews and voting at all steps."
                    },
                    {
                        title: 'Whitelisted contributors',
                        description: "Who can fund your DAO with TZERO tokens."
                    },
                    {
                        title: 'Members',
                        description: "If your DAO is not open, a member is the only one who can create proposals."
                    },
                    {
                        title: 'Review & Submit',
                    },
                ]}
            />
        </Card>

    )
}