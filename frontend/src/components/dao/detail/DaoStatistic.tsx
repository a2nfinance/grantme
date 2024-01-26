import { useAppSelector } from '@/controller/hooks';
import { getBalanceAndPriceInUSD } from '@/core/dao';
import { Col, Row, Statistic, Typography } from 'antd';
import { useEffect } from 'react';

const {Text} = Typography;

export const DaoStatistic = () => {
  const { detail: dao, balanceInUSD } = useAppSelector(state => state.daoDetail);

  useEffect(() => {
    getBalanceAndPriceInUSD();
  }, [dao.contract_address])

  return (
    <Row gutter={8}>
      <Col span={4}>
        <Statistic title="Programs" value={dao.num_programs} />
      </Col>
      <Col span={4}>
        <Statistic title="Proposals" value={dao.num_proposals} />
      </Col>
      <Col span={4}>
        <Statistic title="Members" value={dao.num_normal_members} />
      </Col>
      <Col span={4}>
        <Statistic title="Contributors" value={dao.num_whitelisted_contributors} />
      </Col>
      <Col span={6}>
        <Statistic title="Balance (TZERO-USD)" value={balanceInUSD} />
      </Col>
    </Row>
  )
}