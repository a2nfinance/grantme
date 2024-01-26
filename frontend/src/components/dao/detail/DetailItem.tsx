import { useAppSelector } from '@/controller/hooks';
import { useAddress } from '@/hooks/useAddress';
import { headStyle } from '@/theme/layout';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Divider, Flex, Space } from 'antd';
import { GoOrganization } from 'react-icons/go';

export const DetailItem = () => {
  const { detail: dao } = useAppSelector(state => state.daoDetail);

  const { openLinkToExplorer, getShortAddress } = useAddress();


  const socialNetworks = [
    "Twitter",
    "Telegram",
    "Discord",
    "Facebook"
  ]
  return (
    <Card key={`dao`} title={<Flex align='center' gap={5}><GoOrganization />{dao.name}</Flex>} headStyle={headStyle} style={{ margin: 5 }}>
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
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Description"}>{dao.description ? dao.description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
    </Card>
  );
}