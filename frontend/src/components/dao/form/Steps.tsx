import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { accountAddressValid } from "@/helpers/data_validation";
import { headStyle } from "@/theme/layout";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Radio, Row, Space } from "antd"
import { useState } from "react";
import { AiOutlineWallet } from "react-icons/ai";

export const Steps = () => {
    const { stepsForm } = useAppSelector(state => state.daoForm)
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const [useGlobalSettings, setUseGlobalSettings] = useState<boolean[]>([true]);
    const onFinish = (values: any) => {
        dispatch(setDaoFormProps({ att: "stepsForm", value: values }))
        dispatch(setDaoFormProps({ att: "currentStep", value: 3 }))
    };

    return (
        <Form
            form={form}
            name='steps-form'
            initialValues={stepsForm}
            onFinish={onFinish}
            layout='vertical'
            autoComplete="off"
        >
            <Card title="Workflow Steps" headStyle={headStyle} extra={
                <Space>
                    <Button type="primary" size='large' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 1 }))}>Back</Button>
                    <Button type="primary" htmlType='submit' size='large'>Next</Button>
                </Space>

            }>
                <Form.List name={"steps"}>
                    {(stepFields, { add, remove }) => (
                        <Space direction='vertical' style={{ width: "100%" }}>
                            {stepFields.map(({ key, name, ...restField }, index) => (
                                <Card title={`Step (${index + 1})`} key={key} extra={
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                }>

                                    <Form.Item
                                        label={`Title`}
                                        {...restField}
                                        name={[name, 'title']}
                                        rules={[{ required: true, message: 'Missing step title' }]}
                                    >
                                        <Input size='large' placeholder="Step title" />
                                    </Form.Item>


                                    <Form.Item
                                        {...restField}
                                        name={[name, "use_default_settings"]}
                                        label={"Use global voting settings"}
                                        rules={[{ required: true, message: 'Missing voting settings' }]}>
                                        <Radio.Group options={[
                                            { label: "Yes", value: true },
                                            { label: "No", value: false }
                                        ]} onChange={(e) => {let settings = useGlobalSettings; settings[index] = e.target.value; setUseGlobalSettings(settings)}} />
                                    </Form.Item>

                                    {!useGlobalSettings[index] && <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "quorum"]}
                                                label="Quorum"
                                                rules={[{ required: true, message: 'Missing quorum' }]}>
                                                <Input type="number" size='large' />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item {...restField}
                                                name={[name, "threshold"]} 
                                                label="Threshold"
                                                rules={[{ required: true, message: 'Missing threshold' }]}>
                                                <Input type="number" size='large' />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    }

                                    <Form.List name={[name, "step_members"]} initialValue={[]}>
                                        {(memberFields, { add: addMember, remove: removeMember }) => (
                                            <Card title="Step Members" key={`card-step-member-${key}`}>
                                                {memberFields.map(({ key, name, ...restField }, index) => (
                                                    <Row key={key} style={{ display: 'flex', marginBottom: 8 }}>
                                                        <Col span={20}>
                                                            <Form.Item
                                                                label={`Member (${index + 1})`}
                                                                {...restField}
                                                                name={[name, 'address']}
                                                                rules={[{ required: true, message: 'Missing address' }, accountAddressValid]}
                                                            >

                                                                <Input addonBefore={<AiOutlineWallet />} size="large" placeholder="Member address"   />

                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={4}>
                                                            <MinusCircleOutlined onClick={() => removeMember(name)} />
                                                        </Col>


                                                    </Row>
                                                ))}
                                                <Form.Item>
                                                    <Button block type="dashed" onClick={() => addMember()} icon={<PlusOutlined />}>
                                                        Add member
                                                    </Button>
                                                </Form.Item>
                                            </Card>
                                        )}
                                    </Form.List>
                                </Card>
                            ))}
                            <br />
                            <Form.Item>
                                <Button type="dashed" block onClick={() => add()} icon={<PlusOutlined />}>
                                    Add step
                                </Button>
                            </Form.Item>
                        </Space>
                    )}

                </Form.List>
            </Card>
        </Form>

    )
}