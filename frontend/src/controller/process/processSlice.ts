import {
    createSlice,
    PayloadAction
} from "@reduxjs/toolkit";

export const actionNames = {
    loadDAODetailAction: "loadDAODetailAction",
    createDAOAction: "createDAOAction",
    fundDAOAction: "fundDAOAction",
    addContributorAction: "addContributorAction",
    removeContributorAction: "removeContributorAction",
    createProgramAction: "createProgramAction",
    newProposalAction: "newProposalAction",
    votingAction: "votingAction",
    executeAction: "executeAction"
}


type Processes = {
    [key: string]: boolean
}

const initialState: Processes = {
    loadDAODetailAction: true,
    createDAOAction: false,
    fundDAOAction: false,
    addContributorAction: false,
    removeContributorAction: false,
    createProgramAction: false,
    newProposalAction: false,
    votingAction: false,
    executeAction: false
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