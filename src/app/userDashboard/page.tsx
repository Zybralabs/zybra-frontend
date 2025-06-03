"use client";

import CardTable from "@/components/CardTable";
import CardWithChart from "@/components/CardWithChart";
import { motion } from "framer-motion";
import {
  BnbIcon,
  BtcIcon,
  GraphIcon,
  GrowthIcon,
  InvestmentIcon,
  LossIcon,
  NvidiaIcon,
  PoolIcon,
  RatioIcon,
  SolIcon,
  StockIcon,
  SwarmIcon2,
  TeslaIcon,
  WalletIcon,
  XrpIcon,
  ZRUSDIcon,
} from "@/components/Icons";
import Marquee from "react-fast-marquee";
import Header from "@/components/MainPane/components/WalletInfoHeader";
import PortfolioChart from "@/components/PortfolioChart";
import { AppSidebar as Sidebar } from "@/components/Sidebar/AppSidebar";
import UserProfileHeader from "@/components/UserProfileHeader";
import ActiveQuestsWidget from "@/components/UserDashboard/active-quests-widget";
import RecentBadgesWidget from "@/components/UserDashboard/recent-badges-widget";
import LeaderboardWidget from "@/components/Points/leaderboard-widget";
import { formatCurrency } from "@/utils/formatters";
import { ArrowDown, ArrowUp } from "lucide-react";
import DataTable from "@/components/DataTable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { poolsModalCols, transactionCols, transactionModalCols } from "@/components/DataTable/cols";
import { formatAmount } from "@/utils/formatters";
import LayoutHeader from "@/components/Header/Header";
import { Modal } from "@/components/Modal";
import { AppHeader } from "@/components/Sidebar/AppHeader";
import { BigNumber } from "@ethersproject/bignumber";
import { useBalance, useChainId } from "wagmi";
import { useTokenBalances, useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { useAppSelector } from "@/state/hooks";
import { useUserAccount } from "@/context/UserAccountContext";
import { Token } from "@uniswap/sdk-core";
import { useStockIcon } from "@/hooks/useStockIcon";
import { useAllTransactions } from "@/state/transactions/hooks";
import { LoadingSpinner } from "@/components/Modal/loading-spinner";
import type { TransactionType } from "@/state/transactions/types";
import { useRouter } from "next/navigation";
import { useZRUSDStaking } from "@/hooks/useStaking";
import { SupportedChainId, USDC_ADDRESS, ZFI_STAKING_ADDRESS } from "@/constant/addresses";
import { fromWei } from "@/hooks/formatting";
import { useCentrifugeVault } from "@/hooks/useCentrifugeVault";
import { useSwarmVault } from "@/hooks/useSwarmVault";
import { TokenList } from "@/components/Swap-new/Swap";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export interface Metadata {
  assetType: string;
  assetSymbol: string;
  assetAddress: string;
}

export interface Transaction {
  user: string;
  type?: "pool" | "stock";
  status: TransactionType;
  amount: string;
  metadata: Metadata;
  allocation?: string;
  tx_hash: string;
  created_at?: Date;
}


const formatInvestmentData = (data: any[], type: string) => {
  if (!data || !Array.isArray(data)) return [];

  // Filter by type
  const filteredData = data.filter(item => item.type === type);

  // Create a map to consolidate by symbol and asset address
  const consolidatedMap = new Map();

  filteredData.forEach(item => {
    const key = `${item.metadata.assetSymbol}_${item.metadata.assetAddress}`;

    if (consolidatedMap.has(key)) {
      // If this symbol+address already exists, add to the amount
      const existing = consolidatedMap.get(key);
      const currentAmount = parseFloat(existing.amount);
      const newAmount = parseFloat(item.amount);
      existing.amount = (currentAmount + newAmount).toString();
    } else {
      // Otherwise create a new entry
      consolidatedMap.set(key, { ...item });
    }
  });

  // Convert the map back to an array and format for display
  return Array.from(consolidatedMap.values()).map(item => ({
    name: item.metadata.assetSymbol || "Unknown",
    amount: parseFloat(item.amount) / 1e18, // Convert from wei assuming 18 decimals
    change: "+0.00%" // You might want to replace this with actual data if available
  }));
};



// Define types for the investment data
interface AssetInvestment {
  assetSymbol: string;
  assetType: string;
  assetAddress: string;
  chainId: number;
  depositedAmount: number;
  withdrawnAmount: number;
  currentAmount: number;
  currentValueUSD: number;
}

interface InvestmentData {
  totalInvestedUSD: number;
  currentValueUSD: number;
  investmentsByAsset: AssetInvestment[];
}




export default function Chart() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [transactionsModal, setTransactionsModal] = useState(false);
  const router = useRouter();
  const chainId = useChainId();
  const {
    token,
    address,
    totalInvested,
    getTotalInvestment,
    zrusdBorrowed,
    getTransactions,
    zfi_balance,
    balanceLoading,
    getTotalAssetInvestment,
  } = useUserAccount();
  const [poolsModal, setPoolsModal] = useState(false);
  const [stocksModal, setStocksModal] = useState(false);
  const [transactionsFromDb, setTransactionFromDb] = useState<Transaction[] | null>(null);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const transactions = useAppSelector((state) => state.transactions);
  const { assets, loading } = useAppSelector((state) => state.application);
  const [investments, setInvestments] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balances, isLoadingTokenBalances] = useTokenBalancess(
    assets?.map((asset) => asset.address),
    address,
  );
  const pnl = 0;
  const collat_ratio = 0;
  const { getBorrowedMultiAsset } = useSwarmVault(chainId);
  //  const swarm_borrowed  = getBorrowedMultiAsset(assets?.map((asset) => asset.address))
  const tokenAddresses =
    TokenList?.map((token: { address: any }) => token.address).filter(Boolean) || [];
  const swarm_borrowed = getBorrowedMultiAsset([USDC_ADDRESS[chainId], ...tokenAddresses]);

  const tokenBalancesData = useMemo(() => {
    if (!balances || !assets) return [];

    return Object.entries(balances)
      .map(([tokenAddress, balance]) => {
        const asset = assets.find((a) => a.address === tokenAddress);
        if (!asset && Number(balance?.toSignificant(5)) <= 0) return null;
        const Stock = useStockIcon(asset.symbol);
        return {
          id: tokenAddress,
          symbol: asset.symbol,
          name: asset.name,
          amount: balance?.toSignificant(6) || "0",
          logo: Stock ? <Stock /> : <StockIcon />, // Replace with the appropriate icon component
          status: "Active",
          date: new Date().toLocaleDateString(),
          type: "Token",
        };
      })
      .filter(Boolean); // Filter out null values
  }, [balances, assets]);

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address]);

  const fetchTransactions = async () => {
    setIsTransactionLoading(true);
    try {
      const data = await getTransactions();
      if (data?.payload?.transactions) {
        setTransactionFromDb(data.payload.transactions);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const fetchTotalInvestment = async () => {
    try {
      setIsLoading(true);
      const data = await getTotalAssetInvestment();
      if (data?.payload) {
      setInvestments(data?.payload);
        return data?.payload
      }
    } catch (err) {
      // setError(err);
      console.error("Error fetching investment data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        await fetchTransactions();
        await fetchTotalInvestment();

      } else if (transactionsFromDb) {
        setTransactionFromDb(null);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    console.log({ investments });
  }, [investments]);
  // const totalInvestedAmount = Object.values(totalInvested ?? {}).reduce((sum, item) => sum + item.amount, 0);
  const totalInvestedAmount = 0;

  const {
    totalStaked,
    stakerResult: szfi_balance,
    totalProfitDistributed,
    stake,
    unstake,
    loading: stakingLoading,
    receipt,
    error: stakingError,
    setError: setStakingError,
  } = useZRUSDStaking(ZFI_STAKING_ADDRESS[chainId as SupportedChainId], chainId);

  const {
    userTrancheAssetResult,
    borrowedResult,
    userDepReqVaultCollatAsset,
    userVaultTrancheAsset,
    claimableDepositRequestResult,
    pendingDepositRequestResult,
    pendingCancelDepositRequestResult,
    claimableRedeemRequestResult,
    onRedeemClaimableResult,
    isOperator,
  } = useCentrifugeVault(chainId);

  const vaultData = useMemo(
    () => ({
      // Vault status
      // vaultErr :vaultError,
      // vaultReceipt: receipt,
      // User assets and requests
      userTrancheAsset: userTrancheAssetResult,
      userVaultAsset: userVaultTrancheAsset,
      userDepositRequest: userDepReqVaultCollatAsset,

      // Request statuses
      claimableDeposit: claimableDepositRequestResult,
      pendingDeposit: pendingDepositRequestResult,
      pendingCancelDeposit: pendingCancelDepositRequestResult,
      claimableRedeem: claimableRedeemRequestResult,
      onRedeemClaimable: onRedeemClaimableResult,

      // Batch and transaction data
      borrowed: borrowedResult,
      // repayingDebt,
      isOperator,
      // Receipt for transaction tracking
    }),
    [
      userTrancheAssetResult,
      userVaultTrancheAsset,
      userDepReqVaultCollatAsset,
      claimableDepositRequestResult,
      pendingDepositRequestResult,
      pendingCancelDepositRequestResult,
      claimableRedeemRequestResult,
      onRedeemClaimableResult,
      borrowedResult,
      isOperator,
    ],
  );
  const {
    // vaultErr,
    // vaultReceipt,
    // totalCirculation,
    userTrancheAsset,
    userVaultAsset,
    userDepositRequest,
    claimableDeposit,
    pendingDeposit,
    pendingCancelDeposit,
    claimableRedeem,
    onRedeemClaimable,
    borrowed,
  } = vaultData;

  const data = {
    investedPool: [
      {
        name: "TestPool Centrifuge",
        amount: parseInt(userTrancheAsset?._hex, 16),
        change: "+14,34%",
      },
    ],

    transactionsData: [
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
      {
        id: "3u1reuv4",
        quantity: 242,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
      },
    ],
    transactionModalData: [
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPLasdasdasdasdasdasdasd",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <PoolIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
      {
        id: "m5gr84i9",
        quantity: 316,
        status: "Take Offer",
        name: "$AAPL",
        date: "06/09/2024",
        type: "Pool",
        logo: <StockIcon />,
        price: formatCurrency(365.25),
        allocation: "25%",
        currency: "USD",
        liquidity: "High",
      },
    ],
    poolsModal: [
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <GrowthIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
      {
        id: "1",
        quantity: 600.63,
        price: 252.28,
        name: "Anemoy Liquid Pool Inv....",
        apy: "+45.28%",
        roi: "64.28%",
        collateral_ratio: "48.22%",
        borrowed_ZRUSD: 2288.25,
        logo: <PoolIcon />,
        indicator: <LossIcon />,
      },
    ],
  };
  // Then
  const [amount, setAmount] = useState(0);
  const SZFI_BALANCE = useMemo(
    () => (szfi_balance ? Number(fromWei(szfi_balance?.amountStaked)) : undefined),
    [szfi_balance],
  );
  const userBalance = 0;
  const ZfiIcon = useStockIcon("zfi");
  console.log({ swarm_borrowed });
  const Tooltip = ({
    isVisible,
    reference,
    name,
    tooltipText,
    amount
  }: {
    isVisible: boolean;
    reference: React.RefObject<HTMLElement>;
    name: string;
    tooltipText: string;
    amount: number | string;
  }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Handle mounting for SSR
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    useEffect(() => {
      if (isVisible && reference.current) {
        const updatePosition = () => {
          if (!reference.current) return;
          const rect = reference.current.getBoundingClientRect();
          const tooltipRect = tooltipRef?.current?.getBoundingClientRect();
          const tooltipWidth = tooltipRect?.width || 256; // Default width if not yet rendered

          // Calculate position to center tooltip below the icon
          let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

          // Keep tooltip on screen - adjust if it would go off the edges
          if (left < 12) {
            left = 12;
          } else if (left + tooltipWidth > window.innerWidth - 12) {
            left = window.innerWidth - tooltipWidth - 12;
          }

          setPosition({
            top: rect.bottom + window.scrollY + 10,
            left: left
          });
        };

        // Update position immediately and on resize/scroll
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition);
        };
      }
    }, [isVisible, reference]);

    // Only render when mounted (client-side) and visible
    if (!mounted || !isVisible) return null;

    // Create the portal to render the tooltip directly in the body
    return createPortal(
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[9999] w-64 p-3 text-sm text-white bg-[#001E33] border border-[#034a70] shadow-xl rounded-md"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        {/* Arrow pointer - positioned dynamically */}
        <div
          className="absolute top-0 w-3 h-3 bg-[#001E33] border-t border-l border-[#034a70] transform rotate-45"
          style={{
            left: `${reference.current ?
              Math.max(12, Math.min(
                reference.current.getBoundingClientRect().left + (reference.current.getBoundingClientRect().width / 2) - position.left - 6,
                256 - 18
              )) :
              12}px`,
            marginTop: '-1.5px'
          }}
        />

        {/* Title */}
        <div className="font-medium mb-1 text-[#4BB6EE]">{name}</div>

        {/* Description */}
        <div className="text-white text-xs leading-relaxed" >
          {tooltipText}
        </div>

        {/* Current value */}
        <div className="mt-2 pt-2 border-t border-[#034a70] flex justify-between items-center">
          <span className="text-xs text-white/70">Current value:</span>
          <span className="text-xs font-medium text-[#4BB6EE]">{amount}</span>
        </div>
      </motion.div>,
      document.body
    );
  };

  // StatCard component with tooltip
  const StatCard = ({
    name,
    icon,
    amount,
    bottomContent,
    growth = true,
    tooltip = null
  }: {
    name: string;
    icon: JSX.Element;
    amount: string | number;
    bottomContent: JSX.Element | string;
    growth?: boolean;
    tooltip?: string | null;
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const iconRef = useRef(null);

    // Default tooltips if not provided
    const defaultTooltips: { [key: string]: string } = {
      "My Wallet": "Shows your current wallet balance in USD",
      "Total Investment": "The total amount you have invested across all assets",
      "Total Pool Investment": "Your total investments in liquidity pools",
      "Pending Investment": "Investments that are still being processed",
      "ZrUSD Borrowed": "Total amount of ZrUSD you have borrowed",
      "Collateral Ratio": "Your current collateralization ratio, should stay above minimum requirements",
      "ZFI Staked": "Amount of ZFI tokens you have staked to earn rewards",
      "ZFI Balance": "Current balance of ZFI tokens in your wallet"
    };

    // Use custom tooltip if provided, otherwise use default
    const tooltipText = tooltip || defaultTooltips[name as keyof typeof defaultTooltips] || "Information about this statistic";

    return (
      <div className="relative bg-[#012B3F] backdrop-blur-md border border-[#022e45]/60 rounded-xl shadow-[0_4px_16px_rgba(0,10,20,0.25)] p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70 font-medium">{name}</div>
          <div
            ref={iconRef}
            className="relative cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="transition-all hover:opacity-80">
              {icon}
            </div>

            <Tooltip
              isVisible={showTooltip}
              reference={iconRef}
              name={name}
              tooltipText={tooltipText}
              amount={amount}
            />
          </div>
        </div>

        <div className="mt-2 text-xl md:text-2xl font-bold text-white">{amount}</div>

        <div className={`mt-3 text-xs ${growth ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {bottomContent}
        </div>
      </div>
    );
  };
  const TotalInvestmentCard = () => {
    // State declarations
    const [investmentData, setInvestmentData] = useState<{
        totalInvestedUSD: number;
        currentValueUSD: number;
        investmentsByAsset: any[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get the function from context
    const { getTotalInvestment } = useUserAccount();

    // Use refs for caching
    const lastFetchTimeRef = useRef(0);
    const fetchInProgressRef = useRef(false);
    const cachedDataRef = useRef<{
      totalInvestedUSD: number;
      currentValueUSD: number;
      investmentsByAsset: any[];
    } | null>(null);

    // Cache duration (5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000;

    // Memoized fetch function with proper dependencies
    const fetchData = useCallback(async (forceRefresh = false) => {
        // Skip if a fetch is already in progress
        if (fetchInProgressRef.current) return;

        const now = Date.now();

        // Use cached data if available and not expired
        if (
            !forceRefresh &&
            cachedDataRef.current &&
            now - lastFetchTimeRef.current < CACHE_DURATION
        ) {
            setInvestmentData(cachedDataRef.current);
            return;
        }

        // Set fetch in progress flag
        fetchInProgressRef.current = true;
        setIsLoading(true);

        try {
            const response = await getTotalInvestment();

            if (response && response.payload) {
                const newData = {
                    totalInvestedUSD: response.payload.totalInvestedUSD || 0,
                    currentValueUSD: response.payload.currentValueUSD || 0,
                    investmentsByAsset: response.payload.investmentsByAsset || []
                };

                // Update state and cache
                setInvestmentData(newData);
                cachedDataRef.current = newData as typeof cachedDataRef.current;
                lastFetchTimeRef.current = now;
            }
        } catch (error) {
            console.error("Failed to fetch investment data:", error);
        } finally {
            setIsLoading(false);
            fetchInProgressRef.current = false;
        }
    }, [getTotalInvestment]); // Add getTotalInvestment as dependency

    // Fetch data only once on component mount and set up refresh interval
    useEffect(() => {
        // Initial fetch
        fetchData();

        // Set up interval for periodic refresh
        const intervalId = setInterval(() => {
            fetchData(true); // Force refresh on interval
        }, CACHE_DURATION);

        // Cleanup interval on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, [fetchData]); // Add fetchData as dependency

    // Format currency with comma separators and 2 decimal places
    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Get the total invested amount
    const totalInvestedAmount = investmentData?.totalInvestedUSD || 0;

    return (
        <StatCard
            name="Total Investment"
            icon={<InvestmentIcon />}
            amount={isLoading && !investmentData ? "Loading..." : `$${formatCurrency(totalInvestedAmount)}`}
            bottomContent={
                <div>
                    <span className="text-white">+0.00</span>
                    <span className="ml-1 text-white">today</span>
                </div>
            }
        />
    );
  };
  // Dashboard User Header Component
  const DashboardUserHeader = () => {
    const { user, balanceLoading } = useUserAccount();
    return <UserProfileHeader user={user} loading={balanceLoading} />;
  };

  return (
    // <SidebarProvider open={sidebarVisible} onOpenChange={(e) => setSidebarVisible(e)}>
    <>
      <div className="flex container justify-center overflow-x-hidden mt-6">
        {/* <Sidebar /> */}
        <div className={`flex flex-col flex-1 w-full duration-300`}>
          {/* <LayoutHeader /> */}
          {/* <Header /> */}
          <DashboardUserHeader />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
            <StatCard
              name="My Wallet"
              icon={<WalletIcon />}
              amount={`$${userBalance}`}
              bottomContent={
                <div>
                  <span>{userBalance}</span>
                  <span className="ml-1 text-white">today</span>
                </div>
              }
            />
            <TotalInvestmentCard />

            <StatCard
              name="Total Pool Investment"
              icon={<PoolIcon />}
              amount={`$${(claimableDeposit?._hex
                ? parseInt(claimableDeposit._hex, 16)
                : userTrancheAsset?._hex
                  ? parseInt(userTrancheAsset._hex, 16)
                  : 0
              ).toLocaleString()}`}
              bottomContent={
                <div>
                  <span>+{0}</span>
                  <span className="ml-1 text-white">today</span>
                </div>
              }
            />
            {pendingDeposit && !pendingDeposit.isZero() && (
              <StatCard
                name="Pending Investment"
                icon={
                  <div className="flex items-center space-x-1">
                    <PoolIcon />
                    <SwarmIcon2 />
                  </div>
                }
                amount={`$${(pendingDeposit._hex
                  ? parseInt(pendingDeposit._hex, 16)
                  : 0
                ).toLocaleString()}`}
                bottomContent={
                  <div>
                    <span>+{0}</span>
                    <span className="ml-1 text-white">today</span>
                  </div>
                }
              />
            )}
            <StatCard
              name="ZrUSD Borrowed"
              icon={<ZRUSDIcon width={23} height={23} />}
              amount={
                swarm_borrowed?.totalBorrowed?.loading
                  ? "Loading..."
                  : `ZrUSD ${fromWei(
                    parseFloat(swarm_borrowed?.totalBorrowed?.value.toString() || "0") +
                    (claimableDeposit?._hex ? parseInt(claimableDeposit._hex, 16) : 0),
                  ).toFixed(3)}`
              }
              bottomContent={
                <div>
                  <span>+{0}</span>
                  <span className="ml-1 text-white">today</span>
                </div>
              }
            />

            <StatCard
              name="Collateral Ratio"
              icon={<RatioIcon />}
              amount={`${collat_ratio}%`}
              bottomContent={<span>+0.00%</span>}
            />
            <StatCard
              name="ZFI Staked"
              icon={<GraphIcon />}
              growth={false}
              amount={`$${formatAmount(Number(SZFI_BALANCE?.toString()))}`}
              bottomContent={
                <div>
                  <span className="text-midRed">-{pnl}$</span>
                  <span className="ml-1 text-white">today</span>
                </div>
              }
            />
            <StatCard
              name="ZFI Balance"
              icon={ZfiIcon ? <ZfiIcon /> : <GraphIcon />}
              growth={true}
              amount={`$${formatAmount(zfi_balance ?? 0)}`}
              bottomContent={
                <div>
                  <span className="text">+0</span>
                  <span className="ml-1 text-white">today</span>
                </div>
              }
            />
          </div>
          {/* Main Dashboard Content */}
          <div className="w-full mt-5 grid grid-cols-1 xl:grid-cols-9 2xl:grid-cols-4 gap-6">
            {/* Left Column - Portfolio Chart and Transactions */}
            <div className="w-full flex flex-col xl:col-span-6 2xl:col-span-3 order-2 xl:order-1">
              <PortfolioChart />
              <div className="mt-5 flex-1">
                {isTransactionLoading ? (
                  <div className="mt-6">
                    <LoadingSpinner />
                  </div>
                ) : (
                  transactionsFromDb && (
                    <DataTable
                      heading="Transactions"
                      onPopup={() => setTransactionsModal(true)}
                      columns={transactionCols}
                      data={transactionsFromDb.slice(0, 4)}
                      tableHeightClass="max-h-[222px]"
                    />
                  )
                )}
              </div>
            </div>

            {/* Right Column - Charts, Investments, and Quests */}
            <div className="xl:col-span-3 2xl:col-span-1 flex flex-col gap-4 order-1 xl:order-2">
              <div className="max-h-[215px] flex-1">
                <CardWithChart
                  head={
                    <div className="w-full flex justify-between items-center">
                      <span className="text-sm font-semibold">ZFI</span>
                      <div>
                        <span className="text-sm">$2,545,06</span>
                        <span className="text-xs text-midGreen ml-1">+10.21 %</span>
                      </div>
                    </div>
                  }
                />
              </div>

              <CardTable
                title="Invested Stocks"
                data={investments ? formatInvestmentData(investments, 'stock') : []}
                onPopup={() => setStocksModal(true)}
                isLoading={isLoading}
              />

              <CardTable
                title="Invested Pools"
                data={investments ? formatInvestmentData(investments, 'pool') : []}
                onPopup={() => setPoolsModal(true)}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Quests and Rewards Section */}
          <div className="w-full mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Quests & Rewards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Quests Widget */}
              <div className="md:col-span-1">
                <ActiveQuestsWidget />
              </div>

              {/* Recent Badges Widget */}
              <div className="md:col-span-1">
                <RecentBadgesWidget />
              </div>

              {/* Leaderboard Widget */}
              <div className="md:col-span-1">
                <LeaderboardWidget />
              </div>
            </div>
          </div>

          {/* Footer */}
          {/* <Footer /> */}
        </div>
      </div>
      {transactionsModal && (
        <Modal onClose={() => setTransactionsModal(false)}>
          <div>
            <DataTable
              heading="Transactions"
              columns={transactionModalCols}
              data={transactionsFromDb}
              filtration
            />
          </div>
        </Modal>
      )}
      {stocksModal && (
        <Modal onClose={() => setStocksModal(false)}>
          <div>
            <DataTable
              heading="Invested Stocks"
              columns={transactionModalCols}
              data={investments ? formatInvestmentData(investments, 'stock') : []}
              filtration
            />
          </div>
        </Modal>
      )}
      {poolsModal && (
        <Modal onClose={() => setPoolsModal(false)}>
          <div>
            <DataTable
              heading="Invested Pools"
              columns={poolsModalCols}
              data={investments ? formatInvestmentData(investments, 'pool') : []}
              filtration
            />
          </div>
        </Modal>
      )}
    </>
    // </SidebarProvider>
  );
}
