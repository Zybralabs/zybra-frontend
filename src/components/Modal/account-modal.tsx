"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  CircleAlert,
  X,
  ArrowLeft,
  Loader2,
  UserCheck,
  AtSign,
  UserCog
} from "lucide-react";
import { ExportAccountModal } from "./export-account-modal-new";
import { WalletType } from "@/constant/account/enum";
import { QRCodeCanvas } from "qrcode.react";
import { PointsActivity, useUserAccount } from "@/context/UserAccountContext";
import { useBalance, useChainId } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/state/hooks";
import { useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { useStockIcon } from "@/hooks/useStockIcon";
import { SwarmIcon, PoolIcon, ZybraLogo } from "@/components/Icons";
import { useTransactionContext, type TransactionItem } from "@/context/TransactionContext";
import { fromWei } from "@/hooks/formatting";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZFI_TOKEN_TESTNET, ZRUSD_TOKEN_TESTNET } from "@/state/stake/hooks";
import { USDC_ADDRESS } from "@/constant/addresses";
import { Input } from "../Swap-new/components/input";
import { Label } from "../Swap-new/components/label";

interface WalletModalProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}

// History item interfaces
interface HistoryItem {
  id: string;
  type: 'quest' | 'points' | 'referral';
  title: string;
  description: string;
  points?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'claimed';
  metadata?: Record<string, any>;
}





interface Quest {
  quest_id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'claimed';
  user_progress?: {
    completed_at: string | null;
    rewards_claimed_at: string | null;
  };
  reward: {
    points: number;
  };
}

interface ReferralUser {
  user_id: string;
  name: string;
  username: string;
  joined_date: string;
  status: 'completed' | 'pending';
  completed_at: string | null;
}

// Transaction Card Component
const TransactionCard = ({ transaction, index }: { transaction: TransactionItem; index: number }) => {
  // Early return if transaction is invalid
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }
  const getTransactionIcon = (status: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Take Offer': (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4.707 4.293a1 1 0 00-1.414 1.414L11.586 10l-2.293 2.293a1 1 0 101.414 1.414L13 11.414V13a1 1 0 102 0V9a1 1 0 00-1-1h-4a1 1 0 000 2h1.586l-2.293 2.293z" clipRule="evenodd" />
        </svg>
      ),
      'Make Offer': (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" />
        </svg>
      ),
      'Withdraw': (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
        </svg>
      ),
      'Deposit': (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      )
    };
    return iconMap[status] || iconMap['Deposit'];
  };

  const getTransactionTypeColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Take Offer': 'from-pink-500/20 to-rose-600/20',
      'Make Offer': 'from-indigo-500/20 to-blue-600/20',
      'Withdraw': 'from-red-500/20 to-rose-600/20',
      'Deposit': 'from-green-500/20 to-emerald-600/20'
    };
    return colorMap[status] || colorMap['Deposit'];
  };

  // Get the appropriate logo based on asset type and symbol
  const getAssetLogo = () => {
    const assetSymbol = transaction.metadata?.assetSymbol;
    const assetType = transaction.metadata?.assetType;

    // Check for Zybra/ZFI first (highest priority)
    if (assetSymbol?.toLowerCase() === 'zfi' ||
        assetSymbol?.toLowerCase() === 'zybra' ||
        transaction.type === 'zybra') {
      return <ZybraLogo />;
    }

    // Try to get specific asset icon by symbol
    const AssetIcon = useStockIcon(assetSymbol);
    if (AssetIcon) {
      return <AssetIcon />;
    }

    // Fallback to type-based icons
    if (assetType === 'stock' || transaction.type === 'stock') {
      return <SwarmIcon />;
    } else if (assetType === 'pool' || transaction.type === 'pool') {
      return <PoolIcon />;
    }

    // Default fallback
    return <SwarmIcon />;
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Take Offer': (
        <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
      'Make Offer': (
        <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      'Withdraw': (
        <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      'Deposit': (
        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )
    };
    return iconMap[status] || iconMap['Deposit'];
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Take Offer': 'border-pink-500/30 bg-pink-500/10',
      'Make Offer': 'border-indigo-500/30 bg-indigo-500/10',
      'Withdraw': 'border-red-500/30 bg-red-500/10',
      'Deposit': 'border-green-500/30 bg-green-500/10'
    };
    return colorMap[status] || colorMap['Deposit'];
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return time.toLocaleDateString();
  };

  const formatAmount = (amount: string, asset: string) => {
    if (!amount || amount === '0') return `0 ${asset}`;

    // Determine decimals based on asset type
    const getDecimals = (assetSymbol: string) => {
      const symbol = assetSymbol?.toLowerCase();
      if (symbol === 'usdc') return 6;
      return 18; // Default for most tokens
    };

    const decimals = getDecimals(asset);

    // Use fromWei to properly format the amount
    const formattedNum = fromWei(amount, decimals);

    if (isNaN(formattedNum)) return `0 ${asset}`;

    if (formattedNum >= 1000000) {
      return `${(formattedNum / 1000000).toFixed(2)}M ${asset}`;
    } else if (formattedNum >= 1000) {
      return `${(formattedNum / 1000).toFixed(2)}K ${asset}`;
    } else if (formattedNum < 0.01 && formattedNum > 0) {
      return `<0.01 ${asset}`;
    } else {
      return `${formattedNum.toFixed(formattedNum < 1 ? 4 : 2)} ${asset}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: 0.05 * index }
      }}
      className="group relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001824]/60 via-[#002235]/40 to-[#001824]/60 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Border gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#003553]/30 via-[#0066A1]/20 to-[#003553]/30 p-[1px] group-hover:from-[#0066A1]/50 group-hover:via-[#00A3E0]/30 group-hover:to-[#0066A1]/50 transition-all duration-300">
        <div className="w-full h-full bg-[#001824]/90 rounded-xl" />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Enhanced Asset Logo with Status Indicator */}
          <div className="relative">
            {/* Main Asset Logo Container */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#001824] via-[#002235] to-[#001824] border border-[#003553]/50 flex items-center justify-center relative overflow-hidden shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/10 to-blue-500/5 rounded-xl" />

              {/* Asset Logo */}
              <div className={`relative z-10 transition-transform duration-300 ${
                // Different scaling for different asset types
                transaction.metadata?.assetSymbol?.toLowerCase() === 'zfi' ||
                transaction.metadata?.assetSymbol?.toLowerCase() === 'zybra' ||
                transaction.type === 'zybra' ||
                transaction.metadata?.assetType === 'pool' ||
                transaction.type === 'pool'
                  ? 'scale-75 sm:scale-90 group-hover:scale-100' // Zybra and Pool logos - keep current size
                  : 'scale-50 sm:scale-60 group-hover:scale-75'   // Other logos (Swarm, Stock) - make smaller
              }`}>
                {getAssetLogo()}
              </div>

              {/* Subtle border glow */}
              <div className="absolute inset-0 rounded-xl border border-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Status Indicator Badge */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#001824] flex items-center justify-center ${getStatusColor(transaction.status)} shadow-lg`}>
              {getStatusIcon(transaction.status)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-white text-sm sm:text-base bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {transaction.status} {transaction.metadata?.assetSymbol || 'Unknown Asset'}
              </h3>

              {/* Amount Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 font-medium text-xs">
                  {formatAmount(transaction.amount, transaction.metadata?.assetSymbol || 'Token')}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2">
              {transaction.metadata?.assetType && `Asset Type: ${transaction.metadata.assetType}`}
              {transaction.type && ` • Type: ${transaction.type}`}
              {transaction.tx_hash && (
                <span className="block mt-1 font-mono text-xs text-zinc-500 truncate max-w-[200px]">
                  {transaction.tx_hash}
                </span>
              )}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500">{formatTimeAgo(transaction.created_at?.toString() || new Date().toISOString())}</span>
              <div className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Right side arrow */}
        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {transaction.tx_hash && (
            <button
              onClick={() => window.open(`https://sepolia.basescan.org/tx/${transaction.tx_hash}`, '_blank')}
              className="p-1 rounded-full hover:bg-blue-500/10 transition-colors"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function WalletModal({ isOpen, setIsOpen }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState("assets");
  const { address, walletType, zfi_balance, logout, user, getKYCStatus,
    updateUserProfileInfo, isWalletInitialized, createAbstractWallet,
    alertModalOpenHandler, getUserPointsHistory,
    getUserQuests, getReferralStats } = useUserAccount();

  // Use shared transaction context
  const { transactions: transactionItems, isLoading: isLoadingTransactions } = useTransactionContext();
  const router = useRouter();
  const { swarmAssets } = useAppSelector((state) => state.application);
  const balance = useBalance({ address: address as `0x${string}` | undefined });
  const chainId = useChainId();

  // Create USDC token object
  const USDC_TOKEN = {
    address: USDC_ADDRESS[chainId] || USDC_ADDRESS[84532], // Fallback to testnet
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    networks: "1"
  };

  const [balances, isLoadingTokenBalances] = useTokenBalancess(
    [ZRUSD_TOKEN_TESTNET.address, USDC_TOKEN.address, ...swarmAssets.map((token) => token.address)].filter(Boolean),
    address
  );
  const totalList = [ZRUSD_TOKEN_TESTNET, USDC_TOKEN, ...swarmAssets].filter(token => token.address);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [KYCStatus, setKYCStatus] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInitializingWallet, setIsInitializingWallet] = useState(false);

  // History data state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);



  useEffect(() => {
    if (user) {
      const data = getKYCStatus();
      console.log({ data });
    }
  }, [user, getKYCStatus]);

  // Fetch history data when modal opens
  useEffect(() => {
    if (isOpen && address) {
      fetchHistoryData();
      // Transaction data is now handled by TransactionContext
    }
  }, [isOpen, address, getUserPointsHistory, getUserQuests, getReferralStats]);

  const fetchHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const allHistoryItems: HistoryItem[] = [];

      // Fetch points history
      try {
        const pointsResponse = await getUserPointsHistory(1, 20);
        if (pointsResponse?.payload?.history) {
          const pointsItems = pointsResponse.payload.history.map((activity: PointsActivity) => ({
            id: `points-${activity.created_at}-${activity.activity_type}`,
            type: 'points' as const,
            title: getPointsActivityTitle(activity.activity_type),
            description: getPointsActivityDescription(activity.activity_type, activity.points, activity.metadata || {}),
            points: activity.points,
            timestamp: activity.created_at,
            status: 'completed' as const,
            metadata: {
              ...activity.metadata,
              activity_type: activity.activity_type,
              badge_earned: activity.metadata?.badge_name || activity.metadata?.badge_id,
              is_milestone: activity.metadata?.milestone_reached || activity.activity_type === 'milestone_reached',
              streak_info: activity.metadata?.streak_day || activity.metadata?.streak_count
            }
          }));
          allHistoryItems.push(...pointsItems);
        }
      } catch (error) {
        console.error("Error fetching points history:", error);
      }

      // Fetch completed quests
      try {
        const questsResponse = await getUserQuests('completed');
        if (questsResponse?.payload) {
          let questsArray: Quest[] = [];
          if (Array.isArray(questsResponse.payload)) {
            questsArray = questsResponse.payload;
          } else if ((questsResponse.payload as any).all_quests) {
            questsArray = (questsResponse.payload as any).all_quests;
          }

          const questItems = questsArray
            .filter((quest: Quest) => quest.user_progress?.completed_at)
            .map((quest: Quest) => ({
              id: `quest-${quest.quest_id}`,
              type: 'quest' as const,
              title: quest.title,
              description: `Completed quest: ${quest.description}`,
              points: quest.reward?.points || 0,
              timestamp: quest.user_progress?.completed_at || new Date().toISOString(),
              status: quest.user_progress?.rewards_claimed_at ? 'claimed' as const : 'completed' as const,
              metadata: { quest_id: quest.quest_id }
            }));
          allHistoryItems.push(...questItems);
        }
      } catch (error) {
        console.error("Error fetching quests:", error);
      }

      // Fetch referral data
      try {
        const referralResponse = await getReferralStats();
        if (referralResponse?.payload?.referred_users) {
          const referralItems = referralResponse.payload.referred_users
            .filter((user: ReferralUser) => user.status === 'completed' && user.completed_at)
            .map((user: ReferralUser) => ({
              id: `referral-${user.user_id}`,
              type: 'referral' as const,
              title: 'Successful Referral',
              description: `${user.name || user.username} joined through your referral`,
              points: 100, // Assuming 100 points per referral
              timestamp: user.completed_at || user.joined_date,
              status: 'completed' as const,
              metadata: { referred_user: user }
            }));
          allHistoryItems.push(...referralItems);
        }
      } catch (error) {
        console.error("Error fetching referrals:", error);
      }

      // Sort by timestamp (newest first) with fallback for invalid dates
      allHistoryItems.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);

        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime();
      });

      // Limit to most recent 50 items for performance
      const recentItems = allHistoryItems.slice(0, 50);

      setHistoryItems(recentItems);
    } catch (error) {
      console.error("Error fetching history data:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };





  // Map badge ID to SVG image for history items - EXACT MATCH with API badge IDs
  const getHistoryBadgeImage = (badgeId: string) => {
    const badgeImageMap: Record<string, string> = {
      // Login and streak badges (exact API names from console)
      'first_login': '/icons/testnetconnected.svg',
      'daily_login': '/icons/testnetconnected.svg',
      'streak_3_day': '/icons/3daystreaker.svg',
      'streak_5_day': '/icons/5daysachiever.svg',
      'streak_7_day': '/icons/7daysmaster.svg',
      'testnet_connected': '/icons/testnetconnected.svg',

      // Product usage badges (exact API names from console)
      'testnet_staker': '/icons/testnetstaker.svg',
      'testnet_lender': '/icons/testnetlender.svg',
      'zrusd_minter': '/icons/ZrUSDMinter.svg',
      'asset_swapper': '/icons/assetswapper.svg',
      'power_user': '/icons/poweruser.svg',
      'super_staker': '/icons/testnetstaker.svg',

      // Achievement badges (exact API names from console)
      'profile_complete': '/icons/profilecomplete.svg',
      'completionist': '/icons/completionist.svg',
      'test_pilot': '/icons/testpilot.svg',
      'zy_og': '/icons/ZyOG.svg',

      // Social engagement badges (exact API names from console)
      'dazzle_up': '/icons/dazzleup.svg',
      'zybra_promoter': '/icons/shareyouryield.svg',
      'zybra_evangelist': '/icons/thread.svg',
      'zybra_referrer': '/icons/referafriend.svg',
      'community_participant': '/icons/AMA participation.svg',

      // Special badges (exact API names from console)
      'feature_explorer': '/icons/completemodules.svg',
      'zybra_master': '/icons/ZyOG.svg',
      'prize_entrant': '/icons/drawentry.svg'
    };
    return badgeImageMap[badgeId] || null;
  };

  const getPointsActivityTitle = (activityType: string): string => {
    const titles: Record<string, string> = {
      'quest_completion': 'Quest Completed',
      'daily_login': 'Daily Login Bonus',
      'referral_bonus': 'Referral Reward',
      'first_login': 'Welcome Bonus',
      'profile_completion': 'Profile Setup Bonus',
      'wallet_connection': 'Wallet Connection Bonus',
      'social_share': 'Social Media Share',
      'email_signup': 'Email Verification Bonus',
      'feature_usage': 'Feature Exploration',
      'redemption': 'Points Redemption',
      'frontend_update': 'Points Adjustment',
      'badge_earned': 'Badge Achievement',
      'milestone_reached': 'Milestone Reward',
      'streak_bonus': 'Login Streak Bonus',
      'community_engagement': 'Community Activity'
    };
    return titles[activityType] || 'Points Activity';
  };

  const getPointsActivityDescription = (activityType: string, points: number, metadata: Record<string, any>): string => {
    const descriptions: Record<string, (points: number, metadata: any) => string> = {
      'quest_completion': (pts, meta) => `Completed "${meta?.quest_name || 'quest'}" and earned ${pts} points. ${meta?.bonus_multiplier ? `Bonus multiplier: ${meta.bonus_multiplier}x` : ''}`,
      'daily_login': (pts, meta) => `Daily login streak day ${meta?.streak_day || 1}. Earned ${pts} points for consistent engagement.`,
      'referral_bonus': (pts, meta) => `Successfully referred ${meta?.referred_user || 'a friend'}. Earned ${pts} points when they completed onboarding.`,
      'first_login': (pts, _meta) => `Welcome to Zybra Finance! Earned ${pts} points for joining our community.`,
      'profile_completion': (pts, meta) => `Completed profile setup with ${meta?.completion_percentage || 100}% information. Earned ${pts} points.`,
      'wallet_connection': (pts, meta) => `Connected ${meta?.wallet_type || 'wallet'} successfully. Earned ${pts} points for account security.`,
      'social_share': (pts, meta) => `Shared ${meta?.content_type || 'content'} on ${meta?.platform || 'social media'}. Earned ${pts} points for community growth.`,
      'email_signup': (pts, _meta) => `Verified email address and subscribed to updates. Earned ${pts} points for staying connected.`,
      'feature_usage': (pts, meta) => `Explored ${meta?.feature_name || 'platform feature'} for the first time. Earned ${pts} points for discovery.`,
      'redemption': (pts, meta) => `Redeemed ${Math.abs(pts)} points for "${meta?.reward_name || 'reward'}". ${meta?.remaining_points ? `Remaining balance: ${meta.remaining_points} points.` : ''}`,
      'frontend_update': (pts, meta) => `Points balance updated: ${pts > 0 ? 'added' : 'adjusted'} ${Math.abs(pts)} points. ${meta?.reason || ''}`,
      'badge_earned': (pts, meta) => `Unlocked "${meta?.badge_name || 'achievement'}" badge! Earned ${pts} points for this milestone.`,
      'milestone_reached': (pts, meta) => `Reached ${meta?.milestone_name || 'milestone'} with ${meta?.total_value || 'progress'}. Earned ${pts} points bonus.`,
      'streak_bonus': (pts, meta) => `Maintained ${meta?.streak_count || 'login'} streak for ${meta?.streak_days || 'multiple'} days. Earned ${pts} bonus points.`,
      'community_engagement': (pts, meta) => `Participated in ${meta?.activity_type || 'community activity'}. Earned ${pts} points for engagement.`
    };

    const descriptionFn = descriptions[activityType];
    if (descriptionFn) {
      return descriptionFn(points, metadata);
    }

    return `Earned ${points} points from ${activityType.replace('_', ' ')} activity.`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    return time.toLocaleDateString();
  };

  // Function to copy the address
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const gotoUser = () => {
    router.push("/userDashboard");
    setIsOpen(false);
  };

  const logOut = () => {
    logout();
    setIsOpen(false);
  };

  const handleInitializeWallet = async () => {
    try {
      setIsInitializingWallet(true);
      const result = await createAbstractWallet();

      if (result.success) {
        // Wallet initialized successfully
        console.log("Wallet initialized successfully:", result);
      } else {
        console.error("Failed to initialize wallet:", result.error);
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    } finally {
      setIsInitializingWallet(false);
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const ZfiIcon = useStockIcon("zfi");
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    username: '',
    first_name: '',
    last_name: ''
  });

  // Update profile form data when user changes
  useEffect(() => {
    if (user) {
      setProfileFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  // Add a profile edit button in the existing wallet card
  // Add this right after the address display buttons in the wallet card

  // Add this function to handle input changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Add this function to validate the form
  const validateProfileForm = () => {
    let valid = true;
    const newErrors = { username: '', first_name: '', last_name: '' };

    // Username validation
    if (profileFormData.username) {
      if (profileFormData.username.length < 3 || profileFormData.username.length > 30) {
        newErrors.username = 'Username must be between 3 and 30 characters';
        valid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(profileFormData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
        valid = false;
      }
    } else if (!profileFormData.first_name && !profileFormData.last_name) {
      // Only require username if nothing else is provided
      newErrors.username = 'At least one field is required';
      valid = false;
    }

    // First name validation - optional but if provided must not be too long
    if (profileFormData.first_name && profileFormData.first_name.length > 50) {
      newErrors.first_name = 'First name cannot exceed 50 characters';
      valid = false;
    }

    // Last name validation - optional but if provided must not be too long
    if (profileFormData.last_name && profileFormData.last_name.length > 50) {
      newErrors.last_name = 'Last name cannot exceed 50 characters';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  // Add this function to handle form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    // Only include fields that have values
    const dataToSubmit: {
      username?: string;
      first_name?: string;
      last_name?: string;
    } = {};

    if (profileFormData.username) dataToSubmit.username = profileFormData.username;
    if (profileFormData.first_name !== undefined) dataToSubmit.first_name = profileFormData.first_name;
    if (profileFormData.last_name !== undefined) dataToSubmit.last_name = profileFormData.last_name;

    // Don't submit if no changes were made
    if (
      (user?.username === profileFormData.username || !profileFormData.username) &&
      (user?.first_name === profileFormData.first_name || profileFormData.first_name === undefined) &&
      (user?.last_name === profileFormData.last_name || profileFormData.last_name === undefined)
    ) {
      // Show some kind of alert - you could use your alertModalOpenHandler here
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateUserProfileInfo(dataToSubmit);

      // Close the profile edit modal
      setIsProfileEditOpen(false);

      // Show success modal
      alertModalOpenHandler({
        isSuccess: true,
        title: "Profile Updated",
        message: "Your profile has been successfully updated!"
      });

      // Reload the page after a short delay to show the updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1500); // 1.5 seconds delay to allow the user to see the success message

    } catch (error) {
      console.error("Profile update error:", error);
      // Error notification is handled by the updateUserProfileInfo function
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log({isWalletInitialized},{walletType})
  return (
    <>
      {/* Main Wallet Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-0 bg-gradient-to-b from-[#001C29] to-[#00141d] border-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] sm:max-h-[95vh] flex flex-col">
          <header className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-[#0A3655]/50 flex-shrink-0">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Account</h2>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </header>

          <div className="p-3 sm:p-4 md:p-5 flex-1 overflow-y-auto">
            <AnimatePresence>
              {copySuccess && (
                <motion.div
                  className="absolute top-14 sm:top-16 right-3 sm:right-5 bg-[#002E47] text-white text-xs py-1 px-3 rounded-full z-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet Initialization Alert - Only show if wallet is not initialized */}
            {!isWalletInitialized && walletType === WalletType.MINIMAL && (
              <motion.div
                className="w-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CircleAlert className="h-3.5 w-3.5 mr-2 text-blue-600 flex-shrink-0" />
                <span className="flex-grow text-xs sm:text-sm">Initialize your wallet to use all features</span>
                <Button
                  onClick={handleInitializeWallet}
                  disabled={isInitializingWallet}
                  className="text-blue-700 font-medium hover:text-blue-800 transition-colors whitespace-nowrap ml-2 h-6 sm:h-7 px-2 text-xs bg-blue-100 hover:bg-blue-200 border-0"
                >
                  {isInitializingWallet ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Initializing...</span>
                      <span className="sm:hidden">Init...</span>
                    </>
                  ) : (
                    "Initialize"
                  )}
                </Button>
              </motion.div>
            )}

            {/* Wallet Export Option - Only show if wallet is initialized and is an abstraction wallet */}
            {isWalletInitialized && walletType === WalletType.MINIMAL && (
              <motion.div
                className="w-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <UserCog className="h-3.5 w-3.5 mr-2 text-green-600 flex-shrink-0" />
                <span className="flex-grow text-xs sm:text-sm">Export your wallet to backup your account</span>
                <Button
                  onClick={() => setIsExportModalOpen(true)}
                  className="text-green-700 font-medium hover:text-green-800 transition-colors whitespace-nowrap ml-2 h-6 sm:h-7 px-2 text-xs bg-green-100 hover:bg-green-200 border-0"
                >
                  Export
                </Button>
              </motion.div>
            )}

            {/* KYC Alert */}
            <motion.div
              className="w-full bg-gradient-to-r from-amber-100 to-yellow-100 text-yellow-800 mb-3 sm:mb-4 py-2 px-3 rounded-lg sm:rounded-xl flex items-center text-xs"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CircleAlert className="h-3.5 w-3.5 mr-2 text-amber-600 flex-shrink-0" />
              <span className="flex-grow text-xs sm:text-sm">Add KYC</span>
              <Link
                href="/kyc/onboarding/investor-type"
                onClick={() => setIsOpen(false)}
                className="text-amber-700 font-medium hover:text-amber-800 transition-colors whitespace-nowrap ml-2 text-xs sm:text-sm"
              >
                Go Here
              </Link>
            </motion.div>

            {/* Wallet Card */}
            <motion.div
              className="bg-gradient-to-b from-[#002235] to-[#001824] text-white border border-[#003553]/30 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Decorative elements */}
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-xl"></div>
              <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-gradient-to-tr from-indigo-500/10 to-blue-500/5 rounded-full blur-xl"></div>

              {/* User Display Name Component */}
              <motion.div
                className="flex items-center mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="w-full bg-gradient-to-r from-[#002438] to-[#001824] border border-[#003553]/50 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-300" onClick={() => setIsProfileEditOpen(true)}>
                  {/* Subtle background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mr-2 sm:mr-3">
                    <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400"  />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    {user?.username || user?.first_name || user?.last_name ? (
                      <>
                        <p className="text-xs text-blue-400 font-medium">
                          {user?.username ? `@${user.username}` : ''}
                        </p>
                        <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent truncate">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.first_name || user?.last_name || 'Anonymous User'}
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <p className="text-xs sm:text-sm font-medium text-white/80">
                          Set up your profile
                        </p>
                        <p className="text-xs text-blue-400/70">
                          Add your name or username
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full hover:bg-[#002E47]/60 ml-1"
                    onClick={() => setIsProfileEditOpen(true)}
                  >
                    <UserCog className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                </div>
              </motion.div>

              {/* Address bar */}
              <div className="flex justify-between items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                <div className="flex items-center bg-[#001824]/80 border border-[#003553]/40 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex-1 backdrop-blur-sm">
                  <span role="img" aria-label="fox" className="mr-1.5 sm:mr-2 text-sm sm:text-base">
                    🦊
                  </span>
                  <span className="text-xs sm:text-sm text-white/90 font-medium truncate max-w-[100px] sm:max-w-[130px] md:max-w-[180px]">
                    {formatAddress(address)}
                  </span>
                </div>

                <div className="flex gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60"
                    onClick={gotoUser}
                  >
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-[#001824]/80 border border-[#003553]/40 hover:bg-[#002E47]/60 touch-action-manipulation"
                    onClick={() => {
                      console.log("Logout triggered");
                      logout();
                      setIsOpen(false);
                    }}
                    aria-label="Logout"
                    role="button"
                    tabIndex={0}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-blue-400 sm:w-4 sm:h-4"
                    >
                      <path
                        d="M17.707 8.464L20.535 11.293C20.723 11.481 20.827 11.735 20.827 12C20.827 12.265 20.723 12.52 20.535 12.707L17.707 15.536C17.519 15.724 17.265 15.829 17 15.829C16.735 15.829 16.48 15.723 16.293 15.536C16.105 15.348 16 15.093 16 14.828C16 14.563 16.105 14.309 16.293 14.121L17.414 13H12C11.735 13 11.48 12.895 11.293 12.707C11.105 12.52 11 12.265 11 12C11 11.735 11.105 11.48 11.293 11.293C11.48 11.105 11.735 11 12 11H17.414L16.293 9.879C16.105 9.691 16 9.437 16 9.172C16 8.907 16.105 8.652 16.293 8.465C16.48 8.277 16.734 8.171 17 8.171C17.265 8.171 17.519 8.276 17.707 8.464Z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 3C12.255 3 12.5 3.098 12.685 3.273C12.871 3.448 12.982 3.687 12.997 3.941C13.012 4.196 12.929 4.446 12.766 4.642C12.602 4.837 12.37 4.963 12.117 4.993L12 5H7C6.755 5 6.519 5.09 6.336 5.253C6.153 5.415 6.036 5.64 6.007 5.883L6 6V18C6 18.245 6.09 18.481 6.253 18.664C6.415 18.847 6.64 18.964 6.883 18.993L7 19H11.5C11.755 19 12 19.098 12.185 19.273C12.371 19.448 12.482 19.687 12.497 19.941C12.512 20.196 12.429 20.446 12.266 20.642C12.102 20.837 11.87 20.963 11.617 20.993L11.5 21H7C6.235 21 5.498 20.708 4.942 20.183C4.385 19.658 4.05 18.94 4.005 18.176L4 18V6C4 5.235 4.292 4.498 4.817 3.942C5.342 3.385 6.06 3.05 6.824 3.005L7 3H12Z"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm text-white/60 mb-0.5 sm:mb-1">Balance</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {fromWei(balance?.data?.value ?? 0n).toFixed(4) || "0"} {balance?.data?.symbol || "ETH"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 sm:gap-1.5 md:gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-8 sm:h-9 md:h-10 text-xs sm:text-sm shadow-md shadow-blue-800/10 transition-all duration-300"
                  onClick={() => {
                    router.push('swap?tab=buy');
                    setIsOpen(false);
                  }}
                >
                  <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Buy</span>
                  <span className="sm:hidden">Buy</span>
                </Button>
                <Button
                  className="flex-1 bg-[#001A26] hover:bg-[#002235] text-white border border-[#003553]/50 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                  onClick={() => setIsReceiveOpen(true)}
                >
                  <ArrowDownLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Receive</span>
                  <span className="sm:hidden">Get</span>
                </Button>
                <Button
                  className="flex-1 bg-[#001A26] hover:bg-[#002235] text-white/50 border border-[#003553]/50 h-8 sm:h-9 md:h-10 text-xs sm:text-sm cursor-not-allowed"
                  disabled
                >
                  <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="relative flex-shrink-0">
            {/* Tab Headers */}
            <div className="border-b border-[#003553]/50 relative">
              <motion.div
                className="absolute bottom-0 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400"
                style={{
                  width: "33.333%",
                  left: activeTab === "assets" ? "0%" : activeTab === "history" ? "33.333%" : "66.666%",
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="flex w-full">
                <button
                  onClick={() => setActiveTab("assets")}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 text-center transition-colors text-xs sm:text-sm md:text-base font-medium ${
                    activeTab === "assets"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Assets
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 text-center transition-colors text-xs sm:text-sm md:text-base font-medium ${
                    activeTab === "history"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 text-center transition-colors text-xs sm:text-sm md:text-base font-medium ${
                    activeTab === "transactions"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Transactions
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[30vh] sm:max-h-[35vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "assets" ? (
                  <motion.div
                    key="assets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 md:space-y-3"
                  >
                    {/* ZFI Token */}
                    <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-[#001824]/80 border border-[#003553]/30 hover:border-[#0066A1]/40 transition-all duration-200 hover:shadow-sm hover:shadow-[#0066A1]/10">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-[#001520] border border-[#003553]/50 flex items-center justify-center">
                          {ZfiIcon ? <ZfiIcon /> : <SwarmIcon />}
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-xs sm:text-sm md:text-base">Zybra Finance Token</h3>
                          <p className="text-xs text-zinc-500">
                            {zfi_balance?.toString() ?? "10"} ZFI · All networks
                          </p>
                        </div>
                      </div>
                      <div className="text-white font-medium text-xs sm:text-sm md:text-base">
                        {zfi_balance?.toString() ?? "10"}
                      </div>
                    </div>

                    {/* Other Assets */}
                    {totalList &&
                      totalList.map((token, index) => {
                        const Symbol = useStockIcon(token.symbol);

                        // Format balance based on token decimals
                        const formatTokenBalance = (balance: string | number, decimals: number) => {
                          if (!balance || balance === 0) return "0";
                          const balanceStr = balance.toString();
                          const divisor = Math.pow(10, decimals);
                          const formatted = (Number(balanceStr) / divisor).toFixed(decimals === 6 ? 2 : 4);
                          return parseFloat(formatted).toString();
                        };

                        const rawBalance = typeof balances === 'object' ? balances[token.address] ?? 0 : 0;
                        const tokenBalance = formatTokenBalance(rawBalance, token.decimals || 18);

                        return (
                          <motion.div
                            key={`${token.symbol}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: { delay: 0.05 * (index + 1) }
                            }}
                            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#001824]/80 border border-[#003553]/30 hover:border-[#0066A1]/40 transition-all duration-200 hover:shadow-sm hover:shadow-[#0066A1]/10"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#001520] border border-[#003553]/50 flex items-center justify-center">
                                {Symbol ? <Symbol /> : <SwarmIcon />}
                              </div>
                              <div>
                                <h3 className="font-medium text-white text-sm sm:text-base">{token.name}</h3>
                                <p className="text-xs sm:text-sm text-zinc-500">
                                  {tokenBalance} {token.symbol} · {token.networks} network{token.networks !== "1" ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-white font-medium text-sm sm:text-base">
                              {tokenBalance}
                            </div>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                ) : activeTab === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 md:space-y-3"
                  >
                    {isLoadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                          {/* Outer ring */}
                          <motion.div
                            className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-blue-500/20 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                          {/* Inner ring */}
                          <motion.div
                            className="absolute inset-2 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          {/* Center dot */}
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          </motion.div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium text-sm sm:text-base mb-1">Loading Activity</p>
                          <p className="text-zinc-500 text-xs sm:text-sm">Fetching your history...</p>
                        </div>
                      </div>
                    ) : historyItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                          {/* Empty state illustration */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#002235] to-[#001824] border border-[#003553]/50 flex items-center justify-center relative overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />

                            {/* Icon */}
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>

                            {/* Floating dots */}
                            <motion.div
                              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400/30 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                delay: 0
                              }}
                            />
                            <motion.div
                              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-400/30 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                delay: 1
                              }}
                            />
                          </div>
                        </div>

                        <div className="text-center max-w-xs">
                          <h3 className="text-white font-medium text-sm sm:text-base mb-2">No Activity Yet</h3>
                          <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                            Complete quests, earn points, and refer friends to see your activity history here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      historyItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: 0.05 * index }
                          }}
                          className="group relative overflow-hidden"
                        >
                          {/* Background gradient */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#001824]/60 via-[#002235]/40 to-[#001824]/60 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Border gradient */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#003553]/30 via-[#0066A1]/20 to-[#003553]/30 p-[1px] group-hover:from-[#0066A1]/50 group-hover:via-[#00A3E0]/30 group-hover:to-[#0066A1]/50 transition-all duration-300">
                            <div className="w-full h-full bg-[#001824]/90 rounded-xl" />
                          </div>

                          {/* Content */}
                          <div className="relative flex items-center justify-between p-3 sm:p-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              {/* Icon with enhanced styling */}
                              <div className="relative">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative overflow-hidden ${
                                  item.type === 'quest' ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20' :
                                  item.type === 'points' ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20' :
                                  'bg-gradient-to-br from-blue-500/20 to-cyan-600/20'
                                }`}>
                                  {/* Icon background glow */}
                                  <div className={`absolute inset-0 rounded-full blur-sm ${
                                    item.type === 'quest' ? 'bg-yellow-400/10' :
                                    item.type === 'points' ? 'bg-green-400/10' :
                                    'bg-blue-400/10'
                                  }`} />

                                  {item.type === 'quest' && (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {item.type === 'points' && (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {item.type === 'referral' && (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                  )}
                                </div>

                                {/* Status indicator dot */}
                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#001824] ${
                                  item.status === 'completed' ? 'bg-green-400' :
                                  item.status === 'claimed' ? 'bg-blue-400' :
                                  'bg-yellow-400'
                                }`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-white text-sm sm:text-base bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    {item.title}
                                  </h3>

                                  {/* Points Badge */}
                                  {item.points && (
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                                      item.points > 0
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        {item.points > 0 ? (
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                        ) : (
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                        )}
                                      </svg>
                                      <span className="font-medium text-xs">
                                        {item.points > 0 ? '+' : ''}{item.points}
                                      </span>
                                    </div>
                                  )}

                                  {/* Badge Achievement Indicator */}
                                  {item.metadata?.badge_earned && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                      {getHistoryBadgeImage(item.metadata.badge_earned) ? (
                                        <img
                                          src={getHistoryBadgeImage(item.metadata.badge_earned)!}
                                          alt="Badge"
                                          className="w-4 h-4"
                                        />
                                      ) : (
                                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <span className="text-yellow-400 font-medium text-xs">Badge</span>
                                    </div>
                                  )}

                                  {/* Milestone Indicator */}
                                  {item.metadata?.is_milestone && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                                      <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-purple-400 font-medium text-xs">Milestone</span>
                                    </div>
                                  )}

                                  {/* Streak Indicator */}
                                  {item.metadata?.streak_info && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                      <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-orange-400 font-medium text-xs">Streak</span>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-2">
                                  {item.description}
                                </p>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-zinc-500">{formatTimeAgo(item.timestamp)}</span>
                                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    item.status === 'completed' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                                    item.status === 'claimed' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                                    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                                  }`}>
                                    {item.status === 'completed' ? 'Completed' :
                                     item.status === 'claimed' ? 'Claimed' : 'Pending'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right side arrow */}
                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="transactions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 md:space-y-3"
                  >
                    {isLoadingTransactions ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                          {/* Outer ring */}
                          <motion.div
                            className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-blue-500/20 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                          {/* Inner ring */}
                          <motion.div
                            className="absolute inset-2 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          {/* Center dot */}
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          </motion.div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium text-sm sm:text-base mb-1">Loading Transactions</p>
                          <p className="text-zinc-500 text-xs sm:text-sm">Fetching your transaction history...</p>
                        </div>
                      </div>
                    ) : transactionItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                          {/* Empty state illustration */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#002235] to-[#001824] border border-[#003553]/50 flex items-center justify-center relative overflow-hidden">
                            {/* Background pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />

                            {/* Icon */}
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>

                            {/* Floating dots */}
                            <motion.div
                              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400/30 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                delay: 0
                              }}
                            />
                            <motion.div
                              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-400/30 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.8, 0.3]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                delay: 1
                              }}
                            />
                          </div>
                        </div>

                        <div className="text-center max-w-xs">
                          <h3 className="text-white font-medium text-sm sm:text-base mb-2">No Transactions Yet</h3>
                          <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                            Start trading, lending, or staking to see your transaction history here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      transactionItems.map((transaction, index) => (
                        <TransactionCard key={transaction.tx_hash || `tx-${index}`} transaction={transaction} index={index} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Crypto Modal */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-3 sm:p-4 md:p-5 bg-[#001A26] border border-[#0A3655]/30 rounded-xl shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
            <h2 className="text-sm sm:text-base md:text-lg font-medium text-white">
              Receive Crypto
            </h2>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsReceiveOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>

          <AnimatePresence>
            {copySuccess && (
              <motion.div
                className="absolute top-16 right-5 bg-[#002E47] text-white text-xs py-1 px-3 rounded-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Copied!
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!showQRCode ? (
              <motion.div
                key="receive-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Fund your wallet by transferring crypto from another wallet or account.
                </p>

                <div className="bg-[#001A26] rounded-xl p-2.5 sm:p-3 border border-[#003553]/40 w-full h-12 sm:h-14 flex items-center">
                  <div className="flex items-center w-full max-w-full">
                    <div className="flex items-center flex-1 min-w-0 mr-1 sm:mr-2">
                      <span className="text-green-400 flex-shrink-0 mr-1.5 sm:mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-4 sm:h-4">
                          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="currentColor" opacity="0.2" />
                          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="currentColor" />
                        </svg>
                      </span>
                      <span className="text-xs sm:text-sm text-white font-medium truncate block max-w-[150px] sm:max-w-[230px]">
                        {address}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-[#002E47]/60"
                        onClick={handleCopyAddress}
                      >
                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-[#002E47]/60"
                        onClick={() => setShowQRCode(true)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400 sm:w-4 sm:h-4">
                          <path d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" fill="currentColor" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
                  <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                    <span className="text-blue-400 mr-2">Tip:</span>
                    Make sure you&apos;re sending assets on the correct network to avoid loss of funds.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="qr-code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center py-3 sm:py-5 space-y-4 sm:space-y-6"
              >
                <div className="p-3 sm:p-4 bg-white rounded-xl shadow-lg relative">
                  {/* Decorative elements for QR code */}
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-xl blur-sm -z-10"></div>
                  <QRCodeCanvas
                    value={address || ""}
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : window.innerWidth < 768 ? 160 : 200}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    className="rounded-lg"
                    level="H"
                  />
                </div>

                <div className="w-full">
                  <div className="bg-[#001A26] rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 border border-[#003553]/40 w-full overflow-hidden">
                    <p className="text-[10px] sm:text-xs text-white/90 text-center font-medium break-all max-w-full">
                      {address}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-400 text-center mb-4 sm:mb-5">
                    Scan this code with a wallet app to send tokens to this address
                  </p>

                  <Button
                    variant="outline"
                    className="text-gray-400 hover:text-white hover:bg-[#002E47]/60 border-[#003553]/50 mx-auto flex items-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200"
                    onClick={() => setShowQRCode(false)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    Back
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent className="w-[95vw] max-w-[420px] p-3 sm:p-4 md:p-5 bg-gradient-to-b from-[#001C29] to-[#00141d] border border-[#0A3655]/30 rounded-xl shadow-[0_0_25px_rgba(0,102,161,0.15)] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
            <h2 className="text-sm sm:text-base md:text-lg font-medium text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {user?.username ? 'Edit Profile' : 'Set Up Your Profile'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-[#002E47]/60 text-white/60 hover:text-white"
              onClick={() => setIsProfileEditOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-xs sm:text-sm text-white/80">Username</Label>
                {formErrors.username && (
                  <span className="text-red-400 text-xs">{formErrors.username}</span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  value={profileFormData.username}
                  onChange={handleProfileInputChange}
                  placeholder="Choose a unique username"
                  className={`bg-[#001824]/80 border ${formErrors.username ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                  disabled={isSubmitting}
                />
                <AtSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              </div>
            </div>

            {/* First Name Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="first_name" className="text-xs sm:text-sm text-white/80">First Name</Label>
                {formErrors.first_name && (
                  <span className="text-red-400 text-xs">{formErrors.first_name}</span>
                )}
              </div>
              <Input
                id="first_name"
                name="first_name"
                value={profileFormData.first_name}
                onChange={handleProfileInputChange}
                placeholder="Enter your first name"
                className={`bg-[#001824]/80 border ${formErrors.first_name ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                disabled={isSubmitting}
              />
            </div>

            {/* Last Name Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="last_name" className="text-xs sm:text-sm text-white/80">Last Name</Label>
                {formErrors.last_name && (
                  <span className="text-red-400 text-xs">{formErrors.last_name}</span>
                )}
              </div>
              <Input
                id="last_name"
                name="last_name"
                value={profileFormData.last_name}
                onChange={handleProfileInputChange}
                placeholder="Enter your last name"
                className={`bg-[#001824]/80 border ${formErrors.last_name ? 'border-red-400/70' : 'border-[#003553]/40'} text-white placeholder:text-gray-500 h-9 sm:h-10 text-xs sm:text-sm`}
                disabled={isSubmitting}
              />
            </div>

            {/* Info banner */}
            <div className="bg-[#001824]/60 rounded-xl p-3 sm:p-4 border border-[#003553]/30">
              <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                <span className="text-blue-400 mr-2">Note:</span>
                Setting up your profile helps us personalize your experience and allows others to recognize you in the Zybra ecosystem.
              </p>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-600 hover:to-cyan-600 text-white border-0 h-9 sm:h-10 text-xs sm:text-sm shadow-md shadow-blue-800/10 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {user?.username ? 'Update Profile' : 'Save Profile'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Account Modal */}
      <ExportAccountModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
}