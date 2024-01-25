import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DaoDetail } from './daoDetailSlice';



type DaoState = {
    isLoadingDAOs: boolean,
    daos: DaoDetail[],

}

const initialState: DaoState = {
    isLoadingDAOs: true,
    daos: []
}

export const daoSlice = createSlice({
    name: 'dao',
    initialState: initialState,
    reducers: {
        setDAOProps: (state: DaoState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDAOProps } = daoSlice.actions;
export default daoSlice.reducer;