import { useAppSelector } from "@/controller/hooks";
import { newProposal } from "@/core/dao";
import { accountAddressValid } from "@/helpers/data_validation";
import { Alert, Button, Col, DatePicker, Divider, Form, Input, Radio, Row, Select } from "antd";
import { useCallback, useState } from "react";
import { AiOutlineWallet } from "react-icons/ai";
import { useWallet } from "useink";

const { RangePicker } = DatePicker;
export const NewProposal = () => {
    const [useFiat, setUseFiat] = useState(true);
    const { members, detail } = useAppSelector(state => state.daoDetail);
    const { newProposalAction } = useAppSelector(state => state.process);
    const { account } = useWallet();
    const onFinish = useCallback((values: FormData) => {
        console.log(values);
        // newTask(values, account);
        newProposal(account, values);
    }, [account])

    return (
        <Form name="newtask" initialValues={{
            use_fiat: true,
            allow_early_executed: true

        }} onFinish={onFinish} layout="vertical">
            <Alert type="info" message="Only members can create new proposal" />
            <Divider />
            <Form.Item label="Title" name={"title"} rules={[{ required: true }]}>
                <Input size="large" />
            </Form.Item>
            <Form.Item label="Description" name={"description"} rules={[{ required: true }]}>
                <Input.TextArea size="large" />
            </Form.Item>


            <Form.Item name={"date"} label="Task start date & end date" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                <RangePicker size='large' showTime style={{ width: "100%" }} />
            </Form.Item>
            <Divider />

            <Form.Item name={"use_fiat"} label={"Is the funding amount calculated in fiat or tokens?"}>
                <Radio.Group options={[
                    { label: "Fiat (USD)", value: true },
                    { label: "Token (TZERO)", value: false }
                ]} onChange={(e) => setUseFiat(e.target.value)} />
            </Form.Item>
            {
                useFiat && <Form.Item help={"Grantme uses DIA Oracle to ensure the funding amount is equal USD amount"} label="Fiat amount" name={"payment_amount_fiat"} rules={[{ required: true }]}>
                    <Input size="large" type="number" addonAfter={"USD"} />
                </Form.Item>
            }

            {
                !useFiat && <Form.Item label="Token amount" name={"payment_amount_crypto"} rules={[{ required: true }]}>
                    <Input size="large" type="number" addonAfter={"TZERO"} />
                </Form.Item>
            }

            <Form.Item
                label="Beneficiary"
                name={"to"}
                rules={[{ required: true, message: 'Missing address' }, accountAddressValid]}
            >
                <Input addonBefore={<AiOutlineWallet />} size='large' placeholder="account address" />
            </Form.Item>

            {!detail.allow_revoting && <Form.Item name={"allow_early_executed"} label={"Allow early execute"}>
                <Radio.Group options={[
                    { label: "Yes", value: true },
                    { label: "No", value: false }
                ]} />
            </Form.Item>
            }
            <Divider />
            <Button htmlType="submit" disabled={members.indexOf(account?.address || "") === -1} loading={newProposalAction} block size="large" type="primary">Submit</Button>
        </Form>
    )
}