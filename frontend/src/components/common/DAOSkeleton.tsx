import { Col, Row, Skeleton } from "antd"

export const DAOSkeleton = () => {
    return (
        <Row gutter={16} style={{width: 1200}}>
            <Col span={8}>
                <Skeleton active/>
                <Skeleton active />
                <Skeleton active />
                <Skeleton active/>
            </Col>
            <Col span={16}>
                <Skeleton active/>
                <Skeleton active/>
                <Skeleton active/>
                <Skeleton active/>
            </Col>
        </Row>
    )
}