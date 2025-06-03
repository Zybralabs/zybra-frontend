"use client";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { load, save } from "redux-localstorage-simple";
// import { isTestEnv } from 'utils/env'

import application from "./application/reducer";
import { updateVersion } from "./global/actions";
import logs from "./logs/slice";
import transactions from "./transactions/reducer";
import user from "./user/reducer";
import wallets from "./wallets/reducer";
import multicall from "@/lib/state/multicall";

const PERSISTED_KEYS: string[] = ["user", "transactions", "lists"];

const store = configureStore({
  reducer: {
    application,
    user,
    transactions,
    wallets,
    multicall: multicall.reducer,
    logs,
  },
  middleware: (getDefaultMiddleware: typeof configureStore.prototype.middleware) =>
    getDefaultMiddleware({ thunk: true }).concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: false }),
});

store.dispatch(updateVersion());

setupListeners(store.dispatch);

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
