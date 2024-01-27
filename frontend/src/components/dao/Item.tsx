import { DaoDetail } from '@/controller/dao/daoDetailSlice';
import { useAddress } from '@/hooks/useAddress';
import { headStyle } from '@/theme/layout';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Divider, Flex, Space } from 'antd';
import { useRouter } from 'next/router';
import { GoOrganization } from "react-icons/go";

export const Item = ({ index, dao }: {index: number, dao: DaoDetail}) => {
  const router = useRouter();
  const socialNetworks = [
    "Twitter",
    "Telegram",
    "Discord",
    "Facebook"
  ]
  return (
    <Card key={`dao-${index}`} title={<Flex align='center' gap={5}><GoOrganization />{dao.name}</Flex>} headStyle={headStyle} style={{ margin: 5 }} extra={
      <Space>
        <Button type='primary' onClick={() => router.push(`/dao/detail/${dao.contract_address}`)}>View details</Button>
      </Space>

    }>
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Website"}>{dao.website ? dao.website : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Social networks"}>
          <Space wrap>
            {
              dao.social_accounts.length ? dao.social_accounts.map(
                (sn, index) => sn ? <Button icon={<LinkOutlined />} key={sn} onClick={() => window.open(sn, "_blank")}>{
                  sn ? socialNetworks[index] : ""
                }</Button> : <></>
              ) : "N/A"}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={"Address"}>{dao.address}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <Descriptions layout={"vertical"} style={{ minHeight: 100 }} column={1}>
        <Descriptions.Item label={"Description"} >{dao.description ? dao.description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
    </Card>
  );
}