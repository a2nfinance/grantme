import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'

import processReducer from './process/processSlice';
import daoReducer from "./dao/daoSlice";
import daoDetailReducer from "./dao/daoDetailSlice";
import daoFormReducer from "./dao/daoFormSlice";


export function makeStore() {
    return configureStore({
        reducer: {
            dao: daoReducer,
            daoDetail: daoDetailReducer,
            daoForm: daoFormReducer,
            process: processReducer
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    })
}

export const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppState,
    unknown,
    Action<string>
>  