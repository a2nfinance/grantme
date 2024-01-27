import { useAppSelector } from "@/controller/hooks";
import { getDAOs } from "@/core/dao_factory";
import { List } from "antd";
import { useEffect } from "react";
import { CardListSkeleton } from "../common/CardListSkeleton";
import { Item } from "./Item";

export const DAOList = () => {
    const { daos, isLoadingDAOs } = useAppSelector(state => state.dao);
    useEffect(() => {
        getDAOs()
    }, [])
    if (isLoadingDAOs) {
        return <CardListSkeleton />
    }
    return (
        <List
            grid={{
                gutter: 12,
                column: 3
            }}
            size="large"
            pagination={
                {
                    pageSize: 9
                }
            }
            loading={isLoadingDAOs}
            dataSource={daos}
            renderItem={(item, index) => (
                <Item index={index} dao={item} />
            )}
        />

    )
}

