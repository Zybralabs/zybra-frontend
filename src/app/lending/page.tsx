"use client";

import { useState, useEffect, type FC, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserAccount } from "@/context/UserAccountContext";
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SupportedChainId, LENDING_POOL_ADDRESS, ZFI, USDC_ADDRESS, ZrUSD } from "@/constant/addresses";
import { useRouter } from "next/navigation";
import { readContract } from '@wagmi/core';
import { ErrorModal, SuccessModal } from "@/components/Modal";
import ZybraLogoLoader from "@/components/ZybraLogoLoader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LendingPoolABI from "@/abis/LendingPoolABI.json";
import ERC20ABI from "@/abis/ERC20.json";
import { wagmiConfig } from "@/wagmi";
import { Input } from "@/components/Swap-new/components/input";
import { formatUnits, parseUnits } from "viem";
import { BigNumber } from "@ethersproject/bignumber";
import { WalletType } from "@/constant/account/enum";
import { useApproveCallback, ApprovalState } from "@/hooks/useApproveCallback";
import { fromWei, toWei } from "@/hooks/formatting";
import { useLendingPoolData, getHealthFactorRisk, calculateHealthFactorAfterBorrow, type UserAccountData, type ProcessedAssetData, type AssetInfo } from "@/hooks/useLending";
import { useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { HealthFactorDisplay, HealthFactorBar, HealthFactorPreview } from "@/components/HealthFactor";
import { useLendingTransactions, type LendingAsset } from "@/hooks/useLendingTransactions";
import { TrendingUp, TrendingDown, DollarSign, Shield, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import FundingHelper from "@/components/AccountKit/FundingHelper";
import { LendingMetricsCard } from "@/components/LendingMetrics/LendingMetricsCards";

// Sample assets data with tokenAddresses added
const initialAssets: AssetInfo[] = [
  {
    id: "usdx",
    name: "USDX",
    symbol: "USDX",
    description: "Zybra stablecoin for trading, borrowing and everyday transactions",
    icon: "UX",
    iconBg: "bg-green-600",
    supplyAPY: 3.2,
    borrowAPY: 4.5,
    totalSupply: 1500000,
    totalBorrowed: 875000,
    collateralFactor: 0.8,
    decimals: 6,
    tokenAddress: USDC_ADDRESS[SupportedChainId.Testnet] as `0x${string}`
  },
  {
    id: "zrusd",
    name: "ZrUSD",
    symbol: "ZrUSD",
    description: "ZrUSD for yield generation and liquidity provision",
    icon: "ZR",
    iconBg: "bg-purple-600",
    supplyAPY: 4.8,
    borrowAPY: 5.9,
    totalSupply: 980000,
    totalBorrowed: 650000,
    collateralFactor: 0.75,
    decimals: 18,
    tokenAddress: ZrUSD[SupportedChainId.Testnet] as `0x${string}`
  },
  {
    id: "zfi",
    name: "ZFI",
    symbol: "ZFI",
    description: "Zybra Finance native governance token with staking rewards",
    icon: "ZF",
    iconBg: "bg-blue-600",
    supplyAPY: 6.5,
    borrowAPY: 8.2,
    totalSupply: 750000,
    totalBorrowed: 420000,
    collateralFactor: 0.65,
    decimals: 18,
    tokenAddress: ZFI[SupportedChainId.Testnet] as `0x${string}`
  },
];

// Asset Card Component
const AssetCard: FC<{
  asset: ProcessedAssetData;
  action: "supply" | "borrow";
  onAction: (asset: ProcessedAssetData, amount: string) => void;
  isLoading: boolean;
  approvalState?: ApprovalState;
  onApprove?: () => void;
  approvalLoading?: boolean;
  index: number;
  userBalance?: number;
  userAccountData?: UserAccountData | null;
  calculateHealthFactorAfterBorrow?: (additionalBorrowUSD: number) => number;
}> = ({
  asset,
  action,
  onAction,
  isLoading,
  approvalState,
  onApprove,
  approvalLoading,
  index,
  userBalance,
  userAccountData,
  calculateHealthFactorAfterBorrow
}) => {
  const [amount, setAmount] = useState<string>("");
  const isSupply = action === "supply";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      // Safety check for borrow actions
      if (!isSupply && userAccountData && calculateHealthFactorAfterBorrow) {
        const newHealthFactor = calculateHealthFactorAfterBorrow(parseFloat(amount));

        if (newHealthFactor < 1.05) { // 5% safety margin above liquidation
          // Don't proceed with the borrow
          return;
        }
      }

      onAction(asset, amount);
      setAmount("");
    }
  };

  // For supply, we use the user's token balance
  // For borrow, we use the available pool liquidity
  const maxAvailable = isSupply
    ? userBalance || 0
    : asset.availableLiquidity;

  // Check if borrow would result in unsafe Health Factor
  const wouldBeUnsafe = !isSupply && userAccountData && amount && parseFloat(amount) > 0 && calculateHealthFactorAfterBorrow
    ? calculateHealthFactorAfterBorrow(parseFloat(amount)) < 1.05
    : false;

  // Determine if approval is needed for supply
  const needsApproval = isSupply &&
    approvalState !== undefined &&
    approvalState !== ApprovalState.APPROVED &&
    parseFloat(amount) > 0;

  return (
    <motion.div
      className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)] hover:shadow-[0_0_35px_rgba(0,100,160,0.25)] transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${asset.iconBg} flex items-center justify-center text-xs font-bold shadow-lg`}>
            {asset.icon}
          </div>
          <span className="font-semibold text-md">{asset.name}</span>
        </div>
        <div className="text-sm px-2.5 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="font-medium text-xs">Testnet</span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-gray-400 text-sm mb-4 h-12 line-clamp-2">
          {asset.description}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-[#00233A] to-[#001E30] rounded-lg p-3 border border-[#003354]/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 z-0"></div>
            <div className="relative ">
              <div className="text-gray-400 text-xs mb-1">{isSupply ? "Supply APY" : "Borrow APY"}</div>
              <div className="text-xl font-medium flex items-center gap-1.5">
                {isSupply ? asset.supplyAPYCalculated.toFixed(2) : asset.borrowAPYCalculated.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#00233A] to-[#001E30] rounded-lg p-3 border border-[#003354]/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 z-0"></div>
            <div className="relative ">
              <div className="text-gray-400 text-xs mb-1">{isSupply ? "Your Supply" : "Your Borrow"}</div>
              <div className="text-xl font-medium flex items-center gap-1.5">
                {isSupply
                  ? asset.userSupplied.toLocaleString(undefined, {maximumFractionDigits: asset.decimals === 6 ? 2 : 4})
                  : asset.userBorrowed.toLocaleString(undefined, {maximumFractionDigits: asset.decimals === 6 ? 2 : 4})}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#001A26] rounded-lg p-3 border border-[#003354]/60 mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-xs">
              {isSupply ? "Total Supplied" : "Total Borrowed"}
            </span>
            <span className="text-gray-300 text-xs">
              {isSupply
                ? asset.contractTotalSupply.toLocaleString()
                : asset.contractTotalBorrowed.toLocaleString()} {asset.symbol}
            </span>
          </div>
          <div className="w-full bg-[#001525] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${isSupply ? "bg-blue-500" : "bg-purple-500"}`}
              style={{ width: `${asset.utilizationRate * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="relative">
              <Input
                type="number"
                placeholder={`Amount to ${isSupply ? 'supply' : 'borrow'}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#001A26] border-[#003354] w-full py-2 px-3 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs cursor-pointer hover:text-blue-300"
                onClick={() => setAmount(maxAvailable.toString())}
              >
                MAX
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex justify-between">
              <span>Available: {maxAvailable.toLocaleString(undefined, {maximumFractionDigits: asset.decimals === 6 ? 2 : 4})} {asset.symbol}</span>
              {isSupply && <span>Collateral Factor: {(asset.contractCollateralFactor * 100).toFixed()}%</span>}
            </div>
          </div>

          {/* Health Factor Preview for Borrow */}
          {!isSupply && userAccountData && amount && parseFloat(amount) > 0 && calculateHealthFactorAfterBorrow && (
            <div className="mt-4">
              <HealthFactorPreview
                currentHealthFactor={userAccountData.healthFactor}
                currentCollateral={userAccountData.totalCollateralBalanceUSD}
                currentBorrows={userAccountData.totalBorrowBalanceUSD}
                additionalBorrowValue={parseFloat(amount)} // Assuming USD value for simplicity
                className="text-xs"
              />
            </div>
          )}

          {needsApproval ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onApprove) onApprove();
                }}
                className="w-full py-4 px-6 font-medium text-white rounded-xl transition-all duration-300
                  bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/30"
                disabled={approvalLoading || approvalState === ApprovalState.PENDING}
              >
                {approvalLoading || approvalState === ApprovalState.PENDING ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Approving...</span>
                  </div>
                ) : (
                  <>
                    <span>Approve {asset.symbol}</span>
                    <span className="ml-2">→</span>
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="submit"
                className={`w-full py-4 px-6 font-medium text-white rounded-xl transition-all duration-300
                  ${isSupply
                    ? "bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 shadow-lg shadow-blue-500/30"
                    : wouldBeUnsafe
                      ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30"
                      : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/30"
                  }`}
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAvailable || wouldBeUnsafe}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : wouldBeUnsafe ? (
                  <>
                    <span>⚠️ Unsafe Health Factor</span>
                  </>
                ) : (
                  <>
                    <span>{isSupply ? "Supply" : "Borrow"}</span>
                    <span className="ml-2">→</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

// Analytics Card Component
const AnalyticsCard: FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}> = ({ title, value, subtitle, icon, bgColor }) => {
  return (
    <motion.div
      className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-5 flex items-start gap-4">
        <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1">{title}</div>
          <div className="text-2xl font-medium text-white mb-1">{value}</div>
          <div className="text-gray-500 text-xs">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const LendingAndBorrowing: FC = () => {
  // ===== ALL STATE HOOKS FIRST =====
  const [activeTab, setActiveTab] = useState<string>("supply");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingAsset, setProcessingAsset] = useState<string | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string; txHash?: string } | null>(null);
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // For approval state management
  const [approvalStates, setApprovalStates] = useState<Record<string, ApprovalState>>({});
  const [approvalLoadingStates, setApprovalLoadingStates] = useState<Record<string, boolean>>({});
  const [pendingApprovals, setPendingApprovals] = useState<Set<string>>(new Set());

  // Transaction history and confirmation states
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    type: string;
    asset: string;
    amount: string;
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
    txHash?: string;
  }>>([]);
  const [showConfirmation, setShowConfirmation] = useState<{
    show: boolean;
    asset?: ProcessedAssetData;
    amount?: string;
    type?: 'supply' | 'borrow' | 'repay' | 'withdraw';
  }>({ show: false });
  const [batchTransactions, setBatchTransactions] = useState<Array<{
    asset: ProcessedAssetData;
    amount: string;
    type: 'supply' | 'borrow' | 'repay' | 'withdraw';
  }>>([]);
  const [approvalCache, setApprovalCache] = useState<Record<string, ApprovalState>>({});

  // ===== ALL CONTEXT HOOKS SECOND =====
  const { address: userAddress, walletType } = useUserAccount();
  const chainId = useChainId();
  const router = useRouter();

  // ===== ALL CUSTOM HOOKS THIRD =====
  const {
    supply,
    borrow,
    repay,
    withdraw,
    approve,
    loading: transactionLoading,
    error: transactionError,
    receipt,
    setError: setTransactionError,
  } = useLendingTransactions();

  // Use the new merged hook
  const {
    assetData,
    userAccountData,
    isLoading: isLoadingPoolData,
    error: poolDataError,
    calculateHealthFactorAfterBorrow,
    getHealthFactorRisk: getHealthFactorRiskFromHook
  } = useLendingPoolData(initialAssets);

  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending,
    isError: isWriteError,
  } = useWriteContract();

  // ===== ALL MEMOIZED VALUES FOURTH =====
  const processedAssetData = useMemo(() => assetData || [], [assetData]);

  const tokenAddresses = useMemo(() =>
    initialAssets.map(asset => asset.tokenAddress),
    [] // Empty dependency array since initialAssets is static
  );

  // ===== ALL REMAINING HOOKS FIFTH =====
  const [tokenBalances, isLoadingTokenBalances] = useTokenBalancess(
    tokenAddresses,
    userAddress
  );

  // ===== ALL CALLBACK FUNCTIONS SIXTH =====
  // Get user token balance from tokenBalances hook data
  const getUserTokenBalance = useCallback((asset: ProcessedAssetData): number => {
    if (!tokenBalances || !asset || !asset.tokenAddress) return 0;

    const balance = (tokenBalances as { [tokenAddress: string]: string })[asset.tokenAddress] || "0";
    return fromWei(balance, asset.decimals);
  }, [tokenBalances]);

  // Convert ProcessedAssetData to LendingAsset
  const convertToLendingAsset = useCallback((asset: ProcessedAssetData): LendingAsset => ({
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    tokenAddress: asset.tokenAddress,
    decimals: asset.decimals,
  }), []);

  // Enhanced approval handler with proper state management
  const handleApproveToken = useCallback(async (asset: ProcessedAssetData, amount: string) => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    const assetKey = asset.id;

    // Set loading state for this specific asset
    setApprovalLoadingStates(prev => ({ ...prev, [assetKey]: true }));
    setApprovalStates(prev => ({ ...prev, [assetKey]: ApprovalState.PENDING }));

    try {
      const lendingAsset = convertToLendingAsset(asset);
      const result = await approve(lendingAsset, amount);

      if (result.success) {
        // Update approval state to approved
        setApprovalStates(prev => ({ ...prev, [assetKey]: ApprovalState.APPROVED }));

        setSuccess({
          title: "Approval Successful",
          message: `Successfully approved ${asset.symbol} for lending pool. You can now supply tokens.`,
          txHash: result.txHash,
        });
      }
    } catch (err) {
      console.error("Error approving token:", err);

      // Reset approval state on error
      setApprovalStates(prev => ({ ...prev, [assetKey]: ApprovalState.NOT_APPROVED }));

      let errorMessage = "Failed to approve token for lending pool. Please try again.";
      let showFunding = false;

      if (err instanceof Error) {
        if (err.message.includes("needs ETH for gas fees") ||
            err.message.includes("Send Base Sepolia ETH to:")) {
          // Show funding helper for Account Kit gas issues
          showFunding = true;
          errorMessage = err.message;
        } else if (err.message.includes("user rejected") || err.message.includes("rejected by user")) {
          errorMessage = "Approval was rejected by user.";
        } else {
          errorMessage = err.message;
        }
      }

      if (showFunding) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Approval Failed",
          message: errorMessage
        });
      }
    } finally {
      setApprovalLoadingStates(prev => ({ ...prev, [assetKey]: false }));
    }
  }, [userAddress, router, approve, convertToLendingAsset]);

  // Get approval state for a specific asset
  const getApprovalState = useCallback((asset: ProcessedAssetData): ApprovalState => {
    return approvalStates[asset.id] || ApprovalState.UNKNOWN;
  }, [approvalStates]);

  // Get approval loading state for a specific asset
  const getApprovalLoading = useCallback((asset: ProcessedAssetData): boolean => {
    return approvalLoadingStates[asset.id] || false;
  }, [approvalLoadingStates]);

  const showTransactionConfirmation = useCallback((
    asset: ProcessedAssetData,
    amount: string,
    type: 'supply' | 'borrow' | 'repay' | 'withdraw'
  ) => {
    setShowConfirmation({ show: true, asset, amount, type });
  }, [setShowConfirmation]);

  // Handle supply using the new hook
  const handleSupply = useCallback(async (asset: ProcessedAssetData, amount: string) => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    // Check if user has enough balance
    const userBalance = getUserTokenBalance(asset);
    if (userBalance < parseFloat(amount)) {
      setError({
        title: "Insufficient Balance",
        message: `You don't have enough ${asset.symbol} to complete this action.`
      });
      return;
    }

    setIsLoading(true);
    setProcessingAsset(asset.id);

    try {
      const lendingAsset = convertToLendingAsset(asset);
      const result = await supply(lendingAsset, amount);

      if (result.success) {
        setSuccess({
          title: "Supply Successful",
          message: `Successfully supplied ${amount} ${asset.symbol} to the lending pool.`,
          txHash: result.txHash,
        });
      }
    } catch (err) {
      console.error("Error supplying asset:", err);

      let errorMessage = "Failed to supply assets. Please try again later.";
      let showFunding = false;

      if (err instanceof Error) {
        if (err.message.includes("needs ETH for gas fees") ||
            err.message.includes("Send Base Sepolia ETH to:")) {
          // Show funding helper for Account Kit gas issues
          showFunding = true;
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      if (showFunding) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Supply Failed",
          message: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
      setProcessingAsset(null);
    }
  }, [userAddress, router, supply, convertToLendingAsset, getUserTokenBalance]);

  // Handle borrow using the new hook
  const handleBorrow = useCallback(async (asset: ProcessedAssetData, amount: string) => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    setIsLoading(true);
    setProcessingAsset(asset.id);

    try {
      const lendingAsset = convertToLendingAsset(asset);
      const result = await borrow(lendingAsset, amount);

      if (result.success) {
        setSuccess({
          title: "Borrow Successful",
          message: `Successfully borrowed ${amount} ${asset.symbol} from the lending pool.`,
          txHash: result.txHash,
        });
      }
    } catch (err) {
      console.error("Error borrowing asset:", err);

      let errorMessage = "Failed to borrow assets. Please try again later.";
      let showFunding = false;

      if (err instanceof Error) {
        if (err.message.includes("needs ETH for gas fees") ||
            err.message.includes("Send Base Sepolia ETH to:")) {
          // Show funding helper for Account Kit gas issues
          showFunding = true;
          errorMessage = err.message;
        } else if (err.message.includes("account is not healthy")) {
          errorMessage = "Your account doesn't have enough collateral for this borrow amount.";
        } else if (err.message.includes("amount is more than available liquidity")) {
          errorMessage = "Not enough liquidity available in the pool to fulfill this borrow request.";
        } else {
          errorMessage = err.message;
        }
      }

      if (showFunding) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Borrow Failed",
          message: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
      setProcessingAsset(null);
    }
  }, [userAddress, router, borrow, convertToLendingAsset]);

  // Handle repay using the new hook
  const handleRepay = useCallback(async (asset: ProcessedAssetData, amount: string) => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    // Check balance
    const userBalance = getUserTokenBalance(asset);
    if (userBalance < parseFloat(amount)) {
      setError({
        title: "Insufficient Balance",
        message: `You don't have enough ${asset.symbol} to complete this action.`
      });
      return;
    }

    setIsLoading(true);
    setProcessingAsset(asset.id);

    try {
      const lendingAsset = convertToLendingAsset(asset);
      const result = await repay(lendingAsset, amount);

      if (result.success) {
        setSuccess({
          title: "Repay Successful",
          message: `Successfully repaid ${amount} ${asset.symbol} to the lending pool.`,
          txHash: result.txHash,
        });
      }
    } catch (err) {
      console.error("Error repaying asset:", err);
      setError({
        title: "Repay Failed",
        message: err instanceof Error ? err.message : "Failed to repay assets. Please try again later."
      });
    } finally {
      setIsLoading(false);
      setProcessingAsset(null);
    }
  }, [userAddress, router, repay, convertToLendingAsset, getUserTokenBalance]);

  // Handle withdraw using the new hook
  const handleWithdraw = useCallback(async (asset: ProcessedAssetData, amount: string) => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    setIsLoading(true);
    setProcessingAsset(asset.id);

    try {
      const lendingAsset = convertToLendingAsset(asset);
      const result = await withdraw(lendingAsset, amount);

      if (result.success) {
        setSuccess({
          title: "Withdraw Successful",
          message: `Successfully withdrew ${amount} ${asset.symbol} from the lending pool.`,
          txHash: result.txHash,
        });
      }
    } catch (err) {
      console.error("Error withdrawing asset:", err);

      let errorMessage = "Failed to withdraw assets. Please try again later.";
      if (err instanceof Error) {
        if (err.message.includes("account is not healthy")) {
          errorMessage = "You can't withdraw this amount because it's being used as collateral for your borrows.";
        } else {
          errorMessage = err.message;
        }
      }

      setError({
        title: "Withdraw Failed",
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
      setProcessingAsset(null);
    }
  }, [userAddress, router, withdraw, convertToLendingAsset]);

  // Add this function to handle transaction history
  const addToTransactionHistory = useCallback((tx: {
    type: string;
    asset: string;
    amount: string;
    status: 'pending' | 'success' | 'failed';
    txHash?: string;
  }) => {
    setTransactionHistory(prev => [{
      ...tx,
      timestamp: Date.now(),
    }, ...prev]);
  }, [setTransactionHistory]);

  // Add this function to handle confirmed transactions
  const handleConfirmedTransaction = useCallback(async () => {
    if (!showConfirmation.asset || !showConfirmation.amount || !showConfirmation.type) return;

    const { asset, amount, type } = showConfirmation;
    setShowConfirmation({ show: false });

    // Add to transaction history as pending
    addToTransactionHistory({
      type,
      asset: asset.symbol,
      amount,
      status: 'pending'
    });

    try {
      switch (type) {
        case 'supply':
          await handleSupply(asset, amount);
          break;
        case 'borrow':
          await handleBorrow(asset, amount);
          break;
        case 'repay':
          await handleRepay(asset, amount);
          break;
        case 'withdraw':
          await handleWithdraw(asset, amount);
          break;
      }
    } catch (error) {
      // Update transaction history on failure
      addToTransactionHistory({
        type,
        asset: asset.symbol,
        amount,
        status: 'failed'
      });
    }
  }, [showConfirmation, handleSupply, handleBorrow, handleRepay, handleWithdraw, addToTransactionHistory, setShowConfirmation]);

  // Add this function to handle batched transactions
  const handleBatchTransactions = useCallback(async () => {
    if (batchTransactions.length === 0) return;

    setIsLoading(true);
    const currentBatch = [...batchTransactions];
    setBatchTransactions([]);

    try {
      for (const tx of currentBatch) {
        setProcessingAsset(tx.asset.id);

        // Check approval cache first
        const cacheKey = `${tx.asset.id}-${tx.type}`;
        if (approvalCache[cacheKey] !== ApprovalState.APPROVED) {
          await handleApproveToken(tx.asset, tx.amount);
        }

        // Execute transaction based on type
        switch (tx.type) {
          case 'supply':
            await handleSupply(tx.asset, tx.amount);
            break;
          case 'borrow':
            await handleBorrow(tx.asset, tx.amount);
            break;
          case 'repay':
            await handleRepay(tx.asset, tx.amount);
            break;
          case 'withdraw':
            await handleWithdraw(tx.asset, tx.amount);
            break;
        }
      }
    } catch (error) {
      console.error("Error processing batch transactions:", error);
      setError({
        title: "Batch Transaction Failed",
        message: "One or more transactions in the batch failed. Please try again."
      });
    } finally {
      setIsLoading(false);
      setProcessingAsset(null);
    }
  }, [batchTransactions, approvalCache, handleApproveToken, handleSupply, handleBorrow, handleRepay, handleWithdraw, setBatchTransactions]);

  // Add this effect to process batched transactions
  useEffect(() => {
    if (batchTransactions.length > 0) {
      handleBatchTransactions();
    }
  }, [batchTransactions, handleBatchTransactions]);

  // Modal close handlers
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccess(null);
  }, []);

  // ===== ALL MEMOIZED CALCULATIONS SEVENTH =====
  // Calculate user metrics from the data provided by the merged hook
  const userSuppliedTotal = useMemo(() =>
    processedAssetData.reduce((acc: number, asset: ProcessedAssetData) => acc + asset.userSupplied, 0),
    [processedAssetData]
  );

  const userBorrowedTotal = useMemo(() =>
    processedAssetData.reduce((acc: number, asset: ProcessedAssetData) => acc + asset.userBorrowed, 0),
    [processedAssetData]
  );

  const borrowLimit = useMemo(() =>
    userAccountData?.maxBorrowCapacityUSD || 0,
    [userAccountData]
  );

  const borrowUtilization = useMemo(() =>
    userAccountData?.borrowUtilization || 0,
    [userAccountData]
  );

  const healthFactor = useMemo(() =>
    userAccountData?.healthFactor || Infinity,
    [userAccountData]
  );

  // ===== RENDER =====
  return (
    <div className="flex-1 text-white flex flex-col items-center justify-center py-12 min-h-screen bg-gradient-to-b from-[#001525] to-[#001A20]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full space-y-10 px-4 relative">
        {/* Header with subtle animation */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Lending & Borrowing
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-base">
            Supply assets to earn interest or borrow against your collateral on the Zybra Finance protocol.
          </p>
        </motion.div>

        {/* Network Badge */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-r from-[#00233A] to-[#00314F] rounded-full py-2 px-6 shadow-[0_0_20px_rgba(0,80,140,0.3)] flex items-center gap-3"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
            </div>
            <span className="font-medium">Base Testnet</span>
          </motion.div>
        </div>

        {/* Loading state */}
        {(isLoadingPoolData || isLoadingTokenBalances) && (
          <div className="text-center py-8">
            <ZybraLogoLoader size="md" className="mx-auto mb-4" />
            <p className="text-gray-300">Loading pool data...</p>
          </div>
        )}

        {/* Error state */}
        {poolDataError && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Error loading pool data: {poolDataError}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* Comprehensive Lending Metrics with Health Factor */}
        <LendingMetricsCard
          totalSupplied={userAccountData?.totalLiquidityBalanceUSD || 0}
          totalBorrowed={userAccountData?.totalBorrowBalanceUSD || 0}
          borrowUtilization={borrowUtilization}
          borrowLimit={borrowLimit}
          healthFactor={userAccountData?.healthFactor || Infinity}
          // @ts-ignore
          isLoading={isLoadingPoolData || isLoadingTokenBalances}
          hasUserAddress={!!userAddress}
          hasUserData={!!userAccountData}
        />

        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-[#001A26]/90 backdrop-blur-sm border border-[#003354] rounded-xl p-1.5 shadow-lg flex gap-4">
              <TabsTrigger
                value="supply"
                className={`px-10 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === 'supply'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#00273D]/40'}`}
              >
                Supply
              </TabsTrigger>
              <TabsTrigger
                value="borrow"
                className={`px-10 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === 'borrow'
                  ? 'bg-gradient-to-r from-[#7E22CE] to-[#A855F7] text-white shadow-md shadow-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#00273D]/40'}`}
              >
                Borrow
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="supply" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {!isLoadingPoolData && !isLoadingTokenBalances && processedAssetData.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  action="supply"
                  onAction={handleSupply}
                  isLoading={isLoading && processingAsset === asset.id}
                  approvalState={getApprovalState(asset)}
                  onApprove={() => handleApproveToken(asset, "1000")} // Use a reasonable amount for approval
                  approvalLoading={getApprovalLoading(asset)}
                  index={index}
                  userBalance={getUserTokenBalance(asset)}
                  userAccountData={userAccountData}
                  calculateHealthFactorAfterBorrow={calculateHealthFactorAfterBorrow}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="borrow" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {!isLoadingPoolData && !isLoadingTokenBalances && processedAssetData.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  action="borrow"
                  onAction={handleBorrow}
                  isLoading={isLoading && processingAsset === asset.id}
                  index={index}
                  userAccountData={userAccountData}
                  calculateHealthFactorAfterBorrow={calculateHealthFactorAfterBorrow}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Connection Status */}
        {!userAddress && (
          <motion.div
            className="mt-6 text-center p-6 bg-[#001C29]/70 rounded-xl border border-[#003354]/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-100">Connect your wallet</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                You need to connect your wallet to supply assets, borrow, and interact with the Zybra Finance ecosystem
              </p>
            </div>

            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="bg-gradient-to-r from-[#4BB6EE] to-[#65C7F7] px-8 py-2.5 rounded-lg shadow-[0_0_15px_rgba(75,182,238,0.3)] font-medium"
                onClick={() => router.push("/signup")}
              >
                Connect Wallet
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          className="bg-gradient-to-r from-[#00233A]/50 to-[#001A26]/50 rounded-lg p-5 border border-[#003354]/40 text-sm text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-300 mb-2">About Lending & Borrowing</h3>
              <p className="mb-2">
                Supply your assets to earn interest, or use them as collateral to borrow other assets.
                All operations on the testnet are for demonstration purposes only.
              </p>
              <p>
                Lending rates and collateral factors are determined by the protocol governance.
                If you encounter any issues, please contact our support team on <span className="text-blue-400 hover:underline cursor-pointer">Discord</span>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Protocol Stats from pool data */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40">
            <span className="font-medium">Protocol Statistics</span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isLoadingPoolData && processedAssetData.length > 0 && (
              <>
                <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
                  <div className="text-xs text-gray-400">Total Value Locked</div>
                  <div className="text-lg font-medium mt-1">
                    ${processedAssetData.reduce((acc, asset) => acc + asset.contractTotalSupply, 0).toLocaleString()}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    +5.8% past 24h
                  </div>
                </div>

                <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
                  <div className="text-xs text-gray-400">Total Supplied</div>
                  <div className="text-lg font-medium mt-1">
                    ${processedAssetData.reduce((acc, asset) => acc + asset.contractTotalSupply, 0).toLocaleString()}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    +4.2% past 24h
                  </div>
                </div>

                <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60">
                  <div className="text-xs text-gray-400">Total Borrowed</div>
                  <div className="text-lg font-medium mt-1">
                    ${processedAssetData.reduce((acc, asset) => acc + asset.contractTotalBorrowed, 0).toLocaleString()}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    -2.3% past 24h
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <ErrorModal
        isOpen={!!error}
        onClose={handleErrorClose}
        title={error?.title || "Error"}
        message={error?.message || "Something went wrong"}
      />

      <SuccessModal
        isOpen={success != null && success.txHash != null}
        onClose={handleSuccessClose}
        title={success?.title || "Success"}
        message={success?.message || "Operation completed successfully"}
        txHash={success?.txHash}
        chainId={chainId}
      />

      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />

      {/* Transaction Confirmation Modal */}
      {showConfirmation.show && showConfirmation.asset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#001C29] rounded-xl p-6 max-w-md w-full mx-4 border border-[#003354]/40">
            <h3 className="text-xl font-medium mb-4">Confirm Transaction</h3>
            <p className="text-gray-400 mb-4">
              You are about to {showConfirmation.type} {showConfirmation.amount} {showConfirmation.asset.symbol}.
              This is a large transaction. Are you sure you want to proceed?
            </p>
            <div className="flex gap-4">
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => setShowConfirmation({ show: false })}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleConfirmedTransaction}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LendingAndBorrowing;