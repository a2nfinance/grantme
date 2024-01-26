import { ProgramList } from '@/components/program/ProgramList';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { WhitelistedContributors } from './WhitelistedContributors';




export const DaoTabs = () => {

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: `Programs`,
            children: <ProgramList />,
        },
        {
            key: '2',
            label: `Proposals`,
            children: <></>
        },
        {
            key: '3',
            label: `Steps`,
            children: <></>
        },
        {
            key: '4',
            label: `Whitelisted Contributors`,
            children: <WhitelistedContributors />
        }
    ];

    return (
        <Tabs defaultActiveKey="1" items={items} onChange={() => { }} />
    )
}