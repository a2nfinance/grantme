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
                        description: "Defind voting settings"
                    },
                    {
                        title: 'Workflow Steps',
                        description: "A proposal will be reviewed in all steps."
                    },
                    {
                        title: 'Whitelisted contributors',
                        description: "Who can fund your DAO"
                    },
                    {
                        title: 'Members',
                        description: "Who can create proposals"
                    },
                    {
                        title: 'Review & Submit',
                        //description: "DAO is initialized with settings"
                    },
                ]}
            />
        </Card>

    )
}