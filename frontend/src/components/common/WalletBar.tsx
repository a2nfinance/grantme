"use client";
import { useWallet, useAllWallets } from 'useink';

import { DisconnectOutlined } from "@ant-design/icons";

import { Button, Dropdown, Image, MenuProps, Space, message  } from "antd";
import { useMemo } from "react";


function WalletConnected() {
  const { account, disconnect } = useWallet()
  const [messageApi, contextHolder] = message.useMessage();



  const shortenedAddress = useMemo(() => {
    if (!account?.address) return "";
    return `${account?.address.slice(0, 6)}...${account?.address.slice(-4)}`;
  }, [account?.address]);

  return (
    <Space>
      {contextHolder}
      <Button 
      // icon={<Image src={connector?.logo.src} preview={false} width={20} />} 
      type="primary" size="large" onClick={() => { window.navigator.clipboard.writeText(account?.address || ""); messageApi.success("Copied address")}}>{shortenedAddress}</Button>
      <Button size={"large"} icon={<DisconnectOutlined />} onClick={() => disconnect()}></Button>
    </Space>
  );
}

function ConnectWallet() {
  const { connect } = useWallet()
  const wallets = useAllWallets();

  const items: MenuProps['items'] = wallets.map((connector) => {
    if (typeof window !== "undefined" && connector?.installed ) {
      return {
        key: connector.id,
        label: (
          <Button
            icon={<Image src={connector?.logo.src} preview={false} width={20} />}
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
        label: ""
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