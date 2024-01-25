import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';

export type DaoDetail = {
    contract_address?: string,
    owner: string,
    admin: string,
    name: string,
    description: string,
    website: string,
    email: string,
    address: string,
    social_accounts: string[],
    steps: any[],
    num_proposals: number,
    num_whitelisted_contributors: number,
    global_voting_quorum: number,
    global_voting_threshold: number,
    num_normal_members: number,
    num_programs: number,
    open: boolean,
    status: boolean
}

export type Program = {
    programIndex: number,
    title: string,
    description: string,
    startDate: string,
    endDate: string,
}


export type DaoDetailState = {
    detail: DaoDetail,
    members: string[],
    selectedProgram: Program,
    programs: Program[]
}

const initialState: DaoDetailState = {
    detail: {
        owner: "",
        admin: "",
        name: "",
        description: "",
        website: "",
        email: "",
        address: "",
        social_accounts: [],
        steps: [],
        num_proposals: 0,
        num_whitelisted_contributors: 0,
        global_voting_quorum: 0,
        global_voting_threshold: 0,
        num_normal_members: 0,
        num_programs: 0,
        open: false,
        status: true
    },
    members: [],
    selectedProgram: {
        programIndex: 0,
        title: "",
        description: "",
        startDate: moment().toISOString(),
        endDate:  moment().toISOString(),
    },
    programs: []
}

export const daoDetailSlice = createSlice({
    name: 'daoDetail',
    initialState: initialState,
    reducers: {
        setDAODetail: (state: DaoDetailState, action: PayloadAction<DaoDetail>) => {
            state.detail = action.payload;
        },

        setMembers: (state: DaoDetailState, action: PayloadAction<any[]>) => {
            state.members = action.payload
        },
        setProps: (state: DaoDetailState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDAODetail, setMembers, setProps } = daoDetailSlice.actions;
export default daoDetailSlice.reducer;