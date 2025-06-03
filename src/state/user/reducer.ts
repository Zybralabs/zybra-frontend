import { createSlice } from "@reduxjs/toolkit";

import {
  fetchCentrifugeInvestmentState,
  fetchHoldings,
  fetchTotalInvestment,
  fetchUserProfile,
  type UserState,
} from "./hooks";
import { DEFAULT_DEADLINE_FROM_NOW } from "@/constant/constant";

const currentTimestamp = () => new Date().getTime();

// Define types

const initialState: UserState = {
  fiatOnrampAcknowledgments: { renderCount: 0, system: false, user: false },
  selectedWallet: undefined,
  matchesDarkMode: false,
  userDarkMode: null,
  userLocale: null,
  userExpertMode: false,
  userClientSideRouter: false,
  userHideClosedPositions: false,
  userSlippageTolerance: "auto",
  userSlippageToleranceHasBeenMigratedToAuto: true,
  userDeadline: DEFAULT_DEADLINE_FROM_NOW,
  tokens: {},
  userProfile: null,
  kycDetails: null,
  wallets: null,
  totalInvestment: null,
  holdings: [],
  transactions: [],
  loading: false,
  error: null,
  centrifugeInvestments: [],
  timestamp: currentTimestamp(),
};
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateFiatOnrampAcknowledgments(
      state,
      { payload }: { payload: Partial<{ renderCount: number; user: boolean; system: boolean }> },
    ) {
      state.fiatOnrampAcknowledgments = { ...state.fiatOnrampAcknowledgments, ...payload };
    },
    updateUserDarkMode(state, action) {
      state.userDarkMode = action.payload.userDarkMode;
      state.timestamp = currentTimestamp();
    },
    updateMatchesDarkMode(state, action) {
      state.matchesDarkMode = action.payload.matchesDarkMode;
      state.timestamp = currentTimestamp();
    },
    updateUserExpertMode(state, action) {
      state.userExpertMode = action.payload.userExpertMode;
      state.timestamp = currentTimestamp();
    },
    updateUserLocale(state, action) {
      state.userLocale = action.payload.userLocale;
      state.timestamp = currentTimestamp();
    },
    updateUserSlippageTolerance(state, action) {
      state.userSlippageTolerance = action.payload.userSlippageTolerance;
      state.timestamp = currentTimestamp();
    },
    updateUserDeadline(state, action) {
      state.userDeadline = action.payload.userDeadline;
      state.timestamp = currentTimestamp();
    },
    updateUserClientSideRouter(state, action) {
      state.userClientSideRouter = action.payload.userClientSideRouter;
    },
    updateHideClosedPositions(state, action) {
      state.userHideClosedPositions = action.payload.userHideClosedPositions;
    },
    addSerializedToken(state, { payload: { serializedToken } }) {
      if (!state.tokens) {
        state.tokens = {};
      }
      state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {};
      state.timestamp = currentTimestamp();
    },

    logout(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userProfile = action.payload;
        state.loading = false;
        state.timestamp = currentTimestamp();
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch centrifuge investments.";
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.holdings = action.payload.assets;
        state.totalInvestment = action.payload.totalInvestment;
        state.loading = false;
        state.timestamp = currentTimestamp();
      })
      .addCase(fetchHoldings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch centrifuge investments.";
      })
      .addCase(fetchTotalInvestment.fulfilled, (state, action) => {
        state.totalInvestment = action.payload;
        state.loading = false;
        state.timestamp = currentTimestamp();
      })
      .addCase(fetchTotalInvestment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalInvestment.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch centrifuge investments.";
      })
      .addCase(fetchCentrifugeInvestmentState.fulfilled, (state, action) => {
        state.centrifugeInvestments = action.payload;
        state.loading = false;
        state.timestamp = currentTimestamp();
      })
      .addCase(fetchCentrifugeInvestmentState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCentrifugeInvestmentState.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch centrifuge investments.";
      })
      .addMatcher(
        (action) => action.type.startsWith("user/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("user/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action?.error?.message || "An error occurred";
          state.loading = false;
        },
      );
  },
});

export const {
  addSerializedToken,
  updateFiatOnrampAcknowledgments,
  updateHideClosedPositions,
  updateMatchesDarkMode,
  updateUserClientSideRouter,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserLocale,
  updateUserSlippageTolerance,
} = userSlice.actions;
export default userSlice.reducer;
