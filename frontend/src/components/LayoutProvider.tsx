import {
    AppstoreOutlined,
    GithubOutlined,
    HomeOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';

import { Button, Form, Image, Layout, Menu, Space, theme } from 'antd';
import { useRouter } from 'next/router';
import { AiOutlineAppstoreAdd, AiOutlineFileAdd } from "react-icons/ai";
import { FaSuperscript } from "react-icons/fa";
import { RiTaskLine } from "react-icons/ri";
import { MdOutlineWaterDrop, MdOutlineWorkOutline, MdOutlineWorkHistory   } from "react-icons/md";
import { GrGroup } from "react-icons/gr";
import { BsPersonWorkspace } from "react-icons/bs";
import React, { useState } from "react";
import { WalletBar } from './common/WalletBar';
const { Header, Sider, Content, Footer } = Layout;

interface Props {
    children: React.ReactNode | React.ReactNode[];
}

export const LayoutProvider = (props: Props) => {
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} onCollapse={() => setCollapsed(!collapsed)} collapsed={collapsed} style={{ background: colorBgContainer }}>
                <div style={{ height: 50, margin: 16 }}>
                    {
                        !collapsed ? <Image src={"/logo.png"} alt="dpay" preview={false} width={150} /> : <Image src={"/ICON.png"} alt="dpay" preview={false} width={50} height={50} />
                    }
                </div>

                <Menu
                    style={{ fontWeight: 600 }}
                    inlineIndent={10}
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={[
                        {
                            key: '1',
                            icon: <HomeOutlined />,
                            label: "Home",
                            onClick: () => router.push("/")
                        },
                        {
                            key: '2',
                            icon: <AppstoreOutlined />,
                            label: "All DAOs",
                            onClick: () => router.push("/dao/list")
                        },
                        { type: "divider" },
                        {
                            key: "3",
                            type: "group",
                            label: !collapsed ? 'GrantMe v0.0.1' : "",
                            children: [
                                {
                                    key: '3.1',
                                    icon: <FaSuperscript />,
                                    label: 'Twitter',
                                    onClick: () => window.open("https://twitter.com/GrantMeA2N", "_blank")
                                },
                                {
                                    key: '3.2',
                                    icon: <GithubOutlined />,
                                    label: 'Github',
                                    onClick: () => window.open("https://github.com/a2nfinance/grantme", "_blank")
                                },
                            ]
                        },

                    ]}
                />
            </Sider>
            <Layout>

                <Header //@ts-ignore
                    style={{ padding: 0, backgroundColor: colorBgContainer }}>
                    <Space align="center" style={{ display: "flex", justifyContent: "space-between" }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <Form layout="inline">

                            <Form.Item >
                                {/* <AutoSearch /> */}
                            </Form.Item>
                            <Form.Item>

                                <WalletBar />
                            </Form.Item>
                        </Form>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px 0 16px',
                        padding: 16,
                        boxSizing: "border-box",
                        // background: colorBgContainer,
                        maxWidth: 1440,
                        marginRight: "auto",
                        marginLeft: "auto"
                    }}
                >
                    {props.children}
                </Content>
                <Footer style={{ textAlign: 'center', maxHeight: 50 }}>GrantMe ©2024 Created by A2N Finance</Footer>
            </Layout>

        </Layout>
    )

}
