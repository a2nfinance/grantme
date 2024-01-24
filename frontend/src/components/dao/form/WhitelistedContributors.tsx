import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { accountAddressValid } from "@/helpers/data_validation";
import { headStyle } from "@/theme/layout";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Space } from "antd"
import { AiOutlineWallet } from "react-icons/ai";

export const WhitelistedContributors = () => {
    const { contributorForm } = useAppSelector(state => state.daoForm)
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const onFinish = (values: any) => {
        dispatch(setDaoFormProps({att: "contributorForm", value: values}))
        dispatch(setDaoFormProps({ att: "currentStep", value: 4 }))
    };
    return (
        <Form
            form={form}
            name='contributor-form'
            initialValues={contributorForm}
            onFinish={onFinish}
            layout='vertical'
            autoComplete="off"
        >
            <Card title="Whitelisted contributors" headStyle={headStyle} extra={
                <Space>
                    <Button type="primary" size='large' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 2 }))}>Back</Button>
                    <Button type="primary" htmlType='submit' size='large'>Next</Button>
                </Space>

            }>
                <Form.List name="contributors">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <Row key={key} style={{ display: 'flex', marginBottom: 8 }} gutter={12}>
                                    <Col span={20}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'address']}
                                            rules={[{ required: true, message: 'Missing address' }, accountAddressValid]}
                                        >
                                            <Input addonBefore={<AiOutlineWallet />} size='large' placeholder="account address" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Col>

                                </Row>
                            ))}

                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add contributor
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Card>
        </Form>

    )
}