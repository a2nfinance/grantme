import { useAppSelector } from "@/controller/hooks";
import { convertU64ToLocalTime } from "@/helpers/data_converter";
import { Descriptions } from "antd";

export const ViewDetail = () => {

    const { selectedProgram } = useAppSelector(state => state.daoDetail);
    return (
        <>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label={"Title"}>
                    {selectedProgram.title}
                </Descriptions.Item>
                <Descriptions.Item label={"Description"}>
                    {selectedProgram.description}
                </Descriptions.Item>
            </Descriptions>
            <Descriptions layout="vertical" column={2}>
                <Descriptions.Item label={"Start date"}>
                    {convertU64ToLocalTime(selectedProgram.startDate)}
                </Descriptions.Item>
                <Descriptions.Item label={"End date"}>
                    {convertU64ToLocalTime(selectedProgram.endDate)}
                </Descriptions.Item>
            </Descriptions>

        </>

    )
}