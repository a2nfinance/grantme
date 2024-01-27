import { Col, Row, Skeleton, Space } from "antd"

export const CardListSkeleton = () => {
    return (
        <Row gutter={8}>
            {[1, 2, 3].map(num => {
                return (<Col span={8} key={num}>
                    <Space>
                        <Skeleton.Button active={true} size={"default"} shape={"square"} block />
                        <Skeleton.Avatar active={true} size={"default"} shape={"square"} />
                        <Skeleton.Input active={true} size={"default"} />
                    </Space>
                    <br />
                    <br />
                    <Skeleton.Button active={true} size={"default"} shape={"square"} block />
                    <br />
                    <br />
                    <Skeleton.Input active={true} size={"large"} />
                    <br />
                    <br />
                    <Space>
                        <Skeleton.Input active={true} size={"large"} />
                        <Skeleton.Input active={true} size={"large"} />
                    </Space>
                    <br />
                    <br />
                    <Space>
                        <Skeleton.Input active={true} size={"large"} />
                        <Skeleton.Input active={true} size={"large"} />
                    </Space>

                </Col>)
            })
            }
        </Row>
    )
}