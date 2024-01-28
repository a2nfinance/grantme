"use client";
import { useAllWallets, useWallet } from 'useink';

import { CopyOutlined, DisconnectOutlined } from "@ant-design/icons";

import { useAddress } from '@/hooks/useAddress';
import { Button, Dropdown, Image, MenuProps, Space, message } from "antd";


function WalletConnected() {
  const { account, accounts, disconnect, setAccount } = useWallet()
  const { getShortAddress } = useAddress();
  const [messageApi, contextHolder] = message.useMessage();
  const items: MenuProps['items'] = accounts?.map(a => {
    return {
      key: a?.address,
      label: <Button onClick={() => setAccount(a)} disabled={account === a} block>{a?.name ? a.name : getShortAddress(a?.address)}</Button>
    }
  })
  return (
    <Space>
      {contextHolder}
      <Dropdown menu={{ items }} placement="bottomLeft">

        <Button icon={<CopyOutlined onClick={
          () => {
            window.navigator.clipboard.writeText(account?.address || "");
            messageApi.success("Copied address");
          }
        } />} type="primary" size="large">{account?.name ? account.name : getShortAddress(account?.address || "")}</Button>
      </Dropdown>

      <Button size={"large"} icon={<DisconnectOutlined />} onClick={() => disconnect()}></Button>
    </Space>
  );
}

function ConnectWallet() {
  const { connect } = useWallet()
  const wallets = useAllWallets();

  const items: MenuProps['items'] = wallets.map((connector) => {
    if (typeof window !== "undefined") {
      return {
        key: connector.id,
        label: (
          <Button
            disabled={!connector?.installed}
            icon={<Image alt={connector.extensionName} src={connector?.logo.src} preview={false} width={20} />}
            key={`btt-${connector.id}`}
            onClick={() => connect(connector.extensionName)}
            className="gap-x-2 mr-2"
          >
            {connector.title}
          </Button>
        )
      }
    } else {
      return {
        key: "no-wallet",
        label: "no installed wallet"
      }
    }

  })
  return (
    <div>
      <Dropdown menu={{
        items
      }} placement="bottomLeft">
        <Button size="large" type="primary">Connect Wallet</Button>
      </Dropdown>

    </div>
  );
}

export const WalletBar = () => {
  const { account } = useWallet();

  return account?.address ? <WalletConnected /> : <ConnectWallet />;
}