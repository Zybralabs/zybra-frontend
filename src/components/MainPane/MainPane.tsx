"use client";

import React, { useEffect, useState, useMemo } from "react";
import Header from "./components/WalletInfoHeader";
import Centrifuge, {
  type Pool,
  type PoolMetadata,
  Rate,
  type Token,
} from "@centrifuge/centrifuge-js";
import { useCentrifuge } from "@centrifuge/centrifuge-react";
import PoolCard from "./components/PoolCard";
import StockCard from "./components/StockCard";
import { useStockPrices } from "@/hooks/useStockPrice";
import { savePoolData, useLoadAssets } from "@/state/application/hooks";
import { useAppSelector } from "@/state/hooks";
import { ArrowRight, ChevronDown, Compass, ShieldOff, SquareArrowOutUpRight } from "lucide-react";
import Dropdown from "../Dropdown";
import Link from "next/link";
import poolDetail from "@/constant/pools/1.json";
import { USDC_MAINNET } from "@/constant/tokens";
import { getPoolValueLocked } from "@/hooks/getPoolValueLocked";
import { useMetadataMulti } from "@/hooks/useMetadata";
import { useListedPools } from "@/hooks/useListedPools";
import { useRouter } from "next/navigation";
import type { StatusChipProps } from "@centrifuge/fabric";
import Decimal from "decimal.js-light";
import { filterPools } from "./utils";
import CardSkeleton from "../CardSkeleton";
import ZybraLogoLoader from "../ZybraLogoLoader";
// import { useDispatch } from "react-redux";
import { Wallet, ArrowRightLeft, Coins, LineChart, Banknote, Shield, BarChart2, PieChart, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserAccount } from '@/context/UserAccountContext';
import { useExplorationProgress } from '@/hooks/useExplorationProgress';

// Define the ExplorationStep type for the exploration guide
export type ExplorationStep = {
  id: string;
  title: string;
  icon: React.ReactNode;
  link?: string;
  action?: string;
  completed: boolean;
  requiredSteps?: string[];
};

export type TrancheWithCurrency = Pick<
  Token,
  "yield30DaysAnnualized" | "interestRatePerSec" | "currency" | "id" | "seniority"
>;
export type PoolStatusKey = "Open for investments" | "Closed" | "Upcoming" | "Archived";

// Status color mapping for pool status badges
export const statusColor = {
  "Open for investments": "warning",
  Closed: "default",
  Upcoming: "default",
  Archived: "default",
};

export type MetaDataById = Record<string, PoolMetaDataPartial>;
export type PoolMetaDataPartial = Partial<PoolMetadata> | undefined;

export type PoolCardProps = {
  poolId?: string;
  name?: string;
  assetClass?: string;
  valueLocked?: Decimal;
  currencySymbol?: string;
  apr?: Rate | null | undefined;
  status?: PoolStatusKey;
  iconUri?: string;
  isArchive?: boolean;
  tranches?: TrancheWithCurrency[];
  metaData?: PoolMetadata;
  createdAt?: string;
};

export function poolsToPoolCardProps(
  pools: Pool[],
  metaDataById: MetaDataById,
  cent: Centrifuge,
): PoolCardProps[] {
  return pools.map((pool) => {
    const metaData = typeof pool.metadata === "string" ? metaDataById[pool.id] : pool.metadata;
    return {
      poolId: pool.id,
      name: metaData?.pool?.name,
      assetClass: metaData?.pool?.asset.subClass,
      valueLocked: getPoolValueLocked(pool),
      currencySymbol: pool.currency.symbol,
      status: getPoolStatus(pool),
      iconUri: metaData?.pool?.icon?.uri
        ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri)
        : undefined,
      tranches: pool.tranches,
      metaData: metaData as PoolMetadata,
      createdAt: pool.createdAt ?? "",
    };
  });
}
export function getPoolStatus(pool: Pool): PoolStatusKey {
  if (pool.tranches.at(0)?.capacity?.toFloat()) {
    return "Open for investments";
  }

  return "Closed";
}

function getMetasById(pools: Pool[], poolMetas: PoolMetaDataPartial[]) {
  const result: MetaDataById = {};

  pools.forEach(({ id: poolId }, index) => {
    result[poolId] = poolMetas[index];
  });

  return result;
}

const upcomingPools: PoolCardProps[] = [];
const Dashboard = () => {
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);
  const loadAssets = useLoadAssets();
  const router = useRouter();

  // Get user context to check if user is logged in
  const { token , address ,user } = useUserAccount();
  // const dispatch = useDispatch(); // Uncomment if needed
  // Define a more specific type for assets
  type Asset = {
    name: string;
    symbol: string;
    price: string;
    address: string;
    marketcap: string;
    changePercent?: number | string;
    currency?: string;
    timestamp?: string | null;
    change?: string;
  };

  const [combinedAssets, setCombinedAssets] = useState<Asset[]>([]);
  const allfilters = [
    { emoji: "🌟", label: "popular" },
    { emoji: "🔥", label: "hot" },
    { emoji: "⚡", label: "active" },
    { emoji: "🌊", label: "pools" },
    { emoji: "📈", label: "stocks" },
  ];
  const [filters, setFilters] = useState("popular");
  // Redux state selectors
  const {
    swarmAssets: assets,
    loading: assetsLoading,
    error: assetsError,
  } = useAppSelector((state) => state.application);
  const {
    loading: poolLoading,
    error: poolError,
  } = useAppSelector((state) => state.application);

  useEffect(() => {
    loadAssets({ first: 10, skip: 0, orderBy: "name", orderDirection: "asc" });
  }, [loadAssets]);

  useEffect(() => {
    if (assets) {
      const symbols = assets
        .map((asset) => asset.symbol)
        .filter((symbol: string | null) => !!symbol);
      setStockSymbols(symbols);
    }
  }, [assets]);

  // Get stock prices using the hook
  const { stockPrices } = useStockPrices(stockSymbols);

  // Combine assets with stock prices
  useEffect(() => {
    if (assets) {
      // If no stockPrices yet, use original asset data
      if (!stockPrices?.length) {
        const defaultAssets = assets.map((asset) => ({
          ...asset,
          currentPrice: asset.price || "0",
          change: "0",
          changePercent: 0,
          currency: "USD",
          timestamp: null,
          marketcap: asset.marketcap || "0",
        }));
        setCombinedAssets(defaultAssets);
        return;
      }

      // Create a map of symbols to prices for easier lookup
      const priceMap = new Map(stockPrices.map((price) => [price.symbol, price]));

      // Combine assets with their corresponding prices
      const assetsWithPrices = assets.map((asset) => {
        const stockPrice = priceMap.get(asset.symbol);
        return {
          ...asset,
          currentPrice: stockPrice?.price || asset?.price || "0",
          change: stockPrice?.change?.toString() || "0",
          changePercent: stockPrice?.changePercent || 0,
          currency: stockPrice?.currency || "USD",
          timestamp: stockPrice?.timestamp || null,
          price: stockPrice?.price || asset.price || "0",
          marketcap: stockPrice?.marketcap || asset.marketcap || "0",
        };
      });

      setCombinedAssets(assetsWithPrices);
    }
  }, [assets, stockPrices]);

  // Update filterMarketCap to handle string marketcap values
  const filterMarketCap = (data: Asset[]) =>
    filters === "hot"
      ? [...data]?.sort((a, b) => Number(b.marketcap) - Number(a.marketcap)).slice(0, 3)
      : data;

  // Combined loading and error states
  // const isLoading = assetsLoading || pricesLoading;
  // const error = assetsError || pricesError;

  const cent = useCentrifuge();
  // const router = useRouter(); // Uncomment if needed
  // const searchParams = useSearchParams();
  // const params = new URLSearchParams(searchParams);
  const search = ""; // Empty search for now

  // const [showArchived, setShowArchived] = React.useState(false);
  const [listedPools] = useListedPools();
  const centPools = listedPools?.filter(({ id }) => !id.startsWith("0x")) as Pool[];
  const centPoolsMetaData: PoolMetaDataPartial[] = useMetadataMulti<PoolMetadata>(
    centPools?.map((p) => p.metadata) ?? [],
  ).map((q) => q.data);
  const centPoolsMetaDataById = getMetasById(centPools, centPoolsMetaData);

  const [, filteredPools] = React.useMemo(() => {
    const pools = !!listedPools?.length
      ? poolsToPoolCardProps(listedPools, centPoolsMetaDataById, cent)
      : [];
    const openInvestmentPools = pools
      .filter(
        (pool) =>
          pool.status === "Open for investments" &&
          !pool?.poolId?.startsWith("0x") &&
          pool?.valueLocked,
      )
      .sort((a, b) =>
        b?.valueLocked && a?.valueLocked ? b?.valueLocked?.sub(a?.valueLocked).toNumber() : 0,
      );

    const sortedPools = [...openInvestmentPools, ...upcomingPools];

    return [
      pools,
      search ? filterPools([...pools, ...upcomingPools], new URLSearchParams(search)) : sortedPools,
    ];
  }, [listedPools, search, cent, centPoolsMetaDataById]);

  const ExplorationGuide = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Use our custom hook for tracking exploration progress
    const {
      completedSteps,
      isStepCompleted,
      isStepAvailable,
      markStepCompleted,
      calculateProgress,
      resetProgress
    } = useExplorationProgress();

    // Get tracking function and wallet status from UserAccountContext
    const { trackFeatureUsage, address } = useUserAccount();

    // If no wallet is connected, don't show completed steps
    const isWalletConnected = !!address;

    // Define steps with dependencies
    const explorationSteps = useMemo<ExplorationStep[]>(() => [
      {
        id: 'wallet',
        title: isWalletConnected ? "Wallet Connected" : "Connect your wallet to start trading",
        icon: <Wallet className="w-5 h-5" />,
        action: isWalletConnected ? "Wallet Connected" : "Connect Wallet",
        completed: isStepCompleted('wallet'),
        requiredSteps: [],
      },
      {
        id: 'kyc',
        title: "Complete KYC verification",
        icon: <Shield className="w-5 h-5" />,
        link: "/kyc/onboarding/investor-type",
        completed: isStepCompleted('kyc'),
        requiredSteps: ['wallet'],
      },
      {
        id: 'markets',
        title: "Explore Markets & Stocks",
        icon: <LineChart className="w-5 h-5" />,
        link: "/markets",
        completed: isStepCompleted('markets'),
        requiredSteps: ['wallet', 'kyc'],
      },
      {
        id: 'mint',
        title: "Mint and manage ZrUSD",
        icon: <Coins className="w-5 h-5" />,
        link: "/mint",
        completed: isStepCompleted('mint'),
        requiredSteps: ['wallet', 'kyc'],
      },
      {
        id: 'deposit',
        title: "Deposit or withdraw assets",
        icon: <ArrowRightLeft className="w-5 h-5" />,
        link: "/swap",
        completed: isStepCompleted('deposit'),
        requiredSteps: ['wallet', 'kyc', 'mint'],
      },
      {
        id: 'pools',
        title: "Explore Pool investments",
        icon: <PieChart className="w-5 h-5" />,
        link: "/swap?tab=pool&subTab=deposit",
        completed: isStepCompleted('pools'),
        requiredSteps: ['wallet', 'kyc'],
      },
      {
        id: 'lending',
        title: "Try Lending & Borrowing",
        icon: <Banknote className="w-5 h-5" />,
        link: "/lending",
        completed: isStepCompleted('lending'),
        requiredSteps: ['wallet', 'kyc', 'mint'],
      },
      {
        id: 'dashboard',
        title: "View your Dashboard",
        icon: <BarChart2 className="w-5 h-5" />,
        link: "/dashboard",
        completed: isStepCompleted('dashboard'),
        requiredSteps: ['wallet'],
      },
    ], [isStepCompleted]);

    // Calculate progress percentage
    const progressPercentage = calculateProgress(explorationSteps.length);

    // Handle step interaction
    const handleStepInteraction = (step: ExplorationStep) => {
      if (!isStepAvailable(step)) return;

      // Track the interaction
      trackFeatureUsage(`explore_${step.id}`).catch(console.error);

      if (step.action === "Connect Wallet") {
        // Route to signup page for wallet connection
        router.push("/signup");
      } else if (step.link) {
        // Mark the step as viewed when navigating to it
        if (step.id === 'markets' || step.id === 'dashboard') {
          markStepCompleted(step.id);
        }

        // Navigate to the page
        router.push(step.link);
      }
    };

    return (
      <div className="mb-8 bg-gradient-to-br from-[#001525] to-[#00182A] rounded-xl border border-[#003354]/40 overflow-hidden shadow-[0_0_30px_rgba(0,70,120,0.15)]">
        <div className="p-4 bg-gradient-to-r from-[#00233A]/80 to-[#00182A] border-b border-[#003354]/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full p-1.5 shadow-md shadow-blue-500/20">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Start Exploring Zybra Finance</h2>
                <div className="relative h-6 w-16 bg-[#001A26] rounded-full overflow-hidden border border-[#003354]/60">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-500 ease-out"
                    style={{ width: `${isWalletConnected ? progressPercentage : 0}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {isWalletConnected ? `${progressPercentage}%` : '0%'}
                  </span>
                </div>

                {/* Reset button for the current wallet - only show when wallet is connected */}
                {isWalletConnected && (
                  <button
                    onClick={() => {
                      if (confirm('Reset exploration progress for this wallet?')) {
                        resetProgress();
                        // Force page reload to ensure UI updates
                        window.location.reload();
                      }
                    }}
                    className="ml-2 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    title="Reset exploration progress for this wallet"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-[#00273D]/40 rounded-full transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-blue-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-400" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 sm:p-4 space-y-3 bg-gradient-to-b from-[#001525] to-[#001A20] overflow-x-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {explorationSteps.map((step: ExplorationStep) => {
                const isAvailable = isStepAvailable(step);
                // Only show completed steps if wallet is connected
                const isCompleted = isWalletConnected && completedSteps.has(step.id);

                // Special handling for wallet connection step when not connected
                const isWalletStep = step.id === 'wallet';

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
                      // Always make wallet step available when not connected
                      isAvailable || (!isWalletConnected && isWalletStep)
                        ? "bg-[#001A26]/50 hover:bg-[#00273D] border border-[#003354]/40 hover:border-[#003354]/60"
                        : "bg-[#00162A]/50 border border-[#003354]/20 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                        isCompleted
                          ? "bg-gradient-to-br from-green-500/20 to-green-500/30 text-green-400"
                          : "bg-gradient-to-br from-[#00233A] to-[#001E30] text-blue-400 border border-[#003354]/60"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-medium">{step.title}</span>
                        {isCompleted && (
                          <span className="text-green-400 text-xs">Completed</span>
                        )}
                      </div>
                    </div>
                    {isWalletStep && !isWalletConnected ? (
                      // Special handling for wallet connection when not connected
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#3B82F6] hover:to-[#60A5FA] text-white transition-all duration-300 text-sm h-9 px-4 shadow-md shadow-blue-500/20"
                        onClick={() => router.push("/signup")}
                      >
                        Connect Wallet
                      </Button>
                    ) : isWalletStep && isWalletConnected ? (
                      // Show connected state for wallet step
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white transition-all duration-300 text-sm h-9 px-4 shadow-md shadow-green-500/20 cursor-default"
                        disabled
                      >
                        ✓ Wallet Connected
                      </Button>
                    ) : step.action ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className={cn(
                          "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#3B82F6] hover:to-[#60A5FA] text-white transition-all duration-300 text-sm h-9 px-4 shadow-md shadow-blue-500/20",
                          !isAvailable && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleStepInteraction(step)}
                        disabled={!isAvailable || isCompleted}
                      >
                        {step.action}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-sm h-9 px-4",
                          isCompleted
                            ? "text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
                            : "text-blue-400 bg-[#00233A] hover:bg-[#00273D] border border-[#003354]/60",
                          !isAvailable && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleStepInteraction(step)}
                        disabled={!isAvailable}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Explore
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-[100vw] overflow-hidden text-white">
      {/* Content wrapper with consistent padding */}
      <div className="w-full max-w-screen-2xl px-4 sm:px-6 md:px-8 mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 md:mb-6">Markets</h1>
          <p className="text-white/80 text-xs sm:text-sm">
            Discover and invest in your favorite assets from Centrifuge and Swarm
          </p>
          <p className="text-white/95 text-xs sm:text-sm">..All from one place</p>
        </div>

        {/* Exploration Guide - Only show when user is logged in */}
        {(token || address || user) ? (
          <ExplorationGuide />
        ) : (
          <div className="mb-8 bg-gradient-to-br from-[#001525] to-[#00182A] rounded-xl border border-[#003354]/40 overflow-hidden shadow-[0_0_30px_rgba(0,70,120,0.15)]">
            <div className="p-4 bg-gradient-to-r from-[#00233A]/80 to-[#00182A] border-b border-[#003354]/40 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full p-1.5 shadow-md shadow-blue-500/20">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Start Exploring Zybra Finance</h2>
                </div>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-white/80 mb-4">Connect your wallet to track your progress and earn rewards</p>
              <button
                id="connect-wallet-button-guide"
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#3B82F6] hover:to-[#60A5FA] text-white transition-all duration-300 text-sm py-2 px-4 rounded-lg shadow-md shadow-blue-500/20"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="relative mb-4 md:mb-6">
          <div className="flex items-center overflow-x-auto pb-2 hide-scrollbar gap-2">
            {allfilters.map((filter, i) => (
              <button
                key={i}
                className={`pl-2.5 pr-3 sm:pl-4 sm:pr-5 py-[.35rem] rounded-full text-xs sm:text-sm flex-shrink-0 whitespace-nowrap duration-300 ${
                  filters === filter.label ? "bg-white/20" : "bg-white/5"
                }`}
                onClick={() => setFilters(filter.label)}
              >
                <span className="mr-1">{filter.emoji}</span> {filter.label}
              </button>
            ))}

            {/* See More Link */}
            <div className="relative flex-shrink-0 ml-2">
              <button
                onClick={() => setShowLinks(!showLinks)}
                className="outline-none border-none underline text-xs sm:text-sm whitespace-nowrap"
              >
                see more
              </button>
              <ul
                className={`${showLinks ? "h-auto opacity-100 py-2" : "h-0 opacity-0 py-0"}
                  w-[130px] shadow-md absolute top-full right-0 z-10 mt-1
                  duration-200 flex flex-col justify-center gap-2 rounded-lg
                  overflow-hidden bg-darkGreen`}
              >
                <li className="block px-3" onClick={() => setShowLinks(!showLinks)}>
                  <Link
                    className="px-2 w-full flex items-center justify-between text-center text-xs sm:text-sm"
                    href="/pools"
                    target="_blank"
                  >
                    <span>Pools</span>
                    <SquareArrowOutUpRight size={12} />
                  </Link>
                </li>
                <li className="block px-3" onClick={() => setShowLinks(!showLinks)}>
                  <Link
                    className="px-2 w-full flex items-center justify-between text-center pt-2 border-gray-400/40 border-t text-xs sm:text-sm"
                    href="/offers"
                    target="_blank"
                  >
                    <span>Stocks</span>
                    <SquareArrowOutUpRight size={12} />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cards Grid - Simplified container structure */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr mx-auto w-full">
          {/* Display Pool Cards */}
          {poolLoading ? (
            <>
              <div className="col-span-full flex justify-center items-center py-8">
                <ZybraLogoLoader size="md" />
              </div>
              {[...Array(4)].map((_, idx) => <CardSkeleton key={`skeleton-pool-${idx}`} type="Pool" />)}
            </>
          ) : poolError ? (
            <div className="col-span-full p-4 bg-red-500/20 rounded-lg text-sm border border-red-500/30">
              Error fetching pool details: {poolError}
            </div>
          ) : (
            filters !== "stocks" &&
            filteredPools?.map((pool, index: number) => (
              <PoolCard
                key={`pool-${index}`}
                {...pool}
              />
            ))
          )}
          {/* Display Stock Cards */}
          {assetsLoading ? (
            <>
              <div className="col-span-full flex justify-center items-center py-8">
                <ZybraLogoLoader size="md" />
              </div>
              {[...Array(4)].map((_, idx) => <CardSkeleton key={`skeleton-stock-${idx}`} type="Stock" />)}
            </>
          ) : assetsError ? (
            <div className="col-span-full p-4 bg-red-500/20 rounded-lg text-sm border border-red-500/30">
              Error fetching stock prices: {assetsError}
            </div>
          ) : (
            filters !== "pools" &&
            filterMarketCap(combinedAssets).map((stock, index) => (
              <StockCard
                key={`stock-${index}`}
                name={stock.name}
                symbol={stock.symbol}
                price={Number(stock.price)}
                address={stock.address}
                change={typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) + '%' : '0%'}
                marketCap={Number(stock.marketcap)}
                quantity={0}
                ZrUSD={0}
                expiry={""}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-dark text-white w-full">
      <div className="w-full mx-auto">
        <Dashboard />
      </div>
    </div>
  );
};

export default App;
