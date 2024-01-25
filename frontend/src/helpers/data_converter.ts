import { DaoDetail } from "@/controller/dao/daoDetailSlice"

export const convertDaoDetailData = (returnedValue: any[]) : DaoDetail => {
    let daoDetail: DaoDetail = {
        owner: returnedValue[0],
        admin: returnedValue[1],
        name: returnedValue[2],
        description: returnedValue[3],
        website: returnedValue[4],
        email: returnedValue[5],
        address: returnedValue[6],
        social_accounts: returnedValue[7],
        steps: returnedValue[8],
        num_proposals: returnedValue[9],
        num_whitelisted_contributors: returnedValue[10],
        global_voting_quorum: returnedValue[11],
        global_voting_threshold: returnedValue[12],
        num_normal_members: returnedValue[13],
        num_programs: returnedValue[14],
        open: returnedValue[15],
        status: returnedValue[16]

    }
    return daoDetail;
}