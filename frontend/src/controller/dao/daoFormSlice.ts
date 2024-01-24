import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DAOFormsState = {
    currentStep: number,
    kycForm: {
        name: string,
        email: string,
        description: string,
        website: string,
        address: string,
        twitter: string,
        telegram: string,
        facebook: string,
        discord: string
    },
    votingSettingsForm: {
        quorum: number,
        threshold: number,
        allow_revoting: boolean
    },
    stepsForm: {
        steps: {
            title: string,
            use_default_settings: boolean,
            quorum: number,
            threshold: number
            step_members: {address: string}[]
        }[]
    },
    contributorForm: {contributors: {address: string}[]},
    memberForm: {
        open: boolean,
        members: {address: string}[]
    }
}


const initialState: DAOFormsState = {
    currentStep: 0,
    kycForm: {
        name: "",
        email: "",
        description: "",
        website: "",
        address: "",
        twitter: "",
        telegram: "",
        facebook: "",
        discord: ""
    },
    votingSettingsForm: {
        quorum: 100,
        threshold: 100,
        allow_revoting: false
    },
    stepsForm: {
        steps: [{
            title: "",
            use_default_settings: true,
            quorum: 100,
            threshold: 100,
            step_members: [{address: ""}]
        }]
    },
    contributorForm: {contributors: [{address: ""}]},
    memberForm: {
        open: false,
        members: [{address: ""}]
    }

}

export const daoFormSlice = createSlice({
    name: 'daoForm',
    initialState: initialState,
    reducers: {
        setDaoFormProps: (state: DAOFormsState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDaoFormProps } = daoFormSlice.actions;
export default daoFormSlice.reducer;