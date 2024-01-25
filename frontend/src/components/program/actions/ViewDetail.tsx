import { useAppSelector } from "@/controller/hooks";
import { Descriptions } from "antd";

export const ViewDetail = () => {

    const { selectedProgram } = useAppSelector(state => state.daoDetail);
    return (
        <>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label={"Title"}>
                    {selectedProgram.title}
                </Descriptions.Item>
                <Descriptions.Item label={"Short description"}>
                    {selectedProgram.description}
                </Descriptions.Item>
            </Descriptions>
            <Descriptions layout="vertical" column={2}>
                <Descriptions.Item label={"Start date"}>
                    {new Date(parseInt(selectedProgram.start_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label={"End date"}>
                    {new Date(parseInt(selectedProgram.end_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
            </Descriptions>

        </>

    )
}