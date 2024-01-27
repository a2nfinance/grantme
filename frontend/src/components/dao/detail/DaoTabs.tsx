import { ProgramList } from '@/components/program/ProgramList';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { WhitelistedContributors } from './WhitelistedContributors';
import { DaoMembers } from './DaoMembers';
import { DaoSteps } from './DaoSteps';




export const DaoTabs = () => {

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: `Programs`,
            children: <ProgramList />,
        },
        {
            key: '2',
            label: `Steps`,
            children: <DaoSteps />
        },
        {
            key: '3',
            label: `Whitelisted Contributors`,
            children: <WhitelistedContributors />
        },
        {
            key: '4',
            label: `Members`,
            children: <DaoMembers />
        },

    ];

    return (
        <Tabs defaultActiveKey="1" items={items} onChange={() => { }} />
    )
}