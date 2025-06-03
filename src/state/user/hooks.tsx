import { Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { WalletType } from "@/constant/account/enum";
import axios from "axios";
import { addSerializedToken, updateFiatOnrampAcknowledgments, updateUserLocale } from "./reducer";
import type { SerializedToken, SerializedPair } from "./types";
import useCentrifuge from "@/hooks/useCentrifugeRead";
import { DEFAULT_DEADLINE_FROM_NOW } from "@/constant/constant";
import { useAppDispatch, useAppSelector } from "../hooks";
import type { AppState } from "..";
import { useChainId } from "wagmi";
import { useSwarmVaultContract } from "@/hooks/useContract";
import { useSingleContractMultipleData } from "@/lib/hooks/multicall";
import { useLoadAssets } from "../application/hooks";
import { useUserAccount } from "@/context/UserAccountContext";

// Utility functions for token serialization/deserialization
function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  };
}

export interface KYCDetails {
  document_type: string | null;
  document_number: string | null;
  document_image: string | null;
  submitted_at: string | null;
  approved_at: string | null;
}

export interface Wallet {
  _id: string | null;
  address: string | null;
  wallet_type: "web3-wallet" | "abstraction-wallet" | null;
}

export interface User {
  _id: string | null;
  first_name: string | null;
  last_name: string | null;
  user_type: "User" | "Admin" | null;
  email: string | null;
  type: "email" | "social" | null;
  verified: boolean | null;
  profile_status: "complete" | "in-complete" | null;
  kyc_status: "pending" | "approved" | "rejected" | null;
  kyc_details: KYCDetails | null;
  wallets: Wallet[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserState {
  fiatOnrampAcknowledgments: { renderCount: number; system: boolean; user: boolean };
  selectedWallet?: WalletType;
  matchesDarkMode: boolean;
  userDarkMode: boolean | null;
  userLocale: string | null;
  userExpertMode: boolean;
  userClientSideRouter: boolean;
  userHideClosedPositions: boolean;
  userSlippageTolerance: number | "auto";
  userSlippageToleranceHasBeenMigratedToAuto: boolean;
  userDeadline: number;
  tokens: Record<number, Record<string, SerializedToken>>;
  userProfile: User | null;
  kycDetails: KYCDetails | null;
  wallets: Wallet | null;
  totalInvestment: number | null;
  holdings: any[];
  transactions: any[];
  centrifugeInvestments: any[];
  loading: boolean;
  error: string | null;
  timestamp: number;
}

// Initial state

function deserializeToken(serializedToken: SerializedToken, Class: typeof Token = Token): Token {
  return new Class(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name,
  );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_ZYBRA_BASE_API_URL || "";
const apiClient = (token: string | null) =>
  axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });

// Thunks
export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (_, { getState }) => {
    const state = getState() as { user: UserState };
    const response = await apiClient(state.user.userProfile?.email || null).get("/user/profile");
    return response.data;
  },
);

export const fetchTransactions = createAsyncThunk(
  "user/fetchTransactions",
  async (_, { getState }) => {
    const state = getState() as { user: UserState };
    const response = await apiClient(state.user.userProfile?.email || null).get(
      "/user/transactions",
    );
    return response.data;
  },
);

export const fetchHoldings = createAsyncThunk("user/fetchHoldings", async ( ) => {
  const { user} = useUserAccount();
  const response = await apiClient(user.userId).get("/user/investment");


  return response.data;
});

export const fetchTotalInvestment = createAsyncThunk(
  "user/fetchTotalInvestment",
  async (_, { getState }) => {
    const state = getState() as { user: UserState };
    const response = await apiClient(state.user.userProfile?.email || null).get(
      "/investments/total",
    );
    return response.data;
  },
);
/** Manages dark mode state */

/** Manages user locale */
export function useUserLocale(): string | null {
  return useAppSelector((state) => state.user.userLocale);
}

export function useUserLocaleManager(): [string | null, (newLocale: string) => void] {
  const dispatch = useAppDispatch();
  const locale = useUserLocale();

  const setLocale = useCallback(
    (newLocale: string) => {
      dispatch(updateUserLocale({ userLocale: newLocale }));
    },
    [dispatch],
  );

  return [locale, setLocale];
}

/** Manages fiat onramp acknowledgements */
export function useFiatOnrampAck(): [
  { renderCount: number; system: boolean; user: boolean },
  (acks: Partial<{ renderCount: number; system: boolean; user: boolean }>) => void,
] {
  const dispatch = useAppDispatch();
  const fiatOnrampAcknowledgments = useAppSelector((state) => state.user.fiatOnrampAcknowledgments);

  const setAcknowledgements = useCallback(
    (acks: Partial<{ renderCount: number; system: boolean; user: boolean }>) => {
      dispatch(updateFiatOnrampAcknowledgments(acks));
    },
    [dispatch],
  );

  return [fiatOnrampAcknowledgments, setAcknowledgements];
}

/** Manages user-added tokens */
export function useAddUserToken(): (token: Token) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }));
    },
    [dispatch],
  );
}
export const fetchCentrifugeInvestmentState = createAsyncThunk(
  "user/fetchCentrifugeInvestmentState",
  async (walletAddress: string, { getState, rejectWithValue }) => {
    const state = getState() as AppState; // AppState provides the full Redux state shape

    const vaults = state.application.vaultData; // Fetch vaults from the wallets state

    if (!walletAddress) {
      return rejectWithValue("No wallet address provided.");
    }

    if (!Array.isArray(vaults) || vaults.length === 0) {
      return rejectWithValue("No vault data available in wallets state.");
    }

    try {
      const { fetchInvestmentState } = useCentrifuge();

      // Iterate over all vaults and fetch investment state for each
      const investments = await Promise.all(
        vaults.map(async (vault: any) => {
          return await fetchInvestmentState(vault, walletAddress);
        }),
      );

      return investments;
    } catch (error: unknown) {
      console.error("Error fetching centrifuge investment state:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch centrifuge investments.",
      );
    }
  },
);
//@ts-ignore

/** Integrates Centrifuge for pool and vault management */
