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
        dispatch(setProps({ att: "selectedProject", value: { ...record, index } }))
        setOpenNewProposalModal(true);
    }, [])

    const handleCloseNewProposalModal = () => {
        setOpenNewProposalModal(false);
    }

    const handleOpenTaskList = useCallback((record, index) => {
        dispatch(setProps({ att: "selectedProject", value: { ...record, index } }))
        setOpenTaskListModal(true);
    }, [])

    const handleCloseTaskListModal = () => {
        setOpenTaskListModal(false);
    }

    const handleViewDetail = useCallback((record, index) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: { ...record, index } }))
        setOpenViewDetailModal(true);
    }, [])

    const handleCloseViewDetailModal = () => {
        setOpenViewDetailModal(false);
    }

    const handleAddCodeReviewers = useCallback((record) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: record }))
    }, [])

    const handleAddTaskManagers = useCallback((record) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: record }))
    }, [])

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
                        {/* <Button style={{ width: "100%" }} onClick={() => handleViewDetail(record, index)}>View detail</Button>
                        <Divider />
                        <Button style={{ width: "100%" }} onClick={() => handleNewTask(record, index)}>New task</Button>
                        <Button style={{ width: "100%" }} onClick={() => handleOpenTaskList(record, index)}>View tasks</Button>
                        <Divider />
                        <Button disabled={true} style={{ width: "100%" }}>Add task managers</Button>
                        <Button disabled={true} style={{ width: "100%" }}>Add code reviewers</Button>
                        <Button disabled={true} style={{ width: "100%" }}>Change status</Button>
                        <Button disabled={true} style={{ width: "100%" }}>Update project</Button> */}
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
            <Modal width={500} title={"NEW TASK"} open={openNewProposalModal} onCancel={handleCloseNewProposalModal} footer={null} >
                <NewProposal />

            </Modal>

            <Modal width={"100%"} title={"PROPOSALS"} open={openTaskListModal} onCancel={handleCloseTaskListModal} footer={null} >
                <ViewProposals />

            </Modal>
        </>
    )
}