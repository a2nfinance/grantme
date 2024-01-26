import { setProps } from "@/controller/dao/daoDetailSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { useAddress } from "@/hooks/useAddress";
import { Button, Divider, Modal, Popover, Space, Table } from "antd";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { NewProposal } from "./actions/NewProposal";
// import { ViewTasks } from "./actions/ViewTasks";
import { NewProgram } from "./actions/NewProgram";
import { ViewDetail } from "./actions/ViewDetail";
import { ViewProposals } from "./actions/ViewProposals";
import { useWallet } from "useink";
import { getPrograms } from "@/core/dao";
import { convertU64ToLocalTime } from "@/helpers/data_converter";

export const ProgramList = () => {
    const { programs } = useAppSelector(state => state.daoDetail);
    const dispatch = useAppDispatch();
    const { account } = useWallet();
    const router = useRouter();
    const { getShortAddress, openLinkToExplorer } = useAddress();

    const [openNewProposalModal, setOpenNewProposalModal] = useState(false);
    const [openTaskListModal, setOpenTaskListModal] = useState(false);
    const [openViewDetailModal, setOpenViewDetailModal] = useState(false);


    const handleNewProposal = useCallback((record, index) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProgram", value: { ...record, index } }))
        setOpenNewProposalModal(true);
    }, [])

    const handleCloseNewProposalModal = () => {
        setOpenNewProposalModal(false);
    }

    const handleOpenProposalList = useCallback((record, index) => {
        dispatch(setProps({ att: "selectedProgram", value: { ...record, index } }))
        setOpenTaskListModal(true);
    }, [])

    const handleCloseTaskListModal = () => {
        setOpenTaskListModal(false);
    }

    const handleViewDetail = useCallback((record, index) => {
        dispatch(setProps({ att: "selectedProgram", value: { ...record, index } }))
        setOpenViewDetailModal(true);
    }, [])

    const handleCloseViewDetailModal = () => {
        setOpenViewDetailModal(false);
    }
    useEffect(() => {
        if (router.query["address"]) {
            getPrograms(router.query["address"].toString())
        }
    }, [router.query["address"]])
    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: "Start date",
            dataIndex: "start_date",
            key: "start_date",
            render: (_, record) => (
                convertU64ToLocalTime(record.startDate)
            )
        },
        {
            title: "End date",
            dataIndex: "end_date",
            key: "end_date",
            render: (_, record) => (
                convertU64ToLocalTime(record.endDate)
            )
        },

        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                <Popover key={`popover-${index}`} content={
                    <Space direction="vertical">
                        <Button block onClick={() => handleViewDetail(record, index)}>View detail</Button>
                        <Divider />
                        <Button block onClick={() => handleNewProposal(record, index)}>New proposal</Button>
                        <Button block onClick={() => handleOpenProposalList(record, index)}>View proposals</Button>
                        <Divider />
                    </Space>
                }>
                    <Button type="primary">actions</Button>
                </Popover>
            )

        },
    ];
    return (
        <>
            <NewProgram />
            <Divider />
            <Table
                pagination={false}
                dataSource={programs}
                columns={columns}
            />
            <Modal width={400} title={"PROGRAM DETAILS"} open={openViewDetailModal} onCancel={handleCloseViewDetailModal} footer={null} >
                <ViewDetail />

            </Modal>
            <Modal width={500} title={"NEW PROPOSAL"} open={openNewProposalModal} onCancel={handleCloseNewProposalModal} footer={null} >
                <NewProposal />

            </Modal>

            <Modal width={920} title={"PROPOSALS"} open={openTaskListModal} onCancel={handleCloseTaskListModal} footer={null} >
                <ViewProposals />

            </Modal>
        </>
    )
}