"use client";

import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { Button } from "./components/button";
import { Card, CardContent } from "./components/card";
import { Input } from "./components/input";
import { Label } from "./components/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ArrowDownUp, AlertTriangle, ArrowRightLeft, Wallet2Icon, InfoIcon } from "lucide-react";
import TokenSelector from "./components/token-selector";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/state/hooks";
import { useStockIcon } from "@/hooks/useStockIcon";
import { LoadingSpinner } from "../Modal/loading-spinner";
import { useUserAccount } from "@/context/UserAccountContext";
import { useSwarmVault } from "@/hooks/useSwarmVault";
import { ErrorModal, SuccessModal } from "../Modal";
import { useReferralCompletion } from "@/hooks/useReferralCompletion";
import { AssetType, TakingOfferType } from "@/types";
import TradingCard from "./components/trading-card";
import { useChainId } from "wagmi";
import { useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { Token as Currency } from "@uniswap/sdk-core";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import { BigNumber } from "@ethersproject/bignumber";
import { WalletType } from "@/constant/account/enum";
import { useStockPrices } from "@/hooks/useStockPrice";
import { fromWei, toWei } from "@/hooks/formatting";
import { useTokenFromActiveNetwork } from "@/lib/hooks/useCurrency";
import { ZFI_TOKEN_TESTNET, ZRUSD_TOKEN_TESTNET } from "@/state/stake/hooks";
import { SWARM_VAULT_ADDRESS, USDC_ADDRESS, ZrUSD } from "@/constant/addresses";
import { ZRUSDIcon } from "../Icons";
import { ethers } from "ethers";
import FundingHelper from "@/components/AccountKit/FundingHelper";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";
import { handleTransactionError } from "@/utils/gaslessErrorHandler";

type Token = {
  id: string;
  name: string;
  symbol: string;
  logoURI?: string;
  address: string;
  chainId: number;
  decimals: number;
  balance?: number;
};

type Offer = {
  amount: number;
  price: number;
  total: number;
  offerId: number;
  selected: boolean;
  availableAmount?: number;
};





export const TokenList: any = [

  {
    address: ZFI_TOKEN_TESTNET.address,
    assetType: "Asset",
    decimals: 18,
    id: ZFI_TOKEN_TESTNET.address,
    name: "Zybra Finance Token.",
    symbol: "ZFI",
    tokenId: null,
    tradedVolume: "1.134778601287855285"

  },
  {
    address: ZRUSD_TOKEN_TESTNET.address,
    assetType: "Asset",
    decimals: 18,
    id: ZRUSD_TOKEN_TESTNET.address,
    name: "Zybra USD.",
    symbol: "ZrUSD",
    tokenId: null,
    tradedVolume: "1.134778601287855285"

  },
  {
    address: "0x317beea02995097b323880126a4e2f9edeb42c23",
    assetType: "Security",
    decimals: 18,
    id: "0x317beea02995097b323880126a4e2f9edeb42c23",
    name: "TESLA INC.",
    symbol: "TSLA",
    tokenId: null,
    tradedVolume: "1.134778601287855285"

  },
  {
    address: "0x4ac5bf80241e46620bd50b3bff3625978d1a007a",
    assetType: "Security",
    decimals: 18,
    id: "0x4ac5bf80241e46620bd50b3bff3625978d1a007a",
    name: "NVIDIA CORPORATION",
    symbol: "NVDA",
    tokenId: null,
    tradedVolume: "2.456789012345678901"
  },
  {
    address: "0x2d458ae4af7bb63e1336890d4918fc3a1074b193",
    assetType: "Security",
    decimals: 18,
    id: "0x2d458ae4af7bb63e1336890d4918fc3a1074b193",
    name: "MICROSOFT CORPORATION",
    symbol: "MSFT",
    tokenId: null,
    tradedVolume: "1.789012345678901234",

  }
]
// const SwapButton = ({
//   loading,
//   isConnected,
//   isAmountTooLarge,
//   sellAmount,
//   buyAmount,
//   hasErrorInFields,
//   isValidPair,
//   priceImpact,
//   onConnect,
//   onSwap,
//   approvalState,
//   onApprove,
// }: SwapButtonProps) => {
//   const [isTransactionPending, setIsTransactionPending] = useState(false);

//   // Create a wrapped onSwap function that handles the loading state
//   const handleSwapWithLoading = async () => {
//     setIsTransactionPending(true);
//     try {
//       await onSwap();
//     } catch (error) {
//       console.error("Transaction failed:", error);
//     } finally {
//       setIsTransactionPending(false);
//     }
//   };

//   const buttonStates = {
//     loading: {
//       text: <LoadingSpinner />,
//       disabled: true,
//       className: "bg-gradient-to-r from-[#013853] to-[#024d74] opacity-80 shadow-md",
//       icon: null,
//       action: () => {},
//       show: loading,
//     },
//     transactionPending: {
//       text: "Processing Transaction...",
//       disabled: true,
//       className: "bg-gradient-to-r from-[#013853] to-[#024d74] opacity-80 shadow-md",
//       icon: <LoadingSpinner className="animate-spin" />,
//       action: () => {},
//       show: isTransactionPending,
//     },
//     notConnected: {
//       text: "Connect Wallet",
//       disabled: false,
//       className: "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae] shadow-md",
//       icon: <Wallet2Icon className="h-4 w-4 mr-2" />,
//       action: onConnect,
//       show: !isConnected,
//     },
//     insufficientBalance: {
//       text: "Insufficient Balance",
//       disabled: true,
//       className: "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 shadow-sm",
//       icon: <AlertTriangle className="h-4 w-4 mr-2" />,
//       action: () => {},
//       show: isAmountTooLarge,
//     },
//     needsApproval: {
//       text: approvalState === ApprovalState.PENDING ? "Approving..." : "Approve",
//       disabled: approvalState === ApprovalState.PENDING,
//       className: "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae] shadow-md",
//       icon: approvalState === ApprovalState.PENDING ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null,
//       action: onApprove,
//       show: approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING,
//     },
//     enterAmount: {
//       text: "Enter Amount",
//       disabled: true,
//       className: "bg-[#013853]/70 shadow-sm border border-[#022e45]/50",
//       icon: null,
//       action: () => {},
//       show: !sellAmount || !buyAmount,
//     },
//     invalidPair: {
//       text: "Invalid Trading Pair",
//       disabled: true,
//       className: "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30 shadow-sm",
//       icon: <AlertTriangle className="h-4 w-4 mr-2" />,
//       action: () => {},
//       show: !isValidPair,
//     },
//     readyToSwap: {
//       text: "Make Offer",
//       disabled: false,
//       className: "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae] shadow-md",
//       icon: <ArrowRightLeft className="h-4 w-4 mr-2" />,
//       action: handleSwapWithLoading,
//       show: true,
//     },
//   };

//   if (isTransactionPending) {
//     return (
//       <Button
//         className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-[#013853] to-[#024d74] opacity-80 shadow-md rounded-lg transition-all duration-200"
//         disabled={true}
//       >
//         <LoadingSpinner className="animate-spin" />
//         <span className="font-medium">Processing Transaction...</span>
//       </Button>
//     );
//   }

//   // Then use the existing priority order
//   const currentState =
//     Object.values(buttonStates).find((state) => state.show) || buttonStates.readyToSwap;

//   return (
//     <Button
//       className={`w-full h-10 flex items-center justify-center gap-2 ${currentState.className} rounded-lg font-medium transition-all duration-200`}
//       disabled={currentState.disabled}
//       onClick={currentState.action}
//     >
//       {currentState.icon}
//       {currentState.text}
//     </Button>
//   );
// };

interface SwapProps {
  isWithdraw: boolean;
  setActiveTab: (value: string) => void; // false for deposit, true for withdraw
}
export default function SwapPage({ setActiveTab, isWithdraw }: SwapProps) {
  const params = useSearchParams();
  const address = params?.get("address");
  const chainId = useChainId();
  const router = useRouter();

  const initialTokens: { [key: string]: Token } = {
    USDC: {
      id: "usd-coin",
      name: "USD Coin",
      symbol: "USDC",
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
      address: USDC_ADDRESS[chainId],
      chainId: chainId,
      decimals: 6,
      balance: 0,
    },
  };
  // const { swarmAssets: tokens } = useAppSelector((state) => state.application);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tokens: any = [
    {
      address: "0xd59eC2dc56898009668DA1D64b41d996EA1F027c",
      assetType: "Security",
      decimals: 18,
      id: "0xd59eC2dc56898009668DA1D64b41d996EA1F027c",
      name: "TESLA INC.",
      symbol: "TSLA",
      tokenId: null,
      tradedVolume: "1.134778601287855285",
    },
    {
      address: "0x8214c5638B5387289f3f5aA285ADAe93D513a130",
      assetType: "Security",
      decimals: 18,
      id: "0x8214c5638B5387289f3f5aA285ADAe93D513a130",
      name: "NVIDIA CORPORATION",
      symbol: "NVDA",
      tokenId: null,
      tradedVolume: "2.456789012345678901",
    },
    {
      address: "0x8bD541CfaE3d14B9dB5624588A972D3f443CFC63",
      assetType: "Security",
      decimals: 18,
      id: "0x8bD541CfaE3d14B9dB5624588A972D3f443CFC63",
      name: "MICROSOFT CORPORATION",
      symbol: "MSFT",
      tokenId: null,
      tradedVolume: "1.789012345678901234",
    },
  ];

  const { address: userAddress, walletType, zfi_balance } = useUserAccount();
  const { attemptReferralCompletion } = useReferralCompletion();
  const preSelectedToken: Token | undefined = useMemo(() =>
    tokens?.find((token: Token) => token?.address === address)
  , [tokens, address]);

  // =============== STATE MANAGEMENT ===============

  // Token selection state
  const [sellToken, setSellToken] = useState<Token>(
    !isWithdraw ? initialTokens.USDC : (preSelectedToken as Token)
  );
  const [buyToken, setBuyToken] = useState<Token>(
    isWithdraw ? initialTokens.USDC : (preSelectedToken as Token)
  );

  // Amount state
  const [sellAmount, setSellAmount] = useState(0);
  const [buyAmount, setBuyAmount] = useState(0);
  const [zRUSDAmount, setZRUSDAmount] = useState(0);

  // UI state
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [activeSide, setActiveSide] = useState<"sell" | "buy">("sell");
  // Price loading removed - price is calculated from user input ratio
  const [isAmountTooLarge, setIsAmountTooLarge] = useState(false);
  const [priceImpact, setPriceImpact] = useState("Market");
  const [expiry, setExpiry] = useState("1 week");

  // Offers and pricing state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [isDynamicPricing, setIsDynamicPricing] = useState(false);
  const [maxRate, setMaxRate] = useState<string>("");
  const [currentOfferId, setCurrentOfferId] = useState<number | null>(null);
  const [bestPrice, setBestPrice] = useState<number>(0);
  const [priceImpactPercentage, setPriceImpactPercentage] = useState<number>(0);

  // Enhanced price calculation based on offers and user input
  const currentPrice = useMemo(() => {
    if (filteredOffers.length > 0 && sellAmount > 0) {
      // Calculate weighted average price from selected offers
      const selectedOffersList = filteredOffers.filter(offer =>
        selectedOffers.includes(offer.offerId)
      );

      if (selectedOffersList.length > 0) {
        const totalValue = selectedOffersList.reduce((sum, offer) => sum + offer.total, 0);
        const totalAmount = selectedOffersList.reduce((sum, offer) => sum + offer.amount, 0);
        return totalAmount > 0 ? totalValue / totalAmount : 0;
      }
    }

    // Fallback to manual price calculation
    if (sellAmount > 0 && buyAmount > 0) {
      return sellAmount / buyAmount;
    }
    return 0;
  }, [filteredOffers, selectedOffers, sellAmount, buyAmount]);

  // Transaction feedback state
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<any | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // =============== HOOKS ===============

  // Get token balances
  const [tokenBalances, isLoadingTokenBalances] = useTokenBalancess(
    useMemo(() => [
      buyToken?.address,
      sellToken?.address,
      ZrUSD[chainId]
    ], [buyToken?.address, sellToken?.address, chainId]),
    userAddress
  );

  // Get approval state
  const {
    approvalState,
    approveCallback,
    loading: approvalLoading,
    error: approvalError,
    receipt: approvalReceipt,
  } = useApproveCallback(
    toWei(sellAmount),
    userAddress,
    SWARM_VAULT_ADDRESS[chainId],
    isWithdraw ? buyToken?.address : sellToken?.address,
    walletType,
    isWithdraw ? buyToken?.symbol : sellToken?.symbol,
  );

  // Get vault operations
  const {
    depositWithAsset,
    depositWithOfferId,
    withdrawWithAsset,
    withdraw,
    getUserAssets,
    loading: vaultLoading,
    error: vaultError,
    receipt,
  } = useSwarmVault(chainId);

  // Get UI elements
  const { swarmOffers } = useAppSelector((state) => state.application);
  const BuySymbol = useStockIcon(buyToken?.symbol);
  const SellSymbol = useStockIcon(sellToken?.symbol);

  // Use centralized smart account client with gas sponsorship
  const {
    client,
    isGasSponsored,
    isClientReady,
    sendUserOperationAsync,
    sendUserOperationResult,
  } = useSmartAccountClientSafe();

  // =============== DERIVED STATE ===============

  // Calculate token balances with proper decimal handling
  const sellToken_balance = useMemo(() => {
    const decimals = sellToken?.address?.toLowerCase() === USDC_ADDRESS[chainId]?.toLowerCase()
      ? 6
      : sellToken?.decimals;

    return fromWei(
      (tokenBalances as { [tokenAddress: string]: string })[sellToken?.address] ?? 0,
      decimals
    );
  }, [sellToken?.address, sellToken?.decimals, tokenBalances, chainId]);

  const buytoken_balance = useMemo(() => {
    const decimals = buyToken?.address?.toLowerCase() === USDC_ADDRESS[chainId]?.toLowerCase()
      ? 6
      : buyToken?.decimals;

    return fromWei(
      (tokenBalances as { [tokenAddress: string]: string })[buyToken?.address] ?? 0,
      decimals
    );
  }, [buyToken?.address, buyToken?.decimals, tokenBalances, chainId]);

  const zrusd_balance = useMemo(() =>
    fromWei((tokenBalances as { [tokenAddress: string]: string })[ZrUSD[chainId]] ?? 0),
    [tokenBalances, chainId]
  );

  // Get user asset data for the selected token
  const userAsset = getUserAssets(isWithdraw ? sellToken?.address : buyToken?.address);

  // =============== CALLBACKS ===============

  // Handle token selector open
  const openTokenSelector = useCallback((side: "sell" | "buy") => {
    // Prevent opening selector for locked positions
    if ((!isWithdraw && side === "sell") || (isWithdraw && side === "buy")) return;

    setActiveSide(side);
    setIsTokenSelectorOpen(true);
  }, [isWithdraw]);

  // Handle token selection
  const handleTokenSelect = useCallback((item: Token) => {
    const token = item as Token;

    if (isWithdraw) {
      // In withdraw mode, only buy token can be USDC
      if (activeSide === "sell") {
        setSellToken(token);
      }
    } else {
      // In deposit mode, only sell token can be USDC
      if (activeSide === "buy") {
        setBuyToken(token);
      }
    }

    setIsTokenSelectorOpen(false);
  }, [isWithdraw, activeSide]);

  // Calculate swap amounts based on price and impact (for legacy compatibility)
  const calculateSwapAmounts = useCallback((
    amount: number,
    isWithdrawCalc: boolean,
    priceImpactValue: string = "Market",
  ): number => {
    // This function is kept for compatibility but won't be used for auto-calculation
    // Users will manually set both sell and buy amounts
    if (!amount || !currentPrice) return 0;

    const impactMultiplier =
      priceImpactValue === "Market"
        ? 1
        : 1 + Number(priceImpactValue.replace("+", "").replace("%", "")) / 100;

    const adjustedPrice = currentPrice * impactMultiplier;

    if (isWithdrawCalc) {
      // Converting asset to USD
      return Number((amount * adjustedPrice).toFixed(2));
    } else {
      // Converting USD to asset
      return Number((amount / adjustedPrice).toFixed(6));
    }
  }, [currentPrice]);

  // Filter offers based on user input and automatically select best offers
  const filterAndSelectOffers = useCallback((
    availableOffers: Offer[],
    targetSellAmount: number,
    targetBuyAmount: number
  ) => {
    if (!availableOffers.length || (!targetSellAmount && !targetBuyAmount)) {
      return {
        filtered: availableOffers,
        selected: [],
        calculatedBuyAmount: 0,
        calculatedSellAmount: 0,
        bestPrice: 0,
        priceImpact: 0
      };
    }

    // Sort offers by best price (lowest price = best for buyer)
    const sortedOffers = [...availableOffers].sort((a, b) => a.price - b.price);

    let remainingAmount = targetSellAmount || 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    const selectedOfferIds: number[] = [];

    // If user specified sell amount, calculate buy amount from offers
    if (targetSellAmount > 0) {
      for (const offer of sortedOffers) {
        if (remainingAmount <= 0) break;

        const canTakeAmount = Math.min(remainingAmount, offer.availableAmount || offer.amount);
        const buyAmountFromOffer = canTakeAmount / offer.price;

        totalSellAmount += canTakeAmount;
        totalBuyAmount += buyAmountFromOffer;
        selectedOfferIds.push(offer.offerId);
        remainingAmount -= canTakeAmount;
      }
    }
    // If user specified buy amount, calculate sell amount from offers
    else if (targetBuyAmount > 0) {
      let remainingBuyAmount = targetBuyAmount;

      for (const offer of sortedOffers) {
        if (remainingBuyAmount <= 0) break;

        const canTakeAmount = Math.min(remainingBuyAmount, offer.availableAmount || offer.amount);
        const sellAmountForOffer = canTakeAmount * offer.price;

        totalBuyAmount += canTakeAmount;
        totalSellAmount += sellAmountForOffer;
        selectedOfferIds.push(offer.offerId);
        remainingBuyAmount -= canTakeAmount;
      }
    }

    // Calculate best price and price impact
    const bestPrice = sortedOffers.length > 0 ? sortedOffers[0].price : 0;
    const averagePrice = totalBuyAmount > 0 ? totalSellAmount / totalBuyAmount : 0;
    const priceImpact = bestPrice > 0 ? ((averagePrice - bestPrice) / bestPrice) * 100 : 0;

    return {
      filtered: sortedOffers,
      selected: selectedOfferIds,
      calculatedBuyAmount: totalBuyAmount,
      calculatedSellAmount: totalSellAmount,
      bestPrice,
      priceImpact: Math.max(0, priceImpact)
    };
  }, []);

  // Handle sell amount change with offer-based calculation
  const handleSellAmountChange = useCallback((value: number) => {
    setSellAmount(value);
    setActiveSide("sell");

    // Auto-calculate buy amount based on available offers
    if (value > 0 && offers.length > 0) {
      const result = filterAndSelectOffers(offers, value, 0);
      setBuyAmount(result.calculatedBuyAmount);
      setFilteredOffers(result.filtered);
      setSelectedOffers(result.selected);
      setBestPrice(result.bestPrice);
      setPriceImpactPercentage(result.priceImpact);

      // Set current offer ID to the best offer
      if (result.selected.length > 0) {
        setCurrentOfferId(result.selected[0]);
      }
    } else if (value === 0) {
      setBuyAmount(0);
      setSelectedOffers([]);
      setCurrentOfferId(null);
    }
  }, [offers, filterAndSelectOffers]);

  // Handle buy amount change with offer-based calculation
  const handleBuyAmountChange = useCallback((value: number) => {
    setBuyAmount(value);
    setActiveSide("buy");

    // Auto-calculate sell amount based on available offers
    if (value > 0 && offers.length > 0) {
      const result = filterAndSelectOffers(offers, 0, value);
      setSellAmount(result.calculatedSellAmount);
      setFilteredOffers(result.filtered);
      setSelectedOffers(result.selected);
      setBestPrice(result.bestPrice);
      setPriceImpactPercentage(result.priceImpact);

      // Set current offer ID to the best offer
      if (result.selected.length > 0) {
        setCurrentOfferId(result.selected[0]);
      }
    } else if (value === 0) {
      setSellAmount(0);
      setSelectedOffers([]);
      setCurrentOfferId(null);
    }
  }, [offers, filterAndSelectOffers]);

  // Handle max amount click
  const handleMaxClick = useCallback(() => {
    setSellAmount(isWithdraw ? fromWei(Number(userAsset.result?.[0])) : sellToken_balance);
  }, [isWithdraw, userAsset, sellToken_balance]);

  // Handle price impact change
  const handlePriceImpactChange = useCallback((impact: string) => {
    setPriceImpact(impact);
    setIsDynamicPricing(impact === "Market");

    if (impact !== "Market") {
      // Convert percentage to rate
      const percentage = parseInt(impact.replace("+", "").replace("%", ""));
      setMaxRate((1 + percentage / 100).toString());
    } else {
      setMaxRate("0");
    }
  }, []);

  // Handle expiry change
  const handleExpiryChange = useCallback((newExpiry: string) => {
    setExpiry(newExpiry);
  }, []);

  // Handle swap direction change
  const handleSwapStates = useCallback(() => {
    setActiveTab(isWithdraw ? "deposit" : "withdraw");
  }, [isWithdraw, setActiveTab]);

  // Handle wallet connection
  const handleConnectWallet = useCallback(() => {
    router.push("/signup");
  }, [router]);

  // Handle modal closures
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const handleApprovalSuccessClose = useCallback(() => {
    setApprovalSuccess(null);
  }, []);

  const handleTransactionSuccessClose = useCallback(() => {
    setTransactionSuccess(null);
  }, []);

  // =============== TRANSACTION HANDLERS ===============

  // Enhanced offer matching with better typing and filtering
  const getMatchingOffers = useCallback(() => {
    if (!swarmOffers || !sellToken || !buyToken) return [];

    return swarmOffers
      .filter((offer: {
        depositAsset: { symbol: string };
        withdrawalAsset: { symbol: string };
        sellAmount?: number;
        buyAmount?: number;
        amountIn?: string;
        amountOut?: string;
        availableAmount?: number;
        cancelled?: boolean;
        status?: string;
      }) => {
        // Check if offer is still valid
        if (offer.cancelled) return false;

        const isDepositMatch =
          offer.depositAsset.symbol.toUpperCase() === sellToken.symbol.toUpperCase();
        const isWithdrawalMatch =
          offer.withdrawalAsset.symbol.toUpperCase() === buyToken.symbol.toUpperCase();

        return isDepositMatch && isWithdrawalMatch;
      })
      .map((offer: {
        id: string;
        sellAmount?: number;
        buyAmount?: number;
        amountIn?: string;
        amountOut?: string;
        availableAmount?: number;
        rate?: number;
      }) => {
        // Handle different offer data formats
        const amountIn = offer.sellAmount || parseFloat(offer.amountIn || "0");
        const amountOut = offer.buyAmount || parseFloat(offer.amountOut || "0");
        const availableAmount = offer.availableAmount || amountOut;

        // Calculate price (how much sellToken per buyToken)
        const price = amountIn > 0 ? amountIn / amountOut : (offer.rate || 0);
        const total = amountOut * price;

        return {
          amount: amountOut,
          price,
          total,
          offerId: parseInt(offer.id),
          availableAmount,
          selected: false, // Start with unselected
        };
      })
      .sort((a, b) => a.price - b.price); // Sort by best price first
  }, [swarmOffers, sellToken, buyToken]);

  // Create offer parameters
  const createOfferParams = useCallback((expiryOption: string) => {
    // Calculate expiry based on selected expiry option
    let expirySeconds = 7 * 24 * 60 * 60; // Default 1 week
    switch (expiryOption) {
      case "1 day":
        expirySeconds = 24 * 60 * 60;
        break;
      case "1 month":
        expirySeconds = 30 * 24 * 60 * 60;
        break;
      case "1 year":
        expirySeconds = 365 * 24 * 60 * 60;
        break;
    }
    const expiryTimestamp = (Math.floor(Date.now() / 1000) + expirySeconds).toString();

    // Create offer parameters with proper typing
    return {
      takingOfferType: TakingOfferType.PartialOffer,
      unitPrice: "0",
      percentage: "100",
      percentageType: 0, // PercentageType.NoType
      specialAddresses: [],
      authorizationAddresses: [],
      expiryTimestamp,
      timelockPeriod: "0",
      terms: "",
      commsLink: "",
    };
  }, []);

  // Deposit transaction handler
  const handleDeposit = useCallback(async () => {
    if (!userAddress || isAmountTooLarge || !sellAmount || !zRUSDAmount) {
      setGlobalError(new Error("Invalid input parameters"));
      return;
    }

    setGlobalLoading(true);
    setGlobalError(null);

    try {
      if (currentOfferId) {
        // Handle deposit with offerId
        const assetAmountStr = buyAmount.toString();
        const mintAmount = zRUSDAmount.toString();

        await depositWithOfferId(
          sellToken.address,
          assetAmountStr,
          buyToken.symbol,
          currentOfferId,
          mintAmount,
          isDynamicPricing,
          maxRate || "0",
        );
      } else {
        // Handle deposit with asset
        const offerParams = createOfferParams(expiry);

        await depositWithAsset(
          sellToken.address,
          sellAmount,
          zRUSDAmount,
          buyAmount,
          isWithdraw ? sellToken.symbol : buyToken.symbol,
          isWithdraw ? buyToken.symbol : sellToken.symbol,
          0,
          0,
          offerParams,
        );
      }

      // Reset form state on success
      setSellAmount(0);
      setZRUSDAmount(0);
    } catch (err) {
      console.error("Deposit failed:", err);
      setGlobalError(err instanceof Error ? err : new Error("Deposit failed"));
    } finally {
      setGlobalLoading(false);
    }
  }, [
    userAddress, isAmountTooLarge, sellAmount, zRUSDAmount,
    currentOfferId, buyAmount, sellToken, buyToken,
    isDynamicPricing, maxRate, expiry, isWithdraw,
    depositWithOfferId, depositWithAsset, createOfferParams
  ]);

  // Withdraw transaction handler
  const handleWithdraw = useCallback(async () => {
    if (!userAddress || isAmountTooLarge || !sellAmount || !zRUSDAmount) {
      setGlobalError(new Error("Invalid input parameters"));
      return;
    }

    setGlobalLoading(true);
    setGlobalError(null);

    try {
      if (currentOfferId) {
        // Handle withdraw with offerId
        const withdrawAmount = buyAmount;

        await withdraw(
          currentOfferId,
          sellToken.address,
          withdrawAmount,
          sellToken.symbol,
          maxRate || "0",
          isDynamicPricing,
          "0x0000000000000000000000000000000000000000", // No affiliate
        );
      } else {
        // Handle withdraw with asset
        const offerParams = createOfferParams(expiry);

        await withdrawWithAsset(
          buyToken.address,
          sellAmount,
          zRUSDAmount,
          buyAmount,
          sellToken.symbol,
          0,
          0,
          offerParams,
        );
      }

      // Reset form state on success
      setBuyAmount(0);
      setZRUSDAmount(0);
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setGlobalError(err instanceof Error ? err : new Error("Withdrawal failed"));
    } finally {
      setGlobalLoading(false);
    }
  }, [
    userAddress, isAmountTooLarge, sellAmount, zRUSDAmount,
    currentOfferId, buyAmount, sellToken, buyToken,
    isDynamicPricing, maxRate, expiry,
    withdraw, withdrawWithAsset, createOfferParams
  ]);

  // Combined swap handler
  const handleSwap = useCallback(async () => {
    if (isWithdraw) {
      await handleWithdraw();
    } else {
      await handleDeposit();
    }
  }, [isWithdraw, handleWithdraw, handleDeposit]);

  // =============== EFFECTS ===============

  // Price is now calculated dynamically from sell/buy amounts ratio

  // Update success state from receipts - separate approval and transaction success
  useEffect(() => {
    if (approvalReceipt) {
      const txHash = typeof approvalReceipt === 'string'
        ? approvalReceipt
        : approvalReceipt.hash || approvalReceipt.message || approvalReceipt;

      console.log("Approval success with hash:", txHash);
      setApprovalSuccess({
        title: "Approval Confirmed",
        message: "Token approval has been confirmed on the blockchain",
        txHash: typeof txHash === 'string' ? txHash : (txHash?.hash || txHash?.message || String(txHash)),
      });
    }
  }, [approvalReceipt]);

  useEffect(() => {
    if (receipt) {
      const txHash = typeof receipt === 'string' ? receipt : receipt.hash || receipt;

      console.log("Transaction success with hash:", txHash);
      setTransactionSuccess({
        title: isWithdraw ? "Withdrawal Confirmed" : "Deposit Confirmed",
        message: isWithdraw
          ? "Your withdrawal transaction has been confirmed on the blockchain"
          : "Your deposit transaction has been confirmed on the blockchain",
        txHash: typeof txHash === 'string' ? txHash : (txHash?.hash || txHash?.message || String(txHash)),
      });

      // Complete referral if this is the user's first qualifying action
      attemptReferralCompletion(isWithdraw ? 'swap-withdraw' : 'swap-deposit');
    }
  }, [receipt, isWithdraw, attemptReferralCompletion]);

  // Update amount validation
  useEffect(() => {
    setIsAmountTooLarge(sellAmount > sellToken_balance);
  }, [sellAmount, sellToken_balance]);

  // Set initial token from URL
  useEffect(() => {
    if (address && preSelectedToken) {
      setBuyToken(preSelectedToken as Token);
    }
  }, [address, preSelectedToken]);

  // Find matching offers and update when tokens change
  useEffect(() => {
    const matchedOffers = getMatchingOffers();
    setOffers(matchedOffers);
    setFilteredOffers(matchedOffers);

    // Reset selections when offers change
    setSelectedOffers([]);
    setCurrentOfferId(null);
    setBestPrice(0);
    setPriceImpactPercentage(0);
  }, [getMatchingOffers]);

  // Update offer filtering when amounts change
  useEffect(() => {
    if (offers.length > 0 && (sellAmount > 0 || buyAmount > 0)) {
      const result = filterAndSelectOffers(
        offers,
        activeSide === "sell" ? sellAmount : 0,
        activeSide === "buy" ? buyAmount : 0
      );

      setFilteredOffers(result.filtered);
      setSelectedOffers(result.selected);
      setBestPrice(result.bestPrice);
      setPriceImpactPercentage(result.priceImpact);

      // Auto-update the opposite amount if offers are available
      if (activeSide === "sell" && result.calculatedBuyAmount > 0) {
        setBuyAmount(result.calculatedBuyAmount);
      } else if (activeSide === "buy" && result.calculatedSellAmount > 0) {
        setSellAmount(result.calculatedSellAmount);
      }

      // Set current offer ID to the best offer
      if (result.selected.length > 0) {
        setCurrentOfferId(result.selected[0]);
      }
    }
  }, [offers, sellAmount, buyAmount, activeSide, filterAndSelectOffers]);

  // Enhanced error handling with gasless transaction support
  useEffect(() => {
    if (approvalError) {
      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: approvalError
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    }

    if (vaultError) {
      const vaultErrorObj = typeof vaultError === 'string'
        ? new Error(vaultError)
        : (vaultError as Error);

      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: vaultErrorObj
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    }

    if (globalError) {
      const globalErrorObj = typeof globalError === 'string'
        ? new Error(globalError)
        : (globalError as Error);

      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: globalErrorObj
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    }
  }, [approvalError, vaultError, globalError, walletType, isGasSponsored, client]);

  return (
    <div className="flex-1 w-full text-white flex justify-center items-start py-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4">
        {/* Main Trading Card */}
        <Card className="w-full md:w-3/5 bg-[#001a26] backdrop-blur-md border border-[#022e45]/60 rounded-xl shadow-[0_4px_20px_rgba(0,10,20,0.25)] overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Price Panel */}
              {/* Price Component */}
              {/* Price Component with Background Image and Beta Box */}

              {/* Overlay gradient */}

              <div className="relative z-10 p-3 sm:p-4"> {/* Reduced padding on mobile */}
  {/* Header section with Beta tag */}
  <div className="flex justify-between items-center mb-1.5">
    <div className="text-xs sm:text-sm text-white/80 font-medium flex items-center gap-1">
      {/* Reduced gap for mobile */}
      When 1 <span className="text-[#4BB6EE] font-semibold">{buyToken?.symbol}</span> is worth
    </div>

    <div className="flex items-center gap-1 sm:gap-2"> {/* Reduced gap for mobile */}
      {/* Info Button - Smaller on mobile */}
      <div className="relative group">
        <div className="p-1 sm:p-1.5 bg-[#013853]/60 rounded-full hover:bg-[#013853] transition-colors cursor-pointer">
          <InfoIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#4BB6EE]" />
        </div>

        {/* Tooltip that appears on hover */}
        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#022B3F] text-white text-xs rounded-lg shadow-lg
          border border-[#034560] opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-300 z-50">
          <div className="font-medium text-[#4BB6EE] mb-1">Test Environment</div>
          <p>Currently, the prices shown are from testnet and do not represent real assets.</p>

          {/* Arrow pointing up */}
          <div className="absolute -top-2 right-3 w-0 h-0 border-l-8 border-r-8 border-b-8
            border-l-transparent border-r-transparent border-b-[#022B3F]"></div>
        </div>
      </div>

      {/* Golden BETA Badge - Same size on all screens */}
      <div className="px-3 py-0.5 bg-gradient-to-r from-amber-500/80 to-yellow-600/80 rounded-full text-xs text-amber-100 font-medium border border-amber-500/30 shadow-sm">
        BETA
      </div>

      {/* Swap direction button - Smaller on mobile */}
      <div className="p-1 sm:p-1.5 bg-[#013853]/60 rounded-full hover:bg-[#013853] transition-colors cursor-pointer">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowDownUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#4BB6EE]" />
        </motion.div>
      </div>
    </div>
  </div>

  {/* Price display - calculated from sell/buy ratio */}
  <div className="relative">
    <div className="w-full text-2xl sm:text-3xl px-0 font-semibold bg-transparent border-none outline-none appearance-none pr-16 h-9 flex items-center">
      <span className="text-white/90">
        {currentPrice > 0 ? currentPrice.toFixed(6) : "0.000000"}
      </span>
    </div>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-2.5 py-1 bg-[#013853]/40 rounded-md text-[#4BB6EE]">
      <span className="text-xs sm:text-sm font-medium">{sellToken?.symbol}</span>
    </div>

    {/* Helper text */}
    <div className="text-xs text-white/50 mt-1">
      Price calculated from sell/buy ratio
    </div>
  </div>
</div>


              {/* Sell Token Card */}
              <div className="relative">
                <div className="bg-[#001C29] rounded-xl border border-[#022e45]/70 overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-[#022e45]/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      <span className="text-white/90 font-medium">Sell</span>
                    </div>
                    <div className="text-xs text-[#4BB6EE]/80 flex items-center gap-1.5 bg-[#013853]/40 px-2 py-0.5 rounded-md">
                      <Wallet2Icon className="h-3 w-3" />
                      Balance: {" "}
                      {isWithdraw ? (
                        userAsset.loading ? (
                          <LoadingSpinner size="xs" color="blue" />
                        ) : (
                          <span className="font-medium">{fromWei(Number(userAsset.result?.[0]))}</span>
                        )
                      ) : isLoadingTokenBalances ? (
                        <LoadingSpinner size="xs" color="blue" />
                      ) : (
                        <span className="font-medium">{sellToken_balance}</span>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="relative">
                      <input
                        id="sell"
                        type="number"
                        placeholder="0"
                        value={sellAmount || ""}
                        onChange={(e) => handleSellAmountChange(Number(e.target.value))}
                        className="w-full no-spinner text-white/90 text-3xl px-0 font-semibold bg-transparent border-none outline-none appearance-none pr-32 focus:outline-none"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                        }}
                      />

                      <div className="absolute right-0 top-1 flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="xs"
                            className="px-3 py-1 h-7 bg-[#013853]/80 hover:bg-[#013853] text-[#4BB6EE] rounded transition-colors"
                            onClick={handleMaxClick}
                          >
                            Max
                          </Button>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-[#013853] border-[#034a70] text-white hover:bg-[#024d74] transition-colors shadow-sm rounded-md"
                            onClick={() => openTokenSelector("sell")}
                            disabled={!isWithdraw}
                          >
                            <div className="flex items-center gap-1.5">
                              {sellToken ? (
                                <div className="flex items-center">
                                  {SellSymbol && <SellSymbol className="h-4 w-4 mr-1" />}
                                  <span>{sellToken?.symbol}</span>
                                </div>
                              ) : (
                                <div className="inline-block mr-4 h-4 w-16 animate-pulse rounded bg-zinc-700" />
                              )}
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isAmountTooLarge && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-400 text-xs mt-1 flex items-center gap-1.5 bg-red-500/10 p-1 rounded-md"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Insufficient balance
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-1/2">
    <motion.div
      whileHover={{ scale: 1.08, boxShadow: "0 0 15px rgba(75,182,238,0.3)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="overflow-hidden rounded-full"
    >
      <Button
        variant="ghost"
        size="sm"
        className="!rounded-full bg-[#013853] w-9 h-9 sm:w-10 sm:h-10 border-[3px] border-[#022333] !p-[.4rem] shadow-lg hover:bg-[#024d74] transition-colors"
        onClick={handleSwapStates}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <motion.div
          animate={{ rotate: [0, 180] }}
          transition={{ duration: 0.5, repeat: 0 }}
        >
          <ArrowDownUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#4BB6EE]" />
        </motion.div>
      </Button>
    </motion.div>
  </div>
</div>

              {/* Buy Token Card */}
              <div className="bg-[#001C29] rounded-xl border border-[#022e45]/70 overflow-hidden mt-2">
                <div className="flex justify-between items-center p-3 border-b border-[#022e45]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    <span className="text-white/90 font-medium">Buy</span>
                  </div>
                  <div className="text-xs text-[#4BB6EE]/80 flex items-center gap-1.5 bg-[#013853]/40 px-2 py-0.5 rounded-md">
                    <Wallet2Icon className="h-3 w-3" />
                    Balance: {" "}
                    {!isLoadingTokenBalances ? (
                      <span className="font-medium">{buytoken_balance}</span>
                    ) : (
                      <LoadingSpinner size="xs" color="blue" />
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="relative">
                    <input
                      id="buy"
                      type="number"
                      placeholder="0"
                      value={buyAmount || ""}
                      onChange={(e) => handleBuyAmountChange(Number(e.target.value))}
                      className="w-full no-spinner text-white/90 text-3xl px-0 font-semibold bg-transparent border-none outline-none appearance-none pr-32 focus:outline-none"
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                      }}
                    />

                    <div className="absolute right-0 top-1 flex items-center gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="xs"
                          className="px-3 py-1 h-7 bg-[#013853]/80 hover:bg-[#013853] text-[#4BB6EE] rounded transition-colors"
                          onClick={handleMaxClick}
                        >
                          Max
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 bg-[#013853] border-[#034a70] text-white hover:bg-[#024d74] transition-colors shadow-sm rounded-md"
                          onClick={() => openTokenSelector("buy")}
                          disabled={isWithdraw}
                        >
                          <div className="flex items-center gap-1.5">
                            {buyToken ? (
                              <div className="flex items-center">
                                {BuySymbol && <BuySymbol className="h-4 w-4 mr-1" />}
                                <span>{buyToken?.symbol}</span>
                              </div>
                            ) : (
                              <div className="inline-block mr-4 h-4 w-16 animate-pulse rounded bg-zinc-700" />
                            )}
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isAmountTooLarge && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-400 text-xs mt-1 flex items-center gap-1.5 bg-red-500/10 p-1 rounded-md"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Insufficient balance
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Expiry Options */}
              <div className="mt-4 sm:mt-5">
  <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
    <span className="w-1.5 h-1.5 bg-[#4BB6EE] rounded-full"></span>
    <Label className="text-white/80 font-medium text-xs sm:text-sm">Expiry</Label>
  </div>

  <div className="flex flex-wrap gap-1.5 sm:gap-2">
    {["1 day", "1 week", "1 month", "1 year"].map((period) => (
      <motion.div
        key={period}
        whileHover={{ scale: expiry !== period ? 1.05 : 1 }}
        whileTap={{ scale: expiry !== period ? 0.95 : 1 }}
      >
        <Button
          variant={expiry === period ? "active" : "outlineSecondary"}
          size="xs"
          className={`text-[10px] sm:text-xs transition-all px-2 sm:px-3 py-0.5 sm:py-1 h-6 sm:h-7 ${expiry === period
            ? "bg-[#065C92] text-white border-[#076eae] shadow-md"
            : "bg-[#031D2A] text-white/70 border-[#022e45] hover:bg-[#042739]"
            }`}
          onClick={() => handleExpiryChange(period)}
        >
          {period}
        </Button>
      </motion.div>
    ))}
  </div>
</div>

              {/* ZrUSD Section */}
              <div
                className={`bg-[#001C29] rounded-xl overflow-hidden border ${zRUSDAmount <= 0
                  ? "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                  : "border-[#022e45]/70"
                  }`}
              >
                <div className="flex justify-between items-center p-3 border-b border-[#022e45]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    <span className="text-white/90 font-medium">
                      {isWithdraw ? "Redeem ZrUSD" : "Receive ZrUSD"}
                    </span>
                  </div>
                  <div className="text-xs text-[#4BB6EE]/80 flex items-center gap-1.5 bg-[#013853]/40 px-2 py-0.5 rounded-md">
                    <ZRUSDIcon width={15} height={15}  />

                    ZrUSD: {" "}
                    {!isLoadingTokenBalances ? (
                      <span className="font-medium">{zrusd_balance}</span>
                    ) : (
                      <LoadingSpinner size="xs" color="blue" />
                    )}
                  </div>
                </div>


                <div className="px-4 py-3">
                  <div className="relative">
                    <input
                      id="zrusd"
                      type="number"
                      placeholder="0.000"
                      // Convert 0 to empty string to avoid showing "0" in the input
                      value={zRUSDAmount === 0 ? "" : zRUSDAmount}
                      onChange={(e) => {
                        // If input is empty, set to 0
                        if (e.target.value === "") {
                          setZRUSDAmount(0);
                          return;
                        }

                        // Remove any leading zeros and parse as number
                        const inputValue = e.target.value.replace(/^0+/, '');
                        const newValue = parseFloat(inputValue);

                        if (isNaN(newValue)) {
                          return; // Ignore invalid inputs
                        }

                        // Assuming sellToken is your USDC amount
                        const maxZRUSDAmount = sellAmount * 0.625; // 62.5% of USDC (100/160)

                        // Only update if the value is within limits
                        if (newValue <= maxZRUSDAmount) {
                          setZRUSDAmount(newValue);
                        } else {
                          // If user tries to enter more than max, set to max
                          setZRUSDAmount(maxZRUSDAmount);
                        }
                      }}
                      className="w-full no-spinner text-white/90 text-2xl px-0 font-semibold bg-transparent border-none outline-none appearance-none pr-24 focus:outline-none"
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                      }}
                    />

                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <span className="text-sm text-[#4BB6EE] font-medium flex items-center">
                        ZrUSD
                      </span>
                      {isWithdraw && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs bg-[#013853]/80 hover:bg-[#013853] text-[#4BB6EE] px-3 py-0.5 rounded transition-colors"
                            onClick={() => {
                              const maxAmount = sellAmount * 0.625;
                              setZRUSDAmount(maxAmount);
                            }}
                          >
                            MAX
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Show warning only when there's no value */}
                  {zRUSDAmount === 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-start space-x-2 mt-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded-md"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <p>
                        Enter your borrowing ZrUSD Amount. Adding ZrUSD without borrowing may affect
                        your position.
                      </p>
                    </motion.div>
                  )}

                  {/* Display section */}
                  <div className="text-xs text-[#4BB6EE]/70 flex items-center gap-1 mt-2">
                    <div className="w-1 h-1 bg-[#4BB6EE]/70 rounded-full"></div>
                    Maximum available: {(sellAmount * 0.625).toFixed(2)} ZrUSD
                  </div>
                </div>

                {/* For displaying the value elsewhere (without leading zeros): */}

              </div>

              {/* Action Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full mt-4"
              >
                <Button
                  className={`w-full h-10 flex items-center justify-center gap-2
                    ${!userAddress ? "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae]" :
                      isAmountTooLarge ? "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30" :
                        approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ?
                          "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae]" :
                          !sellAmount || !buyAmount ? "bg-[#013853]/70 border border-[#022e45]/50" :
                            "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae]"}
                    shadow-md rounded-md font-medium transition-all duration-200`}
                  disabled={
                    !!approvalLoading ||
                    !!globalLoading ||
                    !!isAmountTooLarge ||
                    !!((!sellAmount || !buyAmount) && userAddress)
                  }
                  onClick={
                    !userAddress ? handleConnectWallet :
                      (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) ? approveCallback :
                        handleSwap
                  }
                >
                  {approvalLoading || globalLoading ? (
                    <>
                      <LoadingSpinner size="xs" color="white" />
                      <span>Processing...</span>
                    </>
                  ) : !userAddress ? (
                    <>
                      <Wallet2Icon className="h-4 w-4 mr-1" />
                      Connect Wallet
                    </>
                  ) : isAmountTooLarge ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Insufficient Balance
                    </>
                  ) : approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
                    approvalState === ApprovalState.PENDING ? (
                      <>
                        <LoadingSpinner size="xs" color="white" className="mr-1" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )
                  ) : !sellAmount || !buyAmount ? (
                    "Enter Amount"
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-1" />
                      Make Offer
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Warning Message */}
              <div className="bg-[#021A27] p-3 rounded-lg text-xs text-white/70 flex items-start space-x-2 border border-[#022e45]/40 mt-3">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p>
                  Limits may not execute exactly when tokens reach the specified price.{" "}
                  <a href="#" className="text-[#4BB6EE] hover:text-[#65c7f7] transition-colors hover:underline">
                    Learn more
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Section - Always show on the right side */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-2/5 h-fit sticky top-4"
        >
          <TradingCard
            fromSymbol={sellToken?.symbol || ""}
            fromAmount={sellAmount}
            toSymbol={buyToken?.symbol || ""}
            toAmount={buyAmount}
            FromLogo={SellSymbol}
            ToLogo={BuySymbol}
            avgPrice={currentPrice}
            offers={filteredOffers.length > 0 ? filteredOffers : offers}
            selectedOffers={selectedOffers}
            bestPrice={bestPrice}
            priceImpact={priceImpactPercentage}
            setCurrentOfferId={setCurrentOfferId}
            onOfferSelectionChange={(selectedIds: number[]) => {
              setSelectedOffers(selectedIds);
              if (selectedIds.length > 0) {
                setCurrentOfferId(selectedIds[0]);
              } else {
                setCurrentOfferId(null);
              }
            }}
          />
        </motion.div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!globalError}
        onClose={() => setGlobalError(null)}
        title="Error"
        message={globalError?.message ?? globalError}
      />

      {/* Approval Success Modal */}
      <SuccessModal
        isOpen={approvalSuccess != null && approvalSuccess.txHash != null}
        onClose={handleApprovalSuccessClose}
        title={approvalSuccess?.title || "Approval Successful"}
        message={approvalSuccess?.message || "Token approval successful"}
        txHash={approvalSuccess?.txHash}
        chainId={chainId}
      />

      {/* Transaction Success Modal */}
      <SuccessModal
        isOpen={transactionSuccess != null && transactionSuccess.txHash != null}
        onClose={handleTransactionSuccessClose}
        title={transactionSuccess?.title || "Transaction Successful"}
        message={transactionSuccess?.message || "Transaction completed successfully"}
        txHash={transactionSuccess?.txHash}
        chainId={chainId}
      />

      {isTokenSelectorOpen && (
        <TokenSelector
          onSelect={handleTokenSelect} onClose={() => setIsTokenSelectorOpen(false)} items={TokenList}
          type="token"
          title="Token List" />
      )}

      {/* Funding Helper for Account Kit */}
      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </div>
  );
}
