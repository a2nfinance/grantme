import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { headStyle } from "@/theme/layout";
import { Button, Card, Col, Form, Input, Radio, Row, Space } from "antd";

export const VotingSettings = () => {
    const { votingSettingsForm } = useAppSelector(state => state.daoForm)
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const onFinish = (values: any) => {
        dispatch(setDaoFormProps({ att: "votingSettingsForm", value: values }))
        dispatch(setDaoFormProps({ att: "currentStep", value: 2 }))
    };
    return (
        <Form
            form={form}
            name='voting-settings-form'
            initialValues={votingSettingsForm}
            onFinish={onFinish}
            layout='vertical'
            autoComplete="off"
        >
            <Card title="Voting Settings" headStyle={headStyle} extra={
                <Space>
                    <Button type="primary" size='large' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 0 }))}>Back</Button>
                    <Button type="primary" htmlType='submit' size='large'>Next</Button>
                </Space>

            }>
                <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Missing title' }]}>
                    <Input size='large' />
                </Form.Item>
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item name="quorum" label="Quorum" rules={[{ required: true, message: 'Missing quorum' }]}>
                            <Input type="number" size='large' />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="threshold" label="Threshold" rules={[{ required: true, message: 'Missing threshold' }]}>
                            <Input type="number" size='large' />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item help={"Proposals can not early execute if a DAO allows revoting."} name={"allow_revoting"} label={"Allow revoting"}>
                    <Radio.Group options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false }
                    ]} />
                </Form.Item>
            </Card>
        </Form>

    )
}