import {
    createSlice,
    PayloadAction
} from "@reduxjs/toolkit";

export const actionNames = {
    createDAOAction: "createDAOAction",
    fundDAOAction: "fundDAOAction",
    addContributorAction: "addContributorAction",
    removeContributorAction: "removeContributorAction",
}


type Processes = {
    [key: string]: boolean
}

const initialState: Processes = {
    createDAOAction: false,
    fundDAOAction: false,
    addContributorAction: false,
    removeContributorAction: false,
}

export const processesSlice = createSlice({
    name: 'process',
    initialState,
    reducers: {
        updateActionStatus: (state, action: PayloadAction<{ actionName: string, value: boolean }>) => {
            state[action.payload.actionName] = action.payload.value;
        },
    }
})

export const { updateActionStatus } = processesSlice.actions;
export default processesSlice.reducer;