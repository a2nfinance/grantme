import { List } from "antd";
import { useEffect } from "react";
import { useAppSelector } from "@/controller/hooks";
import { getDAOs } from "@/core/dao_factory";
import { Item } from "./Item";

export const RecentDAOList = () => {
    const {daos, isLoadingDAOs} = useAppSelector(state => state.dao)
    useEffect(() => {
        getDAOs()
    }, [])
    return (
        <List
            grid={{
                gutter: 12,
                column: 3
            }}
            size="large"
            loading={isLoadingDAOs}
            pagination={false}
            dataSource={daos.slice(0,3)}
            renderItem={(item, index) => (
                <Item index={index} dao={item} />
            )}
        />

    )
}

