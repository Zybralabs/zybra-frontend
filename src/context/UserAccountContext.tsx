import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { firstValueFrom } from "rxjs";
import axios from "axios";
import { WalletType } from "@/constant/account/enum";
import { AlchemySignerStatus } from "@account-kit/signer";

import {
  useUser,
  useAccount,
  useConnect,
  useAuthenticate,
  useLogout,
  useSmartAccountClient,
  useSignerStatus
} from "@account-kit/react";
import { accountType } from "@/config";
import { useChainId, useDisconnect, useAccount as useWagmiAccount } from "wagmi";
import type { TransactionData } from "@/types";
import { useWeb3React } from "@web3-react/core";
import { useEthersProvider } from "@/hooks/useContract";
import { wagmiConfig } from "@/wagmi";
import type { JsonRpcProvider } from "ethers";
import { CurrencyAmount, Token, type Currency } from "@uniswap/sdk-core";
import { useTokenBalance, useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { SupportedChainId, ZFI } from "@/constant/addresses";
import { ZFI_TOKEN_TESTNET } from "@/state/stake/hooks";
import { fromWei } from "@/hooks/formatting";
import { ZERO_ADDRESS } from "@/constant/constant";
import type { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import type { TradingPair } from "@/components/MainOffer/types/trading";

export interface Wallet {
  _id: string | null;
  address: string | null;
  wallet_type: "web3-wallet" | "abstraction-wallet" | null;
}

// Define KYCDetails type
export interface KYCDetails {
  document_type: string | null;
  document_number: string | null;
  document_image: string | null;
  submitted_at: string | null;
  approved_at: string | null;
}

// Define User type
export interface User {
  _id: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
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
  profile_details?: any;
}



type InvestmentDetail = {
  symbol: string;
  type: string;
  amount: number;
};

type TotalInvested = Record<string, InvestmentDetail>;

type AlertModalData = {
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  title: string;
  message: string;
  // For transaction modals
  txHash?: string;
  // For error modals
  errorCode?: string;
  // For loading modals
  loadingText?: string;
  chainId?: number;
};

export interface UserPointsProfile {
  points_by_category: any;
  user: string;
  total_points: number;
  lifetime_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tier_progress: number;
  points_history: PointsActivity[];
  seasonal_multiplier: number;
  seasonal_rank: number;
  rank: number;
  can_claim_daily_login: boolean;
  next_daily_login_available: string;
}

// Points Activity Record
export interface PointsActivity {
  activity_type: string;
  points: number;
  metadata: Record<string, any>;
  created_at: string;
  expires_at: string | null;
}

// Quest Step
export interface QuestStep {
  step_id: string;
  type: 'deposit' | 'mint_zrusd' | 'lend_zrusd' | 'borrow_zrusd' | 'trade_zrusd' | 'hold_zrusd' | 'other';
  description: string;
  required_amount: number;
  required_duration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
  reward: {
    points: number;
    badge: string | null;
    zrusd_amount: number;
    other_rewards: Record<string, any>;
  };
}

// Quest
export interface Quest {
  quest_id: string;
  title: string;
  description: string;
  steps: QuestStep[];
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
  reward: {
    points: number;
    badge: string | null;
    zrusd_amount: number;
    other_rewards: Record<string, any>;
  };
  expires_at: string | null;
  user_progress?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
    steps_progress: Array<{
      step_id: string;
      status: 'not_started' | 'in_progress' | 'completed';
      progress: number;
      progress_percent: number;
      completed_at: string | null;
    }>;
    started_at: string | null;
    completed_at: string | null;
    rewards_claimed: boolean;
    rewards_claimed_at: string | null;
  };
}

// Leaderboard Entry
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  wallet_address: string;
  name: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

// Quest Leaderboard Entry
export interface QuestLeaderboardEntry {
  user_id: string;
  username: string;
  name: string;
  completed_quests: number;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

// Redemption Option
export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  tier_requirement: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  available: boolean;
  affordable: boolean;
  duration_days?: number;
  reward_amount?: number;
}

export interface Badges {
  badges: Record<string, {
    title: string;
    description: string;
    category: string;
    points: number;
  }>;
}

interface UserAccountContextProps {
  address: string | undefined;
  provider: JsonRpcProvider | undefined | null;
  walletType: WalletType | null;
  totalInvested: TotalInvested | null;
  zrusdBorrowed: number | null;
  baseSepoliaOffers: TradingPair[] | null;
  token: string | null;
  zfi_balance: number | null | undefined;
  user: any;
  balanceLoading: boolean;
  loading: boolean;
  error: string | null | Error;
  isWalletInitialized: boolean;
  alertModalData: AlertModalData | null;
  alertModalCloseHandler: () => void;
  alertModalOpenHandler: (data: AlertModalData) => void;
  exportAccount: () => Promise<{ success: boolean; message?: string; error?: string }>;
  isExportingAccount: boolean;
  ExportAccountComponent: any; // Using any for the component type
  refreshToken: () => Promise<boolean>; // Add refreshToken function to the context
  // API actions
  updateUserProfile: (data: {
    first_name?: string;
    last_name?: string;
    profile_details?: object;
  }) => Promise<any>;
  submitKYC: () => Promise<any>;
  getKYCStatus: () => Promise<any>;
  addWallet: (walletAddress: string) => Promise<any>;
  getWallets: () => Promise<any>;
  createAbstractWallet: () => Promise<any>;
  executeTransaction: (data: {
    dest: string;
    calldata: string;
    asset: string;
    amount: number;
  }) => Promise<any>;
  addTransaction: (data: TransactionData) => Promise<any>;
  getTransactions: () => Promise<any>;
  addOffer: (data: TradingPair) => Promise<any>;
  updateOffer: (updateData: {
    id: string;
    sellAmount?: number;
    buyAmount?: number;
    status?: StatusEnum;
  }) => Promise<any>;
  cancelOffer: (offerId: string) => Promise<any>;
  getBaseSepoliaOffers: () => Promise<any>;
  getBaseSepoliaOffer: (id: string) => Promise<any>;
  walletSignIn: (type: "wallet" | "auth", address: string) => Promise<void>;
  signIn: (
    type: "email" | "oauth",
    payload: { email?: string; authProviderId?: "google" | "apple" },
  ) => Promise<void>;
  logout: () => Promise<{ success: boolean; error?: unknown }>;
  verifyCode: (email: string, code: number) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<void>;
  getUserAssetsAndPoolsHoldings: () => Promise<{
    assets: Array<{
      assetId: string;
      name: string;
      symbol: string;
      totalAmount: number;
      totalZRUSDBorrowed: number;
      createdAt?: string;
      updatedAt?: string;
    }>;
    pools: Array<{
      poolId: string;
      name: string;
      totalAmount: number;
      totalZRUSDBorrowed: number;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }>;
  getTotalInvestment: () => Promise<any>;
  getTotalAssetInvestment: () => Promise<any>;
  getPools: () => Promise<void>;
  getStocks: () => Promise<void>;
  getUserPointsProfile: () => Promise<{ payload: UserPointsProfile }>;
  getUserPointsHistory: (page?: number, limit?: number, activity_type?: string) => Promise<{
    payload: {
      history: PointsActivity[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }>;
  getPointsLeaderboard: (page?: number, limit?: number) => Promise<{
    payload: {
      leaderboard: LeaderboardEntry[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
      user_stats: {
        rank: number;
        points: number;
        tier: string;
      } | null;
    };
  }>;
  checkUserEndorsement: (userAddress: string) => Promise<{
    success: boolean;
    payload: {
      address: string;
      is_endorsed: boolean;
      checked_at?: string;
    };
  }>;
  endorseUser: (userAddress: string) => Promise<{
    success: boolean;
    message?: string;
    payload?: {
      address: string;
      endorsed: boolean;
      transaction_hash?: string;
      block_number?: number;
      timestamp?: string;
      gas_used?: string;
      status?: string;
    };
  }>;
  claimDailyLoginPoints: () => Promise<{
    payload: {
      points_awarded: number;
      next_available: string;
    };
  }>;
  getRedemptionOptions: () => Promise<{
    payload: {
      options: RedemptionOption[];
      user_points: number;
      user_tier: string;
    };
  }>;
  redeemPointsForReward: (reward_id: string, points_cost: number) => Promise<{
    payload: {
      reward_id: string;
      points_cost: number;
      remaining_points: number;
    };
  }>;
  updatePointsFromFrontend: (points: number, metadata?: Record<string, any>) => Promise<{
    payload: {
      points_added: number;
      new_total: number;
      activity_type: string;
    };
  }>;
  getAvailableQuests: () => Promise<{ payload: Quest[] }>;
  getUserQuests: (status?: "not_started" | "in_progress" | "completed" | "claimed") => Promise<{ payload: Quest[] }>;
  startQuest: (quest_id: string) => Promise<{
    payload: {
      quest_id: string;
      status: string;
      started_at: string;
      steps_progress: Array<{
        step_id: string;
        status: string;
        progress: number;
        progress_percent: number;
      }>;
    };
  }>;
  claimQuestRewards: (quest_id: string) => Promise<{
    payload: {
      quest_id: string;
      claimed_at: string;
      rewards: {
        points: number;
        badge: string | null;
        zrusd_amount: number;
        other_rewards: Record<string, any>;
      };
    };
  }>;
  getQuestLeaderboard: (page?: number, limit?: number) => Promise<{
    payload: {
      leaderboard: QuestLeaderboardEntry[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
      user_stats: {
        rank: number | null;
        completed_quests: number | null;
      } | null;
    };
  }>;
  trackProfileCompletion: (has_wallet: boolean, has_email_optin: boolean) => Promise<any>;
  trackWalletConnection: (wallet_address: string, has_testnet_assets?: boolean) => Promise<any>;
  storeEmailOptin: (email: string, quest_id: string) => Promise<any>;
  verifySocialShare: (platform: string, post_url: string, action_type: string) => Promise<any>;
  trackReferral: (referral_code: string, referred_user_id: string, action_completed?: boolean) => Promise<any>;
  trackFeatureUsage: (feature_name: string) => Promise<any>;
  trackAMAParticipation: (ama_id: string, asked_question?: boolean) => Promise<any>;
  trackLoginStreak: () => Promise<{
    payload: {
      current_streak: number;
      max_streak: number;
      streak_badges: string[];
    };
  }>;
  trackReferralCount: () => Promise<{
    payload: {
      referral_count: number;
      dazzle_up_eligible: boolean;
    };
  }>;
  trackMultiPoolActivity: () => Promise<{
    payload: {
      staking_pools: number;
      lending_protocols: number;
      super_staker_eligible: boolean;
    };
  }>;
  trackCompletedQuests: () => Promise<{
    payload: {
      total_quests: number;
      completed_quests: number;
      remaining_quests: number;
      is_completionist: boolean;
    };
  }>;
  trackEarnedBadges: () => Promise<{
    payload: {
      earned_badges: string[];
      total_badges: number;
      remaining_badges: string[];
      is_zy_og: boolean;
    };
  }>;
  getUserBadges: () => Promise<{
    payload: {
      earned_badges: string[];
      badge_progress: {
        [badge_name: string]: {
          progress: number;
          required: number;
          eligible: boolean;
        };
      };
    };
  }>;
  getBadges: () => Promise<{ payload: Badges }>;
  generateReferralCode: () => Promise<{
    success: { referral_code: string; referral_link: string; };
    payload: {
      referral_code: string;
      referral_link: string;
    };
  }>;

  applyReferralCode: (referral_code: string) => Promise<{
    success: any;
    payload: {
      referrer_name: string;
    };
  }>;

  completeReferral: () => Promise<{
    payload: {
      points_awarded: number;
      referrer_rewarded: number;
    };
  }>;

  getReferralStats: () => Promise<{
    success: {
      referral_code: string; referral_link: string; stats: {
        successful_referrals: number;
        pending_referrals: number;
        total_points_earned: number;
      }; referred_users: Array<{
        user_id: string;
        name: string;
        username: string;
        joined_date: string;
        status: "completed" | "pending";
        completed_at: string | null;
      }>;
    };
    payload: {
      referral_code: string;
      referral_link: string;
      stats: {
        successful_referrals: number;
        pending_referrals: number;
        total_points_earned: number;
      };
      referred_users: Array<{
        user_id: string;
        name: string;
        username: string;
        joined_date: string;
        status: 'completed' | 'pending';
        completed_at: string | null;
      }>;
    };
  }>;

  validateReferralCode: (code: string) => Promise<{
    success: boolean;
    payload: {
      valid: boolean;
      referrer_name: string;
    };
  }>;
  updateUserProfileInfo: (data: {
    username?: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<{
    payload: {
      user: {
        _id: string;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_status: string;
      }
    }
  }>;

  // TVL API methods
  getTVLMetrics: () => Promise<any>;
  getSimpleTVLMetrics: () => Promise<any>;
  getTVLBreakdown: (period?: '7d' | '30d' | '90d' | '1y' | 'all') => Promise<any>;
  getSimpleTVLBreakdown: (period?: '7d' | '30d' | '90d' | '1y' | 'all') => Promise<any>;
}



const UserAccountContext = createContext<UserAccountContextProps>({
  address: "",
  walletType: null,
  provider: undefined,
  token: null,
  totalInvested: null,
  zrusdBorrowed: null,
  baseSepoliaOffers: null,
  balanceLoading: true,

  zfi_balance: 0,
  user: null,
  loading: false,
  error: null,
  alertModalData: null,
  alertModalCloseHandler: () => {
    throw new Error("UserAccountContext not initialized");
  },
  alertModalOpenHandler: () => {
    throw new Error("UserAccountContext not initialized");
  },
  refreshToken: async () => {
    throw new Error("UserAccountContext not initialized");
  },

  updateUserProfile: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  submitKYC: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getKYCStatus: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  addWallet: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getWallets: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  createAbstractWallet: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  isWalletInitialized: false,
  exportAccount: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  isExportingAccount: false,
  ExportAccountComponent: null,
  executeTransaction: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  addTransaction: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getTransactions: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  addOffer: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  updateOffer: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  cancelOffer: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getBaseSepoliaOffers: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getBaseSepoliaOffer: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  walletSignIn: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  signIn: async () => {
    throw new Error("UserAccountContext not initialized");
  },

  logout: () => Promise.resolve({ success: false, error: new Error("UserAccountContext not initialized") }),
  verifyCode: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  sendVerificationEmail: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getUserAssetsAndPoolsHoldings: async () => {
    throw new Error("UserAccountContext not initialized");
  },

  getTotalInvestment: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getTotalAssetInvestment: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getStocks: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getPools: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getUserPointsProfile: function (): Promise<{ payload: UserPointsProfile; }> {
    throw new Error("Function not implemented.");
  },
  getBadges: function (): Promise<{ payload: Badges; }> {
    throw new Error("Function not implemented.");
  },
  getUserPointsHistory: function (page?: number, limit?: number, activity_type?: string): Promise<{
    payload: {
      history: PointsActivity[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  getPointsLeaderboard: function (page?: number, limit?: number): Promise<{
    payload: {
      leaderboard: LeaderboardEntry[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
      user_stats: {
        rank: number;
        points: number;
        tier: string;
      } | null;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  claimDailyLoginPoints: function (): Promise<{
    payload: {
      points_awarded: number;
      next_available: string;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  getRedemptionOptions: function (): Promise<{
    payload: {
      options: RedemptionOption[];
      user_points: number;
      user_tier: string;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  redeemPointsForReward: function (reward_id: string, points_cost: number): Promise<{
    payload: {
      reward_id: string;
      points_cost: number;
      remaining_points: number;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  updatePointsFromFrontend: function (points: number, metadata?: Record<string, any>): Promise<{
    payload: {
      points_added: number;
      new_total: number;
      activity_type: string;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  getAvailableQuests: function (): Promise<{ payload: Quest[]; }> {
    throw new Error("Function not implemented.");
  },
  getUserQuests: function (status?: "not_started" | "in_progress" | "completed" | "claimed"): Promise<{ payload: Quest[]; }> {
    throw new Error("Function not implemented.");
  },
  startQuest: function (quest_id: string): Promise<{
    payload: {
      quest_id: string;
      status: string;
      started_at: string;
      steps_progress: Array<{
        step_id: string;
        status: string;
        progress: number;
        progress_percent: number;
      }>;
    };
  }> {
    throw new Error("Function not implemented.");
  },
  claimQuestRewards: function (quest_id: string): Promise<{
    payload: {
      quest_id: string;
      claimed_at: string;
      rewards: {
        points: number;
        badge: string | null;
        zrusd_amount: number;
        other_rewards: Record<string, any>;
      };
    };
  }> {
    throw new Error("Function not implemented.");
  },
  getQuestLeaderboard: function (page?: number, limit?: number): Promise<{
    payload: {
      leaderboard: QuestLeaderboardEntry[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
      user_stats: {
        rank: number | null;
        completed_quests: number | null;
      } | null;
    };

  }> {
    throw new Error("Function not implemented.");
  },
  trackProfileCompletion: function (has_wallet: boolean, has_email_optin: boolean): Promise<any> {
    throw new Error("Function not implemented.");
  },
  trackWalletConnection: function (wallet_address: string, has_testnet_assets?: boolean): Promise<any> {
    throw new Error("Function not implemented.");
  },
  storeEmailOptin: function (email: string, quest_id: string): Promise<any> {
    throw new Error("Function not implemented.");
  },
  verifySocialShare: function (platform: string, post_url: string, action_type: string): Promise<any> {
    throw new Error("Function not implemented.");
  },
  trackReferral: function (referral_code: string, referred_user_id: string, action_completed?: boolean): Promise<any> {
    throw new Error("Function not implemented.");
  },
  trackFeatureUsage: function (feature_name: string): Promise<any> {
    throw new Error("Function not implemented.");
  },
  trackAMAParticipation: function (ama_id: string, asked_question?: boolean): Promise<any> {
    throw new Error("Function not implemented.");
  },
  trackLoginStreak: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  trackReferralCount: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  trackMultiPoolActivity: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  trackCompletedQuests: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  trackEarnedBadges: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getUserBadges: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getReferralStats: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  generateReferralCode: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  applyReferralCode: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  completeReferral: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  validateReferralCode: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  updateUserProfileInfo(data) {
    throw new Error("Function not implemented.");
  },
  getTVLMetrics: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getSimpleTVLMetrics: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getTVLBreakdown: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getSimpleTVLBreakdown: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  checkUserEndorsement: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  endorseUser: async () => {
    throw new Error("UserAccountContext not initialized");
  }
});

export const useUserAccount = () => useContext(UserAccountContext);

const initialAlertModalData = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  title: "",
  message: "",
};

export const UserAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isLoadingAccount, account } = useAccount({ type: "LightAccount" });
  const { authenticate, authenticateAsync, error: loginError, isPending } = useAuthenticate();
  const AlChemyprovider = undefined;
  const Web3provider = useEthersProvider();
  const wagmi_account = useWagmiAccount({
    config: wagmiConfig,
  });
  const { logout: logOut } = useLogout();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const user = useUser();
  const signerStatus = useSignerStatus();
  const smartAccountClient = useSmartAccountClient({ type: accountType });
  // We're now using the useExportAccount hook directly in the ExportAccountModal component
  const [walletType, setWalletType] = useState<WalletType | null>(() => {
    // Initialize wallet type from localStorage if available
    if (typeof window !== 'undefined') {
      const storedWalletType = localStorage.getItem("walletType");
      console.log("Initial walletType load from localStorage:", storedWalletType || "No wallet type found");
      return storedWalletType as WalletType | null;
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("authToken");
      console.log("Initial token load from localStorage:", storedToken ? "Found token" : "No token found");

      // If we have a token but no timestamp, add a timestamp now
      if (storedToken && !localStorage.getItem("authTokenTimestamp")) {
        localStorage.setItem("authTokenTimestamp", Date.now().toString());
      }

      return storedToken;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalInvested, setTotalInvested] = useState<TotalInvested | null>(null);
  const [zrusdBorrowed, setZrusdBorrowed] = useState<number | null>(null);
  const [baseSepoliaOffers, setBaseSepoliaOffers] = useState<TradingPair[] | null>(null);
  const [alertModalData, setAlertModalData] = useState<AlertModalData>(initialAlertModalData);
  const [userData, setUserData] = useState<User | null>(null);
  const [isWalletInitialized, setIsWalletInitialized] = useState<boolean>(false);
  const [isExportingAccount, setIsExportingAccount] = useState<boolean>(false);

  const [zfi_balance, isLoadingToken] = useTokenBalancess(
    [ZFI_TOKEN_TESTNET.address],
    walletType === WalletType.MINIMAL ? address : wagmi_account?.address,
  );
  const API_BASE_URL = process.env.NEXT_PUBLIC_ZYBRA_BASE_API_URL || "";
  const API_KEY = process.env.NEXT_PUBLIC_ZYBRA_API_KEY || "";
  // Define a basic API client without token refresh for initial use
  const basicApiClient = useCallback(
    (withToken: boolean = true) => {
      return axios.create({
        baseURL: `${API_BASE_URL}/api/v1`,
        ...(withToken && token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "x-api-key": API_KEY
              },
              withCredentials: true
            }
          : {
              headers: {
                "x-api-key": API_KEY
              },
              withCredentials: true
            }),
      });
    },
    [token, API_BASE_URL, API_KEY],
  );

  // Function to refresh the authentication token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // try {
    //   // Only attempt to refresh if we have a token
    //   if (!token) return false;

    //   // Call the token refresh endpoint using the basic client
    //   const response = await basicApiClient(true).post("/auth/refresh");

    //   if (response?.data?.success && response?.data?.payload?.token) {
    //     // Update token in localStorage and state
    //     const newToken = response.data.payload.token;

    //     // Store token with timestamp to track when it was refreshed
    //     localStorage.setItem("authToken", newToken);
    //     localStorage.setItem("authTokenTimestamp", Date.now().toString());

    //     setToken(newToken);
    //     return true;
    //   }
    //   return false;
    // } catch (error) {
    //   console.error("Token refresh error:", error);
    //   // If refresh fails, we don't immediately log out the user
    //   // The next API call will determine if we need to clear the token
    //   return false;
    // }
    return true
  }, [basicApiClient, token]);

  // Create an axios instance with interceptors for token management
  const apiClient = useCallback(
    (withToken: boolean = true) => {
      // Check if token exists in localStorage but not in state
      if (withToken && !token && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          console.log("Token found in localStorage but not in state, using localStorage token");
          // Use the token from localStorage for this request
          const instance = axios.create({
            baseURL: `${API_BASE_URL}/api/v1`,
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "x-api-key": API_KEY
            },
            withCredentials: true
          });
          return instance;
        } else if (withToken) {
          // If we need a token but don't have one, log a warning
          console.warn("API request requires authentication but no token is available");

          // For endpoints that absolutely require authentication, we could throw an error here
          // or return a pre-configured error response, but for now we'll just log a warning
          // and let the request proceed (it will likely fail with a 401)
        }
      }

      // Log authentication state for debugging
      if (withToken) {
        console.log(`API Client created with token: ${token ? 'Yes' : 'No'}`);
      }

      const instance = axios.create({
        baseURL: `${API_BASE_URL}/api/v1`,
        ...(withToken && token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "x-api-key": API_KEY
              },
              withCredentials: true
            }
          : {
              headers: {
                "x-api-key": API_KEY
              },
              withCredentials: true
            }),
      });

      // Add response interceptor to handle token expiration
      instance.interceptors.response.use(
        (response) => {
          return response;
        },
        async (error) => {
          const originalRequest = error.config;

          // Log the error for debugging
          console.log(`API Error: ${error.response?.status} - ${error.response?.data?.message || 'Unknown error'}`);

          // Check if the error is related to missing authorization
          if (error.response?.status === 401 && error.response?.data?.message === "Authorization header is missing") {
            console.log("Authorization header is missing, checking localStorage for token");

            // Check if we have a token in localStorage that wasn't loaded into state
            const storedToken = localStorage.getItem("authToken");
            if (storedToken && (!token || token !== storedToken)) {
              console.log("Found token in localStorage, updating state and retrying request");
              // Update the token in state
              setToken(storedToken);
              // Update the request headers
              originalRequest.headers.Authorization = `Bearer ${storedToken}`;
              // Retry the original request
              return instance(originalRequest);
            }
          }

          // If the error is 401 (Unauthorized) and we haven't already tried to refresh
          if (error.response?.status === 401 && !originalRequest._retry && token) {
            originalRequest._retry = true;
            console.log("Token expired, attempting to refresh");

            try {
              // Try to refresh the token
              const refreshed = await refreshToken();

              if (refreshed) {
                console.log("Token refresh successful, retrying request");
                // If token refresh was successful, update the Authorization header
                const newToken = localStorage.getItem('authToken');
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                // Retry the original request
                return instance(originalRequest);
              } else {
                console.log("Token refresh failed, but keeping token for now");
                // We don't clear the token here, as it might still be valid for other requests
                // The user will need to explicitly log out if they want to clear their session
              }
            } catch (refreshError) {
              console.error("Error refreshing token in interceptor:", refreshError);
              // We don't clear the token on refresh error
              // Just log the error and continue
            }
          }

          // If we couldn't refresh the token or the error is not 401, reject the promise
          return Promise.reject(error);
        }
      );

      return instance;
    },
    [token, API_BASE_URL, API_KEY, refreshToken],
  );

  const alertModalCloseHandler = useCallback(() => {
    setAlertModalData(initialAlertModalData);
  }, []);

  const alertModalOpenHandler = useCallback((data: AlertModalData) => {
    setAlertModalData({ ...initialAlertModalData, ...data });
  }, []);

  // API actions


  const authenticateFromDb = useCallback(
    async ({ wallet, type }: { wallet: string; type: "web3-wallet" | "abstraction-wallet" }) => {
      try {
        const response = await apiClient(false).post("/auth", { wallet, type });
        return response.data;
      } catch (error) {
        console.error("Authentication error:", error);
        throw error;
      }
    },
    [apiClient],
  );

  // The refreshToken function has been moved above the apiClient definition

  const updateUserProfile = useCallback(
    async (data: { first_name?: string; last_name?: string; profile_details?: object }) => {
      const response = await apiClient().put("/user/edit-profile", data);
      return response.data;
    },
    [apiClient],
  );

  // const submitKYC = useCallback(
  //   async (data: { document_type: string; document_number: string; document_image: string }) => {
  //     const response = await apiClient().post("/user/kyc", data);
  //     return response.data;
  //   },
  //   [apiClient],
  // );

  const submitKYC = useCallback(
    async () => {
      const response = await apiClient().post("/user/kyc");
      return response.data;
    },
    [apiClient],
  );
  const getKYCStatus = useCallback(async () => {
    const response = await apiClient().get("/user/get-kyc");
    return response.data;
  }, [apiClient]);

  const addWallet = useCallback(
    async (walletAddress: string) => {
      const response = await apiClient().post("/user/wallet", { walletAddress });
      return response.data;
    },
    [apiClient],
  );

  const getWallets = useCallback(async () => {
    const response = await apiClient().get("/user/wallets");
    return response.data;
  }, [apiClient]);

  // Use a ref to track if walletSignIn is already in progress
  const isWalletSignInInProgressRef = useRef(false);

  const walletSignIn = useCallback(
    async (type: "wallet" | "auth", address: string) => {
      // Prevent multiple simultaneous auth attempts
      if (loading || isWalletSignInInProgressRef.current) {
        console.log("Authentication already in progress, skipping duplicate call");
        return;
      }

      // Set the in-progress flag
      isWalletSignInInProgressRef.current = true;

      console.log(`Starting wallet sign-in (${type}) for address: ${address}`);
      setLoading(true);
      setError(null);

      // If we already have a token but the wallet address has changed,
      // we should clear the token and re-authenticate with the new wallet
      if (token) {
        console.log("Already have a token, but wallet address changed. Re-authenticating...");
        // Clear the existing token
        localStorage.removeItem("authToken");
        localStorage.removeItem("authTokenTimestamp");
        setToken(null);
      }

      try {
        // Set wallet type based on the connection method
        // "wallet" type is for web3 wallets (MetaMask, etc.)
        // "auth" type is for Alchemy account abstraction (email, Google, Apple)
        const walletTypeForAuth = type === "wallet" ? WalletType.WEB3 : WalletType.MINIMAL;
        const wallet_type = walletTypeForAuth === WalletType.WEB3 ? "web3-wallet" : "abstraction-wallet";

        console.log(`Setting wallet type to ${walletTypeForAuth} (${wallet_type}) for address: ${address}`);
        setWalletType(walletTypeForAuth);

        // Store wallet type in localStorage for persistence across page reloads
        localStorage.setItem("walletType", walletTypeForAuth);

        // Authenticate with the backend
        // All authentication methods (wallet, email, Google, Apple) use the same /auth endpoint
        // The only difference is the wallet_type parameter
        console.log(`Calling backend /auth API with wallet: ${address}, type: ${wallet_type}`);
        const authResponse = await authenticateFromDb({ wallet: address, type: wallet_type });

        if (authResponse?.success && authResponse?.payload) {
          console.log("Authentication successful:", authResponse);

          // Store the token in localStorage and state
          const authToken = authResponse.payload.token;
          localStorage.setItem("authToken", authToken);
          localStorage.setItem("authTokenTimestamp", Date.now().toString());
          setToken(authToken);

          // Create a user object from the authentication response
          if (authResponse.payload.user) {
            const authUserData = authResponse.payload.user;
            const walletData = authResponse.payload.wallet;

            // Create a User object with the data from the authentication response
            const updatedUser: User = {
              _id: authUserData._id || null,
              username: authUserData.username || null,
              first_name: authUserData.first_name || null,
              last_name: authUserData.last_name || null,
              user_type: authUserData.user_type || null,
              email: authUserData.email || null,
              type: authUserData.type || null,
              verified: authUserData.verified || null,
              profile_status: authUserData.profile_status || null,
              kyc_status: authUserData.kyc_status || null,
              kyc_details: authUserData.kyc_details || null,
              wallets: walletData ? [{
                _id: null,
                address: walletData.address,
                wallet_type: walletData.type
              }] : null,
              created_at: authUserData.created_at || null,
              updated_at: authUserData.updated_at || null,
              profile_details: authUserData.profile_details || null
            };

            // Update the user state with the authentication data
            setUserData(updatedUser);

            // QUEST INTEGRATION: Track login quest completion immediately after successful authentication
            // This ensures all login types (wallet, email, Google, Apple OAuth) trigger quest completion
            console.log("Triggering login quest tracking after successful authentication");
            try {
              // Create API client with the new token for quest tracking
              const questApiClient = axios.create({
                baseURL: `${API_BASE_URL}/api/v1`,
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "x-api-key": API_KEY
                },
                withCredentials: true
              });

              // Track login points and quest completion
              // This handles both first-time login and daily login quests automatically
              questApiClient.post("/quests/track/login")
                .then((questResponse) => {
                  console.log("Login quest tracking successful:", questResponse.data);
                  if (questResponse.data?.payload) {
                    const { points_awarded, is_first_login, current_streak } = questResponse.data.payload;
                    if (points_awarded > 0) {
                      console.log(`Awarded ${points_awarded} points for login. First login: ${is_first_login}, Current streak: ${current_streak}`);
                    }
                  }
                })
                .catch((questError) => {
                  console.error("Login quest tracking failed (non-critical):", questError);
                  // Don't throw error - quest tracking failure shouldn't break authentication
                });

              // Track wallet connection quest if this is a wallet-based login
              if (wallet_type === "web3-wallet" || wallet_type === "abstraction-wallet") {
                questApiClient.post("/quests/track/wallet", {
                  wallet_address: address,
                  has_testnet_assets: false // Could be enhanced to check for testnet assets
                })
                  .then((walletQuestResponse) => {
                    console.log("Wallet connection quest tracking successful:", walletQuestResponse.data);
                  })
                  .catch((walletQuestError) => {
                    console.error("Wallet connection quest tracking failed (non-critical):", walletQuestError);
                  });
              }
            } catch (questTrackingError) {
              console.error("Quest tracking setup failed (non-critical):", questTrackingError);
              // Don't throw error - quest tracking failure shouldn't break authentication
            }

            // Show success message
            alertModalOpenHandler({
              isSuccess: true,
              title: "Authentication Successful",
              message: "You have been successfully authenticated."
            });

            // Fetch additional user data if needed
            try {
              const investmentResponse = await apiClient(true).get("/user/investments/total");
              if (investmentResponse?.data?.success && investmentResponse?.data?.payload) {
                setTotalInvested(investmentResponse.data.payload);
                setZrusdBorrowed(investmentResponse.data.payload.zrusd_borrowed);
              }
            } catch (investErr) {
              console.error("Error fetching investment data:", investErr);
              // Non-critical error, don't show to user
            }
          }
        } else {
          console.error("Authentication failed:", authResponse);
          setError("Authentication failed");

          alertModalOpenHandler({
            isError: true,
            title: "Authentication Failed",
            message: "Failed to authenticate with the server. Please try again."
          });
        }
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : "Wallet sign-in failed";
        console.error("Error signing in with wallet:", err);
        setError(errorMessage);

        alertModalOpenHandler({
          isError: true,
          title: "Authentication Error",
          message: errorMessage
        });
      } finally {
        setLoading(false);
        // Reset the in-progress flag
        isWalletSignInInProgressRef.current = false;
        console.log("Wallet sign-in completed");
      }
    },
    [authenticateFromDb, loading, apiClient, alertModalOpenHandler, token],
  );

  // Quest tracking functions - defined before addTransaction to avoid dependency issues
  // Track feature usage
  const trackFeatureUsage = useCallback(async (feature_name: string): Promise<unknown> => {
    try {
      const response = await apiClient().post("/quests/track/feature", {
        feature_name
      });
      return response.data;
    } catch (error) {
      console.error("Error tracking feature usage:", error);
      return null;
    }
  }, [apiClient]);

  // Track multi-pool staking and lending for "Super Staker" badge
  const trackMultiPoolActivity = useCallback(async () => {
    try {
      const response = await apiClient().get("/quests/track/multi-pool");
      return response.data;
    } catch (error) {
      console.error("Error tracking multi-pool activity:", error);
      return null;
    }
  }, [apiClient]);

  // Track completed quests for "Completionist" badge
  const trackCompletedQuests = useCallback(async () => {
    try {
      const response = await apiClient().get("/quests/track/quest-completion");
      return response.data;
    } catch (error) {
      console.error("Error tracking completed quests:", error);
      return null;
    }
  }, [apiClient]);

  // Track earned badges for "ZyOG" badge
  const trackEarnedBadges = useCallback(async () => {
    try {
      const response = await apiClient().get("/quests/track/earned-badges");
      return response.data;
    } catch (error) {
      console.error("Error tracking earned badges:", error);
      return null;
    }
  }, [apiClient]);

  // Map transaction types to feature names for quest tracking
  const getFeatureNameFromTransaction = useCallback((data: TransactionData): string => {
    switch (data.type) {
      case 'zybra':
        if (data.metadata?.action === 'supply') return 'lend_zrusd';
        if (data.metadata?.action === 'borrow') return 'lend_zrusd';
        if (data.metadata?.action === 'withdraw') return 'lend_zrusd';
        if (data.metadata?.action === 'repay') return 'lend_zrusd';
        return 'lend_zrusd';
      case 'pool': return 'stake_tokens';
      case 'swap': return 'swap_assets';
      case 'mint': return 'mint_zrusd';
      default: return data.type;
    }
  }, []);

  const addTransaction = useCallback(
    async (data: TransactionData) => {
      console.log("_____________________dumbodumbo");
      try {
        if (!data.type) {
          throw new Error("Transaction type is required.");
        }
        if (!data.amount || data.amount <= 0) {
          throw new Error("Transaction amount must be greater than zero.");
        }
        if (!data?.metadata?.assetSymbol) {
          throw new Error("Asset is required.");
        }

        // Add transaction to backend
        const response = await apiClient().post("/user/transaction", data);

        // Track quest progress for this transaction
        if (response.data?.success) {
          try {
            // Track feature usage for quest progress
            await trackFeatureUsage(getFeatureNameFromTransaction(data));

            // Track multi-pool activity for Super Staker badge
            await trackMultiPoolActivity();

            // Complete referral if this is the user's first qualifying action
            try {
              await completeReferral();
              console.log("Referral completion attempted for transaction");
            } catch (referralError) {
              // Silent fail - user might not have a pending referral
              console.log("No pending referral to complete");
            }

            // Track completed quests and earned badges
            await trackCompletedQuests();
            await trackEarnedBadges();

            console.log("Quest progress tracked for transaction");
          } catch (questError) {
            console.error("Error tracking quest progress for transaction:", questError);
            // Don't throw - transaction was successful, quest tracking is secondary
          }
        }

        return response.data;
      } catch (err) {
        console.log("error is coming add transaction");
      }
    },
    [apiClient, trackFeatureUsage, trackMultiPoolActivity, trackCompletedQuests, trackEarnedBadges, getFeatureNameFromTransaction],
  );

  const getTransactions = useCallback(async () => {
    const response = await apiClient().get("/user/transactions");
    return response.data;
  }, [apiClient]);

  const addOffer = useCallback(
    async (data: TradingPair) => {
      try {
        // if (!data.type) {
        //   throw new Error("Transaction type is required.");
        // }
        // if (!data.amount || data.amount <= 0) {
        //   throw new Error("Transaction amount must be greater than zero.");
        // }
        // if (!data?.metadata?.assetSymbol) {
        //   throw new Error("Asset is required.");
        // }
        const response = await apiClient().post("/user/offer", data);
        return response.data;
      } catch (err) {
        console.log("error is coming in add offer");
      }
    },
    [apiClient],
  );

  const updateOffer = useCallback(
    async (updateData: {
      id: string;
      sellAmount?: number;
      buyAmount?: number;
      status?: StatusEnum;
    }) => {
      try {
        const { id, ...data } = updateData;
        if (!(data.sellAmount || data.buyAmount || data.status)) {
          throw new Error("sellAmount | buyAmount | status is required");
        }
        const response = await apiClient().patch(`/user/offer/${id}`, data);
        return response.data;
      } catch (err) {
        console.log("error is coming in update offer");
      }
    },
    [apiClient],
  );

  const cancelOffer = useCallback(
    async (offerId: string) => {
      try {
        const response = await apiClient().patch(`/user/offer/cancel/${offerId}`);

        if (response?.data?.success && baseSepoliaOffers) {
          const elemPos = baseSepoliaOffers.findIndex((item) => {
            console.log("_________baseSepoliaOffers", item.id, offerId);
            return item.id === offerId;
          });

          console.log("_________baseSepoliaOffers", elemPos, offerId);
          if (elemPos !== -1) {
            const updatedBaseSepoliaOffers = [
              ...baseSepoliaOffers.slice(0, elemPos),
              ...baseSepoliaOffers.slice(elemPos + 1),
            ];

            console.log("_________baseSepoliaOffers", baseSepoliaOffers);
            setBaseSepoliaOffers(updatedBaseSepoliaOffers);
          }
        }

        return response.data;
      } catch (err) {
        console.log("error is coming in cancel offer");
      }
    },
    [apiClient, baseSepoliaOffers],
  );

  const getBaseSepoliaOffers = useCallback(async () => {
    const response = await apiClient(false).get("/user/offers");
    if (response?.data?.payload) {
      setBaseSepoliaOffers(response.data.payload);
    }
    return response?.data?.payload || [];
  }, [apiClient]);

  const getBaseSepoliaOffer = useCallback(
    async (id: string) => {
      const response = await apiClient(false).get(`/user/offer/${id}`);
      return response?.data?.payload;
    },
    [apiClient],
  );

  // Use a ref to track if signIn is already in progress
  const isSignInInProgressRef = useRef(false);

  const signIn = useCallback(
    async (
      type: "email" | "oauth",
      payload: { email?: string; authProviderId?: "google" | "apple" },
    ) => {
      // Prevent multiple simultaneous auth attempts
      if (loading || isSignInInProgressRef.current) {
        console.log("Sign-in already in progress, skipping duplicate call");
        return;
      }

      // Set the in-progress flag
      isSignInInProgressRef.current = true;
      console.log(`Starting sign-in (${type})`);

      setLoading(true);
      setError(null);

      try {
        let userAddress: string | undefined;

        if (type === "email") {
          if (!payload.email) {
            throw new Error("Email is required for email sign-in.");
          }

          // This function is now deprecated for email authentication
          // The EmailAuthFlow component uses Alchemy's authenticate function directly
          // This is kept for backward compatibility
          console.warn("signIn with email is deprecated. Use Alchemy's authenticate function directly.");

          // Return early as the actual authentication will be handled by the EmailAuthFlow component
          setLoading(false);
          isSignInInProgressRef.current = false;
          return;
        } else if (type === "oauth") {
          if (!payload.authProviderId) {
            throw new Error("Auth provider ID is required for OAuth sign-in.");
          }

          console.log(`Starting OAuth authentication with ${payload.authProviderId}`);

          // OAuth authentication
          const userData = await authenticateAsync({
            type: "oauth",
            authProviderId: payload.authProviderId,
            mode: "popup", // Enable popup flow
          });

          console.log("OAuth authentication successful:", userData);
          userAddress = userData.address;

          // If we have a token but the address has changed, clear the token
          if (token) {
            console.log("Already have a token, but OAuth address changed. Re-authenticating...");
            // Clear the existing token
            localStorage.removeItem("authToken");
            localStorage.removeItem("authTokenTimestamp");
            setToken(null);
          }
        }

        // If we have a wallet address from authentication, sign in with it
        if (userAddress) {
          console.log(`Authenticating with backend using OAuth address: ${userAddress}`);
          await walletSignIn("auth", userAddress);

          // After successful authentication, show success message
          alertModalOpenHandler({
            isSuccess: true,
            title: "Authentication Successful",
            message: `Signed in with ${payload.authProviderId === 'google' ? 'Google' : 'Apple'} successfully!`
          });
        } else {
          throw new Error(`No address returned from ${payload.authProviderId} authentication`);
        }
      } catch (err: Error | unknown) {
        console.error("Error signing in:", err);

        // Enhanced error handling for OAuth failures
        let errorTitle = "Authentication Failed";
        let errorMessage = "Authentication failed. Please try again.";

        if (err instanceof Error) {
          if (err.message.includes("popup") || err.message.includes("blocked")) {
            errorTitle = "Popup Blocked";
            errorMessage = "Please allow popups for this site and try again.";
          } else if (err.message.includes("network") || err.message.includes("fetch")) {
            errorTitle = "Network Error";
            errorMessage = "Please check your internet connection and try again.";
          } else if (err.message.includes("cancelled") || err.message.includes("closed")) {
            errorTitle = "Sign-In Cancelled";
            errorMessage = `${payload.authProviderId === 'google' ? 'Google' : 'Apple'} sign-in was cancelled. Please try again.`;
          } else if (err.message.includes("unauthorized") || err.message.includes("access_denied")) {
            errorTitle = "Access Denied";
            errorMessage = `${payload.authProviderId === 'google' ? 'Google' : 'Apple'} sign-in was denied. Please check your account permissions.`;
          } else if (err.message.includes("rate limit") || err.message.includes("too many")) {
            errorTitle = "Rate Limit Exceeded";
            errorMessage = "Too many authentication attempts. Please wait a few minutes before trying again.";
          } else if (err.message.includes("service unavailable") || err.message.includes("503")) {
            errorTitle = "Service Unavailable";
            errorMessage = `${payload.authProviderId === 'google' ? 'Google' : 'Apple'} authentication service is temporarily unavailable. Please try again later.`;
          } else if (err.message.includes("No address returned")) {
            errorTitle = "Authentication Error";
            errorMessage = `Failed to get account information from ${payload.authProviderId === 'google' ? 'Google' : 'Apple'}. Please try again.`;
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);

        // Show error message
        alertModalOpenHandler({
          isError: true,
          title: errorTitle,
          message: errorMessage
        });

        throw err;
      } finally {
        setLoading(false);
        // Reset the in-progress flag
        isSignInInProgressRef.current = false;
        console.log("Sign-in completed");
      }
    },
    [authenticateAsync, walletSignIn, loading, token],
  );

  const logout = useCallback(async () => {
    console.log("Logout initiated");
    setLoading(true);
    setError(null);
    try {
      // We're not clearing exploration data on logout
      // This ensures users can see their progress when they log in again

      // Clear token, timestamp, and wallet type from localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("authTokenTimestamp");
      localStorage.removeItem("walletType");

      // Store the current wallet type before resetting it
      const currentWalletType = walletType;

      // Reset state variables first
      setToken(null);
      setWalletType(null);
      setAuthAttempted(false); // Reset auth attempted flag
      setUserData(null);
      setTotalInvested(null);
      setZrusdBorrowed(null);
      setBaseSepoliaOffers(null);

      // Disconnect from web3 wallet if connected
      if (currentWalletType === WalletType.WEB3) {
        console.log("Disconnecting web3 wallet");
        disconnect();
      }

      // Logout from account-kit if using minimal wallet
      if (currentWalletType === WalletType.MINIMAL) {
        console.log("Logging out from Alchemy AccountKit");
        try {
          logOut();
        } catch (logoutError) {
          console.error("Error during Alchemy logout:", logoutError);
          // Continue with the logout process even if Alchemy logout fails
        }
      }

      // Force a page reload to ensure all state is cleared
      // This helps with synchronizing Alchemy's state with our app state
      if (typeof window !== 'undefined') {
        console.log("Reloading page to ensure clean state");
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [disconnect, logOut, walletType]);

  const getUserAssetsAndPoolsHoldings = useCallback(async () => {
    const response = await apiClient().get(`/holdings`);
    return response.data;
  }, [apiClient]);

  const getTotalInvestment = useCallback(async () => {
    const response = await apiClient().get("/user/investments/total");
    return response.data;
  }, [apiClient]);


  const getTotalAssetInvestment = useCallback(async () => {
    const response = await apiClient().get("/user/investments/asset-total");
    return response.data;
  }, [apiClient]);

  // TVL API methods with fallback support
  const getTVLMetrics = useCallback(async () => {
    const response = await apiClient().get("/dashboard/tvl");
    return response.data;
  }, [apiClient]);

  const getSimpleTVLMetrics = useCallback(async () => {
    const response = await apiClient().get("/dashboard/tvl/simple");
    return response.data;
  }, [apiClient]);

  const getTVLBreakdown = useCallback(async (period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d') => {
    const response = await apiClient().get(`/dashboard/tvl/breakdown?period=${period}`);
    return response.data;
  }, [apiClient]);

  const getSimpleTVLBreakdown = useCallback(async (period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d') => {
    const response = await apiClient().get(`/dashboard/tvl/breakdown/simple?period=${period}`);
    return response.data;
  }, [apiClient]);

  // Add a token expiration check effect
  useEffect(() => {
    const checkTokenExpiration = async () => {
      // First check if we have a token in localStorage but not in state
      if (!token && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          console.log("Found token in localStorage but not in state, updating state");
          setToken(storedToken);
          return; // Exit early as we've updated the token
        }
      }

      // If we have a token, check if it needs refreshing
      if (token) {
        const tokenTimestamp = localStorage.getItem("authTokenTimestamp");
        if (!tokenTimestamp) {
          // If we have a token but no timestamp, set the timestamp now
          localStorage.setItem("authTokenTimestamp", Date.now().toString());
          return;
        }

        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        // If token is older than 23 hours, refresh it (assuming 24 hour expiry)
        if (tokenAge > 23 * 60 * 60 * 1000) {
          console.log("Token is older than 23 hours, refreshing");
          const refreshed = await refreshToken();
          if (!refreshed) {
            console.log("Token refresh failed, but keeping token for now");
            // We don't clear the token here, as it might still be valid for other requests
            // The user will need to explicitly log out if they want to clear their session
          }
        } else {
          console.log(`Token is still valid (age: ${Math.round(tokenAge / (60 * 60 * 1000))} hours)`);
        }
      }
    };

    checkTokenExpiration();

    // Set up a periodic check every 15 minutes
    const intervalId = setInterval(checkTokenExpiration, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token, refreshToken]);


  const getUserPointsProfile = useCallback(async () => {
    const response = await apiClient().get("/points/profile");
    return response.data;
  }, [apiClient]);

  const getUserPointsHistory = useCallback(async (page = 1, limit = 20, activity_type?: string) => {
    let url = `/points/history?page=${page}&limit=${limit}`;
    if (activity_type) {
      url += `&activity_type=${activity_type}`;
    }
    const response = await apiClient().get(url);
    return response.data;
  }, [apiClient]);

  // Check if user is endorsed via zybra-be backend
  const checkUserEndorsement = useCallback(async (userAddress: string) => {
    try {
      console.log("Checking user endorsement status via zybra-be backend:", userAddress);
      const response = await apiClient().get(`/endorse/check?address=${userAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error checking user endorsement:", error);
      return { success: false, payload: { is_endorsed: false } };
    }
  }, [apiClient]);

  // Endorse user via zybra-be backend
  const endorseUser = useCallback(async (userAddress: string) => {
    try {
      console.log("Endorsing user via zybra-be backend:", userAddress);
      const response = await apiClient().post('/endorse', {
        address: userAddress
      });
      return response.data;
    } catch (error) {
      console.error("Error endorsing user:", error);
      throw error;
    }
  }, [apiClient]);

  // Cache for leaderboard data to prevent redundant API calls
  const leaderboardCache = useRef<{
    points: { [key: string]: { data: any, timestamp: number } };
    quests: { [key: string]: { data: any, timestamp: number } };
  }>({
    points: {},
    quests: {}
  });

  // Cache duration in milliseconds (5 minutes)
  const LEADERBOARD_CACHE_DURATION = 5 * 60 * 1000;

  const getPointsLeaderboard = useCallback(async (page = 1, limit = 10) => {
    const cacheKey = `${page}-${limit}`;
    const now = Date.now();

    // Check if we have cached data that's still valid
    if (
      leaderboardCache.current.points[cacheKey] &&
      now - leaderboardCache.current.points[cacheKey].timestamp < LEADERBOARD_CACHE_DURATION
    ) {
      console.log(`Using cached points leaderboard data for page ${page}, limit ${limit}`);
      return leaderboardCache.current.points[cacheKey].data;
    }

    try {
      console.log(`Fetching fresh points leaderboard data for page ${page}, limit ${limit}`);
      const response = await apiClient().get(`/points/leaderboard?page=${page}&limit=${limit}`);

      // Cache the response
      if (response.data && response.data.success) {
        leaderboardCache.current.points[cacheKey] = {
          data: response.data,
          timestamp: now
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching points leaderboard:", error);

      // If we have cached data, return it even if expired as a fallback
      if (leaderboardCache.current.points[cacheKey]) {
        console.log("Returning expired cached points leaderboard data as fallback");
        return leaderboardCache.current.points[cacheKey].data;
      }

      throw error;
    }
  }, [apiClient, LEADERBOARD_CACHE_DURATION]);

  const claimDailyLoginPoints = useCallback(async () => {
    const response = await apiClient().post("/points/claim-daily");
    return response.data;
  }, [apiClient]);

  const getRedemptionOptions = useCallback(async () => {
    const response = await apiClient().get("/points/redemption-options");
    return response.data;
  }, [apiClient]);

  const redeemPointsForReward = useCallback(async (reward_id: string, points_cost: number) => {
    const response = await apiClient().post("/points/redeem", { reward_id, points_cost });
    return response.data;
  }, [apiClient]);

  const updatePointsFromFrontend = useCallback(async (points: number, metadata: Record<string, unknown> = {}) => {
    const response = await apiClient().post("/quests/points/frontend-update", {
      points,
      activity_type: "frontend_update",
      metadata
    });
    return response.data;
  }, [apiClient]);

  // Quest API implementations
  const getAvailableQuests = useCallback(async () => {
    const response = await apiClient().get("/quests/available");
    return response.data;
  }, [apiClient]);

  const getUserQuests = useCallback(async (status?: 'not_started' | 'in_progress' | 'completed' | 'claimed') => {
    let url = "/quests/user";
    if (status) {
      url += `?status=${status}`;
    }
    const response = await apiClient().get(url);
    return response.data;
  }, [apiClient]);

  const startQuest = useCallback(async (quest_id: string) => {
    const response = await apiClient().post("/quests/start", { quest_id });
    return response.data;
  }, [apiClient]);

  const claimQuestRewards = useCallback(async (quest_id: string) => {
    const response = await apiClient().post("/quests/claim", { quest_id });
    return response.data;
  }, [apiClient]);

  const getQuestLeaderboard = useCallback(async (page = 1, limit = 10) => {
    const cacheKey = `${page}-${limit}`;
    const now = Date.now();

    // Check if we have cached data that's still valid
    if (
      leaderboardCache.current.quests[cacheKey] &&
      now - leaderboardCache.current.quests[cacheKey].timestamp < LEADERBOARD_CACHE_DURATION
    ) {
      console.log(`Using cached quest leaderboard data for page ${page}, limit ${limit}`);
      return leaderboardCache.current.quests[cacheKey].data;
    }

    try {
      console.log(`Fetching fresh quest leaderboard data for page ${page}, limit ${limit}`);
      const response = await apiClient().get(`/quests/leaderboard?page=${page}&limit=${limit}`);

      // Cache the response
      if (response.data && response.data.success) {
        leaderboardCache.current.quests[cacheKey] = {
          data: response.data,
          timestamp: now
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching quest leaderboard:", error);

      // If we have cached data, return it even if expired as a fallback
      if (leaderboardCache.current.quests[cacheKey]) {
        console.log("Returning expired cached quest leaderboard data as fallback");
        return leaderboardCache.current.quests[cacheKey].data;
      }

      throw error;
    }
  }, [apiClient, LEADERBOARD_CACHE_DURATION]);

  // Track profile completion
const trackProfileCompletion = useCallback(async (has_wallet: boolean, has_email_optin: boolean): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/profile", {
      has_wallet,
      has_email_optin
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking profile completion:", error);
    // Silently fail to not disrupt user experience
    return null;
  }
}, [apiClient]);

// Track wallet connection with testnet assets
const trackWalletConnection = useCallback(async (wallet_address: string, has_testnet_assets: boolean = false): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/wallet", {
      wallet_address,
      has_testnet_assets
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking wallet connection:", error);
    return null;
  }
}, [apiClient]);

// Store email opt-in for quests
const storeEmailOptin = useCallback(async (email: string, quest_id: string): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/email-optin", {
      email,
      quest_id
    });
    return response.data;
  } catch (error) {
    console.error("Error storing email opt-in:", error);
    return null;
  }
}, [apiClient]);

// Verify social share
const verifySocialShare = useCallback(async (platform: string, post_url: string, action_type: string, quest_id?: string): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/social", {
      platform,
      post_url,
      action_type,
      quest_id
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying social share:", error);
    return null;
  }
}, [apiClient]);

// Track referral
const trackReferral = useCallback(async (referral_code: string, referred_user_id: string, action_completed: boolean = false): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/referral", {
      referral_code,
      referred_user_id,
      action_completed
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking referral:", error);
    return null;
  }
}, [apiClient]);

// Track AMA participation
const trackAMAParticipation = useCallback(async (ama_id: string, asked_question: boolean = false): Promise<unknown> => {
  try {
    const response = await apiClient().post("/quests/track/ama", {
      ama_id,
      asked_question
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking AMA participation:", error);
    return null;
  }
}, [apiClient]);

const trackLoginStreak = useCallback(async () => {
  try {
    const response = await apiClient().post("/quests/track/login-streak");
    return response.data;
  } catch (error) {
    console.error("Error tracking login streak:", error);
    return null;
  }
}, [apiClient]);

// Track referral count for "Dazzle Up" badge
const trackReferralCount = useCallback(async () => {
  try {
    const response = await apiClient().get("/quests/track/referral-count");
    return response.data;
  } catch (error) {
    console.error("Error tracking referral count:", error);
    return null;
  }
}, [apiClient]);

// Get user's badge data (earned badges, progress on badge quests)
const getUserBadges = useCallback(async () => {
  try {
    const response = await apiClient().get("/quests/user/badges");
    return response.data;
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return null;
  }
}, [apiClient]);

const getBadges = useCallback(async () => {
  try {
    const response = await apiClient().get("/quests/all-badges");
    return response.data;
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return null;
  }
}, [apiClient]);

  // Use refs to track if we've already attempted to load user data
  const dataLoadAttemptedRef = useRef(false);
  const isLoadingUserDataRef = useRef(false);

  // Check token validity on page load/refresh
  useEffect(() => {
    const checkTokenOnPageLoad = async () => {
      console.log("Checking token validity on page load/refresh");

      // Check if we have a token in localStorage but not in state
      if (!token && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          console.log("Found token in localStorage but not in state, updating state");
          setToken(storedToken);

          // Also set the wallet type based on the stored wallet type
          const storedWalletType = localStorage.getItem("walletType");
          if (storedWalletType && !walletType) {
            console.log("Setting wallet type from localStorage:", storedWalletType);
            setWalletType(storedWalletType as WalletType);
          } else if (!storedWalletType && !walletType) {
            // Default to MINIMAL wallet type if we have a token but no wallet type
            // This is likely an email or social login
            console.log("No wallet type in localStorage, defaulting to MINIMAL");
            setWalletType(WalletType.MINIMAL);
            localStorage.setItem("walletType", WalletType.MINIMAL);
          }

          // Exit early as the token will be validated in a subsequent effect
          return;
        }
      }

      // If we have a token in state, check if it's still valid
      if (token) {
        try {
          // Try to make a simple API call to check if token is still valid
          const userResponse = await apiClient(true).get("/user/profile");

          if (userResponse?.data?.success && userResponse?.data?.payload) {
            console.log("Token is valid on page load, updating user data");

            // Update user data if we don't have it yet
            if (!userData) {
              setUserData(userResponse.data.payload);

              // Set wallet type based on the user data
              if (userResponse.data.payload.wallets && userResponse.data.payload.wallets.length > 0) {
                const walletData = userResponse.data.payload.wallets[0];
                setWalletType(walletData.wallet_type === "web3-wallet" ? WalletType.WEB3 : WalletType.MINIMAL);
              } else if (address) {
                // If we have an address from Alchemy but no wallet in user data
                setWalletType(WalletType.MINIMAL);
              }
            }
          } else {
            console.log("Token validation failed on page load, attempting refresh");
            await refreshToken();
          }
        } catch (error) {
          console.log("Token validation failed on page load, attempting refresh");
          try {
            // Try to refresh the token
            const refreshed = await refreshToken();
            if (!refreshed) {
              // If refresh fails, we'll keep the token but log the failure
              console.log("Token refresh failed on page load, but keeping token");
              // We don't clear the token here, as it might still be valid for other requests

              // Reset auth attempted flag to allow re-authentication on next navigation
              setAuthAttempted(false);
            } else {
              console.log("Token refreshed successfully on page load");

              // Try to fetch user data with the refreshed token
              try {
                const userResponse = await apiClient(true).get("/user/profile");
                if (userResponse?.data?.success && userResponse?.data?.payload) {
                  setUserData(userResponse.data.payload);

                  // Set wallet type based on the user data
                  if (userResponse.data.payload.wallets && userResponse.data.payload.wallets.length > 0) {
                    const walletData = userResponse.data.payload.wallets[0];
                    setWalletType(walletData.wallet_type === "web3-wallet" ? WalletType.WEB3 : WalletType.MINIMAL);
                  } else if (address) {
                    setWalletType(WalletType.MINIMAL);
                  }
                }
              } catch (userErr) {
                console.error("Error fetching user profile after token refresh:", userErr);
              }
            }
          } catch (refreshError) {
            console.error("Error refreshing token on page load:", refreshError);
          }
        }
      }
    };

    // Check token validity on page load
    checkTokenOnPageLoad();
  }, [token, userData, loading, apiClient, refreshToken, address, walletType]);

  // Load user data on initial mount if token exists in localStorage
  useEffect(() => {
    const loadUserData = async () => {
      // Only proceed if:
      // 1. We have a token
      // 2. We don't have user data yet
      // 3. We're not currently loading
      // 4. We haven't already attempted to load data in this session
      if (token && !userData && !loading && !isLoadingUserDataRef.current && !dataLoadAttemptedRef.current) {
        // Set loading flags
        isLoadingUserDataRef.current = true;
        setLoading(true);

        try {
          // Fetch user profile data
          const userResponse = await apiClient(true).get("/user/profile");
          if (userResponse?.data?.success && userResponse?.data?.payload) {
            // Set user data
            setUserData(userResponse.data.payload);

            // Set wallet type based on the user data
            if (userResponse.data.payload.wallets && userResponse.data.payload.wallets.length > 0) {
              const walletData = userResponse.data.payload.wallets[0];
              setWalletType(walletData.wallet_type === "web3-wallet" ? WalletType.WEB3 : WalletType.MINIMAL);
            }

            // Fetch additional user data if needed
            try {
              const investmentResponse = await apiClient(true).get("/user/investments/total");
              if (investmentResponse?.data?.success && investmentResponse?.data?.payload) {
                setTotalInvested(investmentResponse.data.payload);
                setZrusdBorrowed(investmentResponse.data.payload.zrusd_borrowed);
              }
            } catch (investErr) {
              console.warn("Could not fetch investment data:", investErr);
            }
          } else {
            // If the token doesn't return valid user data, log the issue but keep the token
            console.log("Token doesn't return valid user data, but keeping token");
            // We don't clear the token here, as it might still be valid for other requests
          }
        } catch (err) {
          console.error("Error loading user data on mount:", err);
          // If there's an error loading user data, log it but keep the token
          console.log("Error loading user data, but keeping token");
          // We don't clear the token here, as it might still be valid for other requests
        } finally {
          // Reset loading flags
          isLoadingUserDataRef.current = false;
          setLoading(false);
          // Mark that we've attempted to load data
          dataLoadAttemptedRef.current = true;
        }
      }
    };

    loadUserData();

    // Reset the data load attempt flag when token changes
    // This allows us to try loading data again if the token changes
    return () => {
      if (!token) {
        dataLoadAttemptedRef.current = false;
      }
    };
  }, [token, userData, loading, apiClient]);

  // Check if wallet is initialized
  useEffect(() => {
    if (user && address && signerStatus && smartAccountClient) {
      // If we have a user, address, and the smart account client is available
      // Check if the wallet is initialized based on signer status
      setIsWalletInitialized(!signerStatus.isInitializing && !!smartAccountClient.address);
    }
  }, [user, address, signerStatus, smartAccountClient]);

  // Set up token refresh mechanism
  useEffect(() => {
    // Function to check if token needs refreshing
    const checkAndRefreshToken = async () => {
      if (!token) return;

      // Check if token is getting old and needs proactive refreshing
      const tokenTimestamp = localStorage.getItem("authTokenTimestamp");
      const tokenAge = tokenTimestamp ? Date.now() - parseInt(tokenTimestamp) : 0;

      // If token is older than 3 hours (10800000 ms), refresh it proactively
      // This helps prevent session expiration during active use
      const TOKEN_REFRESH_AGE = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

      // If token is older than 23 hours (82800000 ms), force refresh it
      // This ensures the token is refreshed before it expires (typically at 24 hours)
      const TOKEN_FORCE_REFRESH_AGE = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

      if (tokenAge > TOKEN_FORCE_REFRESH_AGE) {
        console.log("Token is about to expire, forcing refresh");
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            console.log("Token refreshed successfully before expiration");
            return;
          } else {
            console.log("Token force refresh failed, but keeping token");
            // We don't clear the token here, as it might still be valid for other requests
          }
        } catch (refreshError) {
          console.error("Error force refreshing token:", refreshError);
        }
      } else if (tokenAge > TOKEN_REFRESH_AGE) {
        console.log("Token is getting old, refreshing proactively");
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            console.log("Token refreshed proactively");
            return;
          }
        } catch (refreshError) {
          console.error("Error refreshing token proactively:", refreshError);
        }
      }

      try {
        // Try to make a simple API call to check if token is still valid
        await apiClient(true).get("/user/profile");
      } catch (error) {
        // If we get an error, try to refresh the token
        try {
          const refreshed = await refreshToken();
          if (!refreshed) {
            // If refresh fails, log the issue but keep the token
            console.log("Token refresh failed during proactive check, but keeping token");
            // We don't clear the token here, as it might still be valid for other requests
            setAuthAttempted(false); // Reset auth attempted flag to allow re-authentication
          }
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
        }
      }
    };

    // Check token validity immediately
    checkAndRefreshToken();

    // Set up interval to check token validity every 5 minutes
    // This ensures the token is refreshed before it expires
    const tokenRefreshInterval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    // Also set up a listener for user activity to refresh the token
    const handleUserActivity = () => {
      if (typeof window === 'undefined') return;

      // Only check if we haven't checked in the last minute
      const lastCheck = parseInt(localStorage.getItem("lastTokenCheck") || "0");
      const now = Date.now();
      if (now - lastCheck > 60000) { // 1 minute
        localStorage.setItem("lastTokenCheck", now.toString());
        checkAndRefreshToken();
      }
    };

    // Add event listeners for user activity (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener("mousemove", handleUserActivity);
      window.addEventListener("keydown", handleUserActivity);
      window.addEventListener("click", handleUserActivity);
      window.addEventListener("scroll", handleUserActivity);
    }

    // Clean up event listeners and interval on unmount
    return () => {
      clearInterval(tokenRefreshInterval);

      // Only remove event listeners if window exists
      if (typeof window !== 'undefined') {
        window.removeEventListener("mousemove", handleUserActivity);
        window.removeEventListener("keydown", handleUserActivity);
        window.removeEventListener("click", handleUserActivity);
        window.removeEventListener("scroll", handleUserActivity);
      }
    };
  }, [token, refreshToken, apiClient]);

  // Create a ref at the component level to track authentication state
  const isAuthenticatingRef = useRef(false);

  // Track previous Wagmi account address to detect changes
  const previousWagmiAddressRef = useRef<string | undefined>(undefined);

  // Listen specifically for Wagmi account changes (Rainbow Kit wallet connections)
  useEffect(() => {
    const handleWagmiAccountChange = async () => {
      // Get current Wagmi account address
      const currentWagmiAddress = wagmi_account.address;

      // If there's no address, nothing to do
      if (!currentWagmiAddress) {
        previousWagmiAddressRef.current = undefined;
        return;
      }

      // If the address hasn't changed, nothing to do
      if (currentWagmiAddress === previousWagmiAddressRef.current) {
        return;
      }

      console.log("Wagmi account changed:", {
        previous: previousWagmiAddressRef.current,
        current: currentWagmiAddress
      });

      // Update the previous address reference
      previousWagmiAddressRef.current = currentWagmiAddress;

      // If we're already authenticating, don't start another authentication process
      if (isWalletSignInInProgressRef.current || loading) {
        console.log("Authentication already in progress, skipping Wagmi account change handler");
        return;
      }

      try {
        console.log("Authenticating with new Wagmi wallet:", currentWagmiAddress);
        // Always authenticate with the backend when a wallet is connected through Wagmi/Rainbow Kit
        await walletSignIn("wallet", currentWagmiAddress);
      } catch (error) {
        console.error("Error authenticating with Wagmi wallet:", error);
      }
    };

    // Handle Wagmi account changes
    handleWagmiAccountChange();

  }, [wagmi_account.address, walletSignIn, loading]);

  // Handle wallet connection and authentication
  useEffect(() => {
    const attemptAuthentication = async () => {
      // Only proceed if not already authenticating
      if (isAuthenticatingRef.current) {
        console.log("Authentication already in progress, skipping");
        return;
      }

      // Check if we're already authenticated with Alchemy
      // For Alchemy authentication (email, Google, Apple), we need both the status and address
      const isAlchemyAuthenticated = signerStatus.status === AlchemySignerStatus.CONNECTED && address;
      // For web3 wallet authentication (MetaMask, etc.), we just need the address
      const isWagmiAuthenticated = !!wagmi_account.address;

      console.log("Authentication state check:", {
        isAlchemyAuthenticated,
        isWagmiAuthenticated,
        signerStatus: signerStatus.status,
        address,
        wagmiAddress: wagmi_account.address,
        token: !!token,
        authAttempted,
        walletType
      });

      // Only attempt authentication if we don't have a token and we're not already loading
      // and we haven't attempted auth yet in this session
      if (!token && !loading && !authAttempted) {
        try {
          // Set the authenticating flag to prevent multiple calls
          isAuthenticatingRef.current = true;
          console.log("Attempting authentication...");

          // Check if we have a token in localStorage first
          const existingToken = localStorage.getItem("authToken");
          if (existingToken) {
            console.log("Found existing token in localStorage");
            // If we have a token in localStorage, set it in state
            // The token validity will be checked by other useEffects
            setToken(existingToken);
            setAuthAttempted(true);
          } else if (isWagmiAuthenticated) {
            console.log("Using wagmi account for authentication:", wagmi_account.address);
            // If no token in localStorage but we have a wallet address, authenticate with it
            setAuthAttempted(true);
            await walletSignIn("wallet", wagmi_account.address || "");
          } else if (isAlchemyAuthenticated) {
            console.log("Using account-kit address for authentication:", address);
            // If no token in localStorage and no wallet address but we have an account-kit address, authenticate with it
            setAuthAttempted(true);
            await walletSignIn("auth", address);
          } else {
            console.log("No authentication method available");
            // Mark as attempted even if we don't have any authentication method
            // This prevents continuous retries
            setAuthAttempted(true);
          }
        } catch (error) {
          console.error("Authentication attempt failed:", error);
          // Mark as attempted even if authentication fails
          setAuthAttempted(true);
        } finally {
          // Reset the authenticating flag
          isAuthenticatingRef.current = false;
        }
      }

      // Check if we need to logout due to Alchemy state change
      // If we have a token but Alchemy is no longer authenticated (for minimal wallet)
      if (token && walletType === WalletType.MINIMAL && !isAlchemyAuthenticated && authAttempted) {
        console.log("Alchemy authentication state changed, logging out");
        logout();
      }

      // Check if we need to re-authenticate with Alchemy
      // If we have an Alchemy address but no token, we should authenticate
      if (!token && isAlchemyAuthenticated && !loading && authAttempted && !isAuthenticatingRef.current) {
        console.log("Alchemy authenticated but no token, re-authenticating");
        try {
          isAuthenticatingRef.current = true;
          await walletSignIn("auth", address);
        } catch (error) {
          console.error("Re-authentication failed:", error);
        } finally {
          isAuthenticatingRef.current = false;
        }
      }
    };

    // Attempt authentication
    attemptAuthentication();

    // Cleanup function
    return () => {
      // Nothing to clean up
    };
  }, [wagmi_account, address, token, walletSignIn, loading, authAttempted, logout, signerStatus, walletType]);
  const generateReferralCode = useCallback(async () => {
    try {
      const response = (await apiClient().post('/referrals/generate'));
      return response.data;
    } catch (error) {
      console.error("Error generating referral code:", error);
      alertModalOpenHandler({
        isError: true,
        title: "Error",
        message: (error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to generate referral code"
      });
      throw error;
    }
  }, [apiClient, alertModalOpenHandler]);

  // Apply a referral code (for new users)
  const applyReferralCode = useCallback(async (referral_code: string) => {
    try {
      const response = await apiClient().post('/referrals/apply', { referral_code });
      return response.data;
    } catch (error) {
      console.error("Error applying referral code:", error);
      alertModalOpenHandler({
        isError: true,
        title: "Error",
        message: (error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid referral code"
      });
      throw error;
    }
  }, [apiClient, alertModalOpenHandler]);

  // Complete a referral after qualifying action
  const completeReferral = useCallback(async () => {
    try {
      const response = await apiClient().post('/referrals/complete');
      return response.data;
    } catch (error) {
      console.error("Error completing referral:", error);
      // Silent fail as this might be called automatically
      throw error;
    }
  }, [apiClient]);

  // Get referral statistics for the current user
  const getReferralStats = useCallback(async () => {
    try {
      const response = await apiClient().get('/referrals/stats');
      return response.data;
    } catch (error) {
      console.error("Error getting referral stats:", error);
      alertModalOpenHandler({
        isError: true,
        title: "Error",
        message: "Failed to retrieve referral statistics"
      });
      throw error;
    }
  }, [apiClient, alertModalOpenHandler]);

  // Validate a referral code
  const validateReferralCode = useCallback(async (code: string) => {
    try {
      const response = await apiClient().get(`/referrals/validate/${code}`);
      return response.data;
    } catch (error) {
      console.error("Error validating referral code:", error);
      return {
        success: false,
        payload: {
          valid: false,
          referrer_name: ""
        }
      };
    }
  }, [apiClient]);
  const updateUserProfileInfo = useCallback(
    async (data: { username?: string; first_name?: string; last_name?: string }) => {
      try {
        const response = await apiClient().put("/user/update-profile-info", data);
        return response.data;
      } catch (err: unknown) {
        console.error("Error updating user profile info:", err);

        // Type assertion for error with response property
        const apiError = err as { response?: { status?: number; data?: { message?: string } } };

        // Handle specific error cases
        if (apiError.response?.status === 409) {
          alertModalOpenHandler({
            isError: true,
            title: "Username Already Exists",
            message: "Please choose a different username."
          });
        } else if (apiError.response?.status === 400) {
          alertModalOpenHandler({
            isError: true,
            title: "Invalid Input",
            message: apiError.response.data?.message || "Please check your input and try again."
          });
        } else {
          alertModalOpenHandler({
            isError: true,
            title: "Update Failed",
            message: "Failed to update profile information. Please try again later."
          });
        }

        throw err;
      }
    },
    [apiClient, alertModalOpenHandler]
  );
  return (
    <UserAccountContext.Provider
      value={{
        zfi_balance: Number(
          fromWei(
            (zfi_balance as { [tokenAddress: string]: string })[ZFI_TOKEN_TESTNET.address] ?? 0,
          ),
        ),
        provider: walletType === WalletType.WEB3 ? Web3provider : AlChemyprovider,
        address: useMemo(
          () => (walletType === WalletType.MINIMAL ? address : wagmi_account?.address),
          [walletType, address, wagmi_account?.address],
        ),
        walletType,
        token,
        totalInvested,
        zrusdBorrowed,
        baseSepoliaOffers,
        user: useMemo(
          () => {
            // If we have userData from API, use it as the primary source
            return userData && walletType === WalletType.WEB3 ? {...wagmi_account,...userData} :{...user,...userData}
            // Otherwise, fall back to the wallet account data
          },
          [walletType, wagmi_account, user, userData],
        ),
        loading,
        balanceLoading:
          isLoadingToken === false || typeof isLoadingToken !== "object"
            ? false
            : isLoadingToken[ZFI_TOKEN_TESTNET.address] === undefined,
        error: loginError,
        alertModalData,
        alertModalCloseHandler,
        alertModalOpenHandler,
        refreshToken,

        updateUserProfile,
        submitKYC,
        getKYCStatus,
        addWallet,
        getWallets,
        createAbstractWallet: async () => {
          try {
            setLoading(true);

            if (!smartAccountClient) {
              throw new Error("Smart account client not initialized");
            }

            // According to the AccountKit docs, the smartAccountClient is already initialized
            // when it's available. We just need to check if we have an address.

            // Get the account address from the client
            const accountAddress = smartAccountClient.address;

            if (accountAddress) {
              // The account is already initialized
              setIsWalletInitialized(true);

              // If we have an address, authenticate with it
              if (address && !isWalletSignInInProgressRef.current) {
                console.log("Authenticating with smart account address");
                await walletSignIn("auth", address);
              } else if (isWalletSignInInProgressRef.current) {
                console.log("Authentication already in progress, skipping duplicate call");
              }

              return {
                success: true,
                address: accountAddress,
                message: "Smart account already initialized"
              };
            } else if (signerStatus && signerStatus.isInitializing) {
              // The account needs initialization, but we can't directly initialize it
              // The AccountKit handles initialization internally

              // We need to wait for the initialization to complete
              // This is a simplified approach - in a real app, you might want to implement
              // a polling mechanism or use a different approach

              return {
                success: false,
                error: "Smart account is initializing. Please try again later."
              };
            }
          } catch (error) {
            console.error("Error creating abstract wallet:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            };
          } finally {
            setLoading(false);
          }
        },
        isWalletInitialized,
        exportAccount: async () => {
          try {
            setIsExportingAccount(true);

            if (!smartAccountClient) {
              throw new Error("Smart account client not initialized");
            }

            // Check if the wallet is an abstraction wallet
            if (walletType !== WalletType.MINIMAL) {
              throw new Error("Export is only available for abstraction wallets");
            }

            // We're now handling the export process in the ExportAccountModal component
            // This is just a placeholder function that returns success
            // The actual export is done using the useExportAccount hook directly in the modal

            return {
              success: true,
              message: "Export process initiated. Follow the on-screen instructions to view your recovery phrase."
            };
          } catch (error) {
            console.error("Error exporting account:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            };
          } finally {
            setIsExportingAccount(false);
          }
        },
        isExportingAccount,
        ExportAccountComponent: null,
        executeTransaction: async () => {
          throw new Error("UserAccountContext not initialized");
        },
        addTransaction,
        getTransactions,
        addOffer,
        updateOffer,
        cancelOffer,
        getBaseSepoliaOffers,
        getBaseSepoliaOffer,
        walletSignIn,
        signIn,
        logout,
        // These functions are no longer needed as we're using Alchemy's authenticate directly
        // in the EmailAuthFlow component with the custom UI approach
        verifyCode: async (_email: string, _code: number) => {
          console.warn("verifyCode is deprecated. Use Alchemy's authenticate function directly.");
          try {
            // This is just a placeholder to maintain compatibility
            return;
          } catch (error) {
            console.error("Error verifying code:", error);
            throw error;
          }
        },
        sendVerificationEmail: async (_email: string) => {
          console.warn("sendVerificationEmail is deprecated. Use Alchemy's authenticate function directly.");
          try {
            // This is just a placeholder to maintain compatibility
            return;
          } catch (error) {
            console.error("Error sending verification email:", error);
            throw error;
          }
        },
        getUserAssetsAndPoolsHoldings,
        getTotalInvestment,
        getPools: async () => {
          throw new Error("UserAccountContext not initialized");
        },
        getStocks: async () => {
          throw new Error("UserAccountContext not initialized");
        },
        getUserPointsProfile,
        getUserPointsHistory,
        getPointsLeaderboard,
        checkUserEndorsement,
        endorseUser,
        claimDailyLoginPoints,
        getRedemptionOptions,
        redeemPointsForReward,
        updatePointsFromFrontend,

        // Quest API functions
        getAvailableQuests,
        getUserQuests,
        startQuest,
        claimQuestRewards,
        getQuestLeaderboard,
        trackProfileCompletion,
        trackWalletConnection,
        storeEmailOptin,
        verifySocialShare,
        trackReferral,
        trackFeatureUsage,
        trackAMAParticipation,
        trackLoginStreak,
        trackReferralCount,
        trackMultiPoolActivity,
        trackCompletedQuests,
        trackEarnedBadges,
        getUserBadges,
        getBadges,
        generateReferralCode,
        applyReferralCode,
        completeReferral,
        getReferralStats,
        validateReferralCode,
        updateUserProfileInfo,
        getTotalAssetInvestment,
        getTVLMetrics,
        getSimpleTVLMetrics,
        getTVLBreakdown,
        getSimpleTVLBreakdown
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
};