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
                <Form.Item help={"Enable revoting allows people to revote; however, every proposal needs to wait until the voting time has ended to be executed and cannot be executed early."} name={"allow_revoting"} label={"Allow revoting"}>
                    <Radio.Group options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false }
                    ]} />
                </Form.Item>
            </Card>
        </Form>

    )
}