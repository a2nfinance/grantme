import { setDaoFormProps } from '@/controller/dao/daoFormSlice';
import { useAppDispatch, useAppSelector } from '@/controller/hooks';
import { headStyle } from '@/theme/layout';
import { Button, Card, Col, Divider, Form, Input, Radio, Row } from 'antd';
import { useRouter } from 'next/router';
import { SiOpenstreetmap } from "react-icons/si";
import { CgWebsite, CgNametag } from "react-icons/cg";
import { MdOutlineMail } from "react-icons/md";
import { KYC } from './Kyc';

export const General = () => {
    const router = useRouter();
    const { kycForm } = useAppSelector(state => state.daoForm)
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const onFinish = (values: any) => {
        dispatch(setDaoFormProps({ att: "kycForm", value: values }))
        dispatch(setDaoFormProps({ att: "currentStep", value: 1 }))
    };
    return (
        <Form
            form={form}
            name='general_form'
            initialValues={kycForm}
            onFinish={onFinish}
            layout='vertical'>
            <Card title="DAO information" headStyle={headStyle} extra={
                <Button type="primary" htmlType='submit' size='large'>Next</Button>
            }>
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Missing DAO name' }]}>
                            <Input addonBefore={<CgNametag />} size='large' />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="email" label="Contact email" rules={[{ required: true, message: 'Incorrect contact email', type: "email" }]}>
                            <Input addonBefore={<MdOutlineMail />} size='large' />
                        </Form.Item>
                    </Col>

                </Row>

                <Form.Item name="website" label="Website" rules={[{ required: true, message: 'Incorrect website URL', type: "url" }]}>
                    <Input addonBefore={<CgWebsite />} size='large' />
                </Form.Item>
                <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Missing address' }]}>
                    <Input addonBefore={<SiOpenstreetmap />} size='large' />
                </Form.Item>
                <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Missing description' }]}>
                    <Input.TextArea size='large' />
                </Form.Item>

            </Card>
            <Divider />
            <KYC />
        </Form>
    )
}
