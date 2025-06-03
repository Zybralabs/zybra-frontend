import type { PoolCardProps } from "@/components/MainPane/MainPane";
import type { SupportedChainId } from "@/constant/addresses";
import { DEFAULT_TXN_DISMISS_MS } from "@/constant/constant";
import type { Vault } from "@centrifuge/sdk";
import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type PopupContent =
  | {
      txn: {
        hash: string;
      };
    }
  | {
      failedSwitchNetwork: SupportedChainId;
    };

export enum ApplicationModal {
  ADDRESS_CLAIM,
  BLOCKED_ACCOUNT,
  CLAIM_POPUP,
  DELEGATE,
  EXECUTE,
  FEATURE_FLAGS,
  FIAT_ONRAMP,
  MENU,
  METAMASK_CONNECTION_ERROR,
  NETWORK_FILTER,
  NETWORK_SELECTOR,
  POOL_OVERVIEW_OPTIONS,
  PRIVACY_POLICY,
  QUEUE,
  SELF_CLAIM,
  SETTINGS,
  SHARE,
  TIME_SELECTOR,
  WALLET,
  WALLET_DROPDOWN,
}

type PopupList = Array<{
  key: string;
  show: boolean;
  content: PopupContent;
  removeAfterMs: number | null;
}>;

interface StakingInfo {
  token: any;
  stakedAmount: string;
  earnedAmount: string;
  totalStakedAmount: string;
  totalRewardRate: string;
  active: boolean;
}

export interface ApplicationState {
  readonly chainId: number | null;
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean };
  readonly openModal: ApplicationModal | null;
  readonly popupList: PopupList;
  readonly poolDetails: any[]; // Store fetched pool details
  readonly vaultData: Record<string, Vault>; // Store vault data mapped by poolId or vaultId
  readonly reports: {
    balanceSheet: Record<string, any>;
    profitAndLoss: Record<string, any>;
    cashflow: Record<string, any>;
    trancheSnapshots: Record<string, any>;
  };
  readonly loading: boolean;
  readonly error: string | null;
  readonly swarmOffers: any[]; // Store fetched swarmOffers
  readonly swarmAssets: any[]; // Store fetched swarmAssets
  readonly swarmTransactions: any[]; // Store fetched swarmTransactions
  readonly stakingInfo: StakingInfo | null;
  readonly assets: any[];
  readonly vaultInvestmentStates: Record<string,Vault['investment'] | null>; 
  allPools: PoolCardProps[];
  filteredPools: PoolCardProps[];
}

const initialState: ApplicationState = {
  fiatOnramp: { available: false, availabilityChecked: false },
  chainId: null,
  openModal: null,
  popupList: [],
  poolDetails: [], // Existing pool details state
  vaultData: {},
  vaultInvestmentStates: {},
 // Existing vault data state
  assets: [],
  reports: {
    balanceSheet: {},
    profitAndLoss: {},
    cashflow: {},
    trancheSnapshots: {},
  },
  loading: false,
  error: null,
  swarmOffers: [], // Initial empty array for fetched swarmOffers
  swarmAssets: [], // Initial empty array for fetched swarmAssets
  swarmTransactions: [], // Initial empty array for fetched swarmTransactions
  stakingInfo: {
    token: null,
    stakedAmount: "0",
    earnedAmount: "0",
    totalStakedAmount: "0",
    totalRewardRate: "0",
    active: false,
  },
  allPools: [],
  filteredPools: [],
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    setFiatOnrampAvailability(state, { payload: available }) {
      state.fiatOnramp = { available, availabilityChecked: true };
    },
    updateChainId(state, action: PayloadAction<{ chainId: number }>) {
      const { chainId } = action.payload;
      state.chainId = chainId;
    },
    setOpenModal(state, action: PayloadAction<ApplicationModal | null>) {
      state.openModal = action.payload;
    },
    addPopup(
      state,
      {
        payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS },
      }: PayloadAction<{ content: PopupContent; key?: string; removeAfterMs?: number }>,
    ) {
      state.popupList = (
        key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList
      ).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ]);
    },
    removePopup(state, { payload: { key } }: PayloadAction<{ key: string }>) {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false;
        }
      });
    },
    setPoolDetails(state, action: PayloadAction<any[]>) {
      state.poolDetails = action.payload;
    },
    setVaultData(state, action: PayloadAction<{ poolId: string; vault: any }>) {
      const { poolId, vault } = action.payload;
      state.vaultData[poolId] = vault;
    },
    setVaultInvestmentState(
      state,
      action: PayloadAction<{ investorAddress: string; investmentState: any }>
    ) {
      const { investorAddress, investmentState } = action.payload;
      state.vaultInvestmentStates[investorAddress] = investmentState;
    },

    setBalanceSheetReports(state, action: PayloadAction<{ poolId: string; report: any }>) {
      const { poolId, report } = action.payload;
      state.reports.balanceSheet[poolId] = report;
    },
    setProfitAndLossReports(state, action: PayloadAction<{ poolId: string; report: any }>) {
      const { poolId, report } = action.payload;
      state.reports.profitAndLoss[poolId] = report;
    },
    setCashflowReports(state, action: PayloadAction<{ poolId: string; report: any }>) {
      const { poolId, report } = action.payload;
      state.reports.cashflow[poolId] = report;
    },
    setTrancheSnapshotsReports(state, action: PayloadAction<{ poolId: string; report: any }>) {
      const { poolId, report } = action.payload;
      state.reports.trancheSnapshots[poolId] = report;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setOffers(state, action: PayloadAction<any[]>) {
      state.poolDetails = action.payload;
    },
    setAssets(state, action: PayloadAction<any[]>) {
      state.swarmAssets = action.payload;
    },
    setTransactions(state, action: PayloadAction<any[]>) {
      state.swarmTransactions = action.payload;
    },
    setStakingInfo(state, action: PayloadAction<StakingInfo | null>) {
      state.stakingInfo = action.payload;
      state.loading = false;
      state.error = null;
    },
    savePools(state, action: PayloadAction<{
      allPools: PoolCardProps[],
      filteredPools: PoolCardProps[]
    }>) {
      state.allPools = action.payload.allPools;
      state.filteredPools = action.payload.filteredPools;
    },
    updateFilteredPools(state, action: PayloadAction<PoolCardProps[]>) {
      state.filteredPools = action.payload;
    }

  },
});

export const {
  updateChainId,
  setFiatOnrampAvailability,
  setOpenModal,
  addPopup,
  removePopup,
  setPoolDetails,
  setVaultData,
  setVaultInvestmentState,
  setBalanceSheetReports,
  setProfitAndLossReports,
  setCashflowReports,
  setTrancheSnapshotsReports,
  setAssets,
  setOffers,
  savePools,
  setTransactions,
  setLoading,
  setError,
  setStakingInfo,
} = applicationSlice.actions;

export default applicationSlice.reducer;
