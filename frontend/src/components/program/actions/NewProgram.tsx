import { useAppSelector } from "@/controller/hooks"
import { createProgram } from "@/core/dao";
import { Alert, Button, DatePicker, Divider, Form, Input, Modal, Space } from "antd"
import { useCallback, useState } from "react";
import { useWallet } from "useink";

const { RangePicker } = DatePicker;
export const NewProgram = () => {
    const { detail: dao } = useAppSelector(state => state.daoDetail);
    const { account } = useWallet();
    const [openNewProgramModal, setOpenNewProgramModal] = useState(false);
    const { createProgramAction } = useAppSelector(state => state.process);
    const onFinish = useCallback((values: FormData) => {
        createProgram(account, values);
    }, [account?.address])
    return (
        <>
            <Space>
                <Button type="primary" disabled={account?.address !== dao.admin}
                    onClick={() => setOpenNewProgramModal(true)}
                >
                    New Program</Button><span>Only DAO owner can create programs</span>
            </Space>

            <Modal title={"NEW PROGRAM"} width={480} footer={false} open={openNewProgramModal} onCancel={() => setOpenNewProgramModal(false)} >
                <Form
                    name="new-program"
                    initialValues={{

                    }}
                    onFinish={onFinish}
                    layout="vertical">

                    <Alert type="info" message="Only DAO owner can create new program" />
                    <Divider />

                    <Form.Item label="Title" name={"title"} rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item label="Description" name={"description"} rules={[{ required: true, message: "Missing description" }]}>
                        <Input.TextArea size="large" />
                    </Form.Item>


                    <Form.Item name={"date"} label="Start date & end date" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                        <RangePicker size='large' showTime style={{ width: "100%" }} />
                    </Form.Item>

                    <Divider />
                    <Button htmlType="submit" loading={createProgramAction} disabled={account?.address !== dao.admin} style={{ width: "100%" }} size="large" type="primary">Submit</Button>
                </Form>
            </Modal>

        </>
    )
}