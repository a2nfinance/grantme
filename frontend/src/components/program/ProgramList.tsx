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
    const router = useRouter();

    const [openNewProposalModal, setOpenNewProposalModal] = useState(false);
    const [openTaskListModal, setOpenTaskListModal] = useState(false);
    const [openViewDetailModal, setOpenViewDetailModal] = useState(false);


    const handleNewProposal = useCallback((record) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProgram", value: record }))
        setOpenNewProposalModal(true);
    }, [dispatch])

    const handleCloseNewProposalModal = () => {
        setOpenNewProposalModal(false);
    }

    const handleOpenProposalList = useCallback((record) => {
        dispatch(setProps({ att: "selectedProgram", value: record }))
        setOpenTaskListModal(true);
    }, [dispatch])

    const handleCloseTaskListModal = () => {
        setOpenTaskListModal(false);
    }

    const handleViewDetail = useCallback((record) => {
        dispatch(setProps({ att: "selectedProgram", value: record }))
        setOpenViewDetailModal(true);
    }, [dispatch])

    const handleCloseViewDetailModal = () => {
        setOpenViewDetailModal(false);
    }
    useEffect(() => {
        let contractAddress = router.query["address"];
        if (contractAddress) {
            getPrograms(contractAddress.toString())
        }
    }, [router.query])
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
                        <Button block onClick={() => handleViewDetail(record)}>View detail</Button>
                        <Divider />
                        <Button block onClick={() => handleNewProposal(record)}>New proposal</Button>
                        <Button block onClick={() => handleOpenProposalList(record)}>View proposals</Button>
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