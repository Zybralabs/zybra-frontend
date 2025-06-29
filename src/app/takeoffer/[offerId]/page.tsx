"use client";

import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect, type ChangeEvent, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserAccount } from "@/context/UserAccountContext";
import { OfferQuery } from "@/hooks/useSwarmQl";
import { useApolloClient, useQuery } from "@apollo/client";
import { useStockIcon } from "@/hooks/useStockIcon";
import { useSwarmVault } from "@/hooks/useSwarmVault";
import { useChainId } from "wagmi";
import { ErrorModal, SuccessModal } from "@/components/Modal";
import { SupportedChainId, SWARM_VAULT_ADDRESS, USDC_ADDRESS } from "@/constant/addresses";
import { toWei } from "@/hooks/formatting";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import { WalletType } from "@/constant/account/enum";
import FundingHelper from "@/components/AccountKit/FundingHelper";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";

interface Asset {
  symbol: string;
  name?: string;
  address: string;
  decimals: number;
}

interface TradeData {
  id: string;
  sellAmount: string;
  buyAmount: string;
  networkCost: string;
  maxAmount: string;
  depositAsset: Asset;
  withdrawalAsset: Asset;
  expiryTimestamp: number;
  authorizationAddresses: string[];
  cancelled: boolean;
}

export default function TakeOffer({ params }: { params: Promise<{ offerId: string }> }) {
  const router = useRouter();
  const { address, baseSepoliaOffers, getBaseSepoliaOffer, walletType } = useUserAccount();
  const chainId = useChainId();

  // State management
  const [tradeState, setTradeState] = useState({
    isTrading: false,
    tradeData: null as TradeData | null,
    sellAmount: '',
    buyAmount: '',
    price: 0,
    loading: false,
    showSuccessModal: false,
    showErrorModal: false,
    modalError: null as Error | null
  });
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // Use centralized smart account client with gas sponsorship
  const {
    client,
    isGasSponsored,
    isClientReady,
    sendUserOperationAsync,
    sendUserOperationResult,
  } = useSmartAccountClientSafe();

  // Destructure state for convenience
  const {
    isTrading, tradeData, sellAmount, buyAmount, price,
    loading, showSuccessModal, showErrorModal, modalError
  } = tradeState;

  // Memoize offerId to prevent unnecessary re-fetching
  const offerId = useMemo(async () => (await params).offerId, [params]);

  // Contract interactions
  const {
    depositWithOfferId,
    withdraw,
    loading: txLoading,
    receipt,
    error: txError,
  } = useSwarmVault(chainId);

  // Fetch offer data from GraphQL if needed
  const {
    data,
    loading: isLoading,
    error: queryError,
  } = useQuery(OfferQuery, {
    variables: { id: offerId || "" },
    skip: !offerId || chainId === 84532, // Skip GraphQL query for Base Sepolia
  });

  // Approval handling
  const {
    approvalState,
    approveCallback,
    loading: approvalLoading,
    error: approvalError,
    receipt: approvalReceipt,
  } = useApproveCallback(
    toWei(Number(sellAmount)),
    address,
    SWARM_VAULT_ADDRESS[chainId as SupportedChainId],
    tradeData?.depositAsset.address,
    walletType,
    tradeData?.depositAsset?.symbol ?? "TSLA"
  );

  // Icons for assets
  const BuyIcon = useStockIcon(tradeData?.withdrawalAsset.symbol);
  const SellIcon = useStockIcon(tradeData?.depositAsset.symbol);

  // Update state with a partial state object
  const updateTradeState = useCallback((newState: Partial<typeof tradeState>) => {
    setTradeState(prevState => ({ ...prevState, ...newState }));
  }, []);

  // Initialize trade data from GraphQL
  const initializeDataFromGraphQL = useCallback(() => {
    if (!data?.offer) return;

    const offerData = data.offer;
    const amountIn = parseFloat(offerData.amountIn);
    const amountOut = parseFloat(offerData.amountOut);
    const calculatedPrice = amountIn > 0 ? amountOut / amountIn : 0;

    updateTradeState({
      price: calculatedPrice,
      sellAmount: '',
      buyAmount: '0',
      tradeData: {
        id: offerData.id,
        sellAmount: offerData.amountIn,
        buyAmount: offerData.amountOut,
        networkCost: "0.0023",
        maxAmount: offerData.availableAmount || offerData.amountIn,
        expiryTimestamp: parseInt(offerData.expiryTimestamp),
        depositAsset: offerData.depositAsset,
        withdrawalAsset: offerData.withdrawalAsset,
        authorizationAddresses: offerData.authorizationAddresses,
        cancelled: !!offerData.cancelledAt,
      }
    });
  }, [data, updateTradeState]);

  // Fetch Base Sepolia offer data
  const fetchBaseSepoliaOffer = useCallback(async () => {
    if (!offerId) return;

    try {
      updateTradeState({ loading: true });

      // Try to find the offer in cached offers first
      let offer: any = baseSepoliaOffers?.find(async item => item.id === await offerId);

      // Fetch if not in cache
      if (!offer) {
        offer = await getBaseSepoliaOffer(await offerId);
      }

      if (!offer) {
        throw new Error("Offer not found");
      }

      const {
        id,
        sell_amount,
        sell_currency,
        buy_amount,
        buy_currency,
        expiry_timestamp,
        deposit_asset_address,
        withdrawal_asset_address,
        cancelled,
        authorizationAddresses,
      } = offer;

      const calculatedPrice = sell_amount > 0 ? sell_amount / buy_amount : 0;

      updateTradeState({
        price: calculatedPrice,
        sellAmount: '',
        buyAmount: '0',
        tradeData: {
          id,
          sellAmount: buy_amount.toString(),
          buyAmount: sell_amount.toString(),
          networkCost: "0.0023",
          maxAmount: buy_amount.toString(),
          expiryTimestamp: expiry_timestamp,
          depositAsset: {
            symbol: buy_currency,
            address: withdrawal_asset_address,
            decimals: 2,
          },
          withdrawalAsset: {
            symbol: sell_currency,
            address: deposit_asset_address,
            decimals: 2,
          },
          cancelled,
          authorizationAddresses,
        }
      });
    } catch (error) {
      console.error("Error fetching Base Sepolia offer:", error);
      updateTradeState({ modalError: error as Error });
    } finally {
      updateTradeState({ loading: false });
    }
  }, [offerId, baseSepoliaOffers, getBaseSepoliaOffer, updateTradeState]);

  // Helper functions
  const isOfferValid = useCallback((offer: TradeData | null): boolean => {
    if (!offer) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return (
      !offer.cancelled &&
      offer.expiryTimestamp > currentTime &&
      parseFloat(offer.sellAmount) > 0
    );
  }, []);

  const canTakeOffer = useCallback((): boolean => {
    if (!tradeData || !address) return false;

    return (
      isOfferValid(tradeData) &&
      (!tradeData.authorizationAddresses?.length ||
       tradeData.authorizationAddresses.includes(address))
    );
  }, [tradeData, address, isOfferValid]);

  const calculateBuyAmount = useCallback((sellValue: string): string => {
    if (!tradeData || !sellValue) return '0';

    const parsedValue = parseFloat(sellValue);
    if (isNaN(parsedValue) || parsedValue <= 0) return '0';

    const calculatedAmount = parsedValue * price;
    return calculatedAmount.toFixed(tradeData.withdrawalAsset.decimals);
  }, [tradeData, price]);

  const isValidAmount = useCallback((amount: string): boolean => {
    if (!tradeData) return false;

    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= parseFloat(tradeData.sellAmount);
  }, [tradeData]);

  const formatAmount = useCallback((amount: string | number, decimals: number = 18): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(decimals);
  }, []);

  const getOfferStateMessage = useCallback((): string => {
    if (!tradeData || !address) return "Invalid Offer";

    if (tradeData.cancelled) return "Offer Cancelled";
    if (tradeData.expiryTimestamp <= Math.floor(Date.now() / 1000)) return "Offer Expired";
    if (parseFloat(tradeData.sellAmount) <= 0) return "No Available Amount";
    if (
      tradeData?.authorizationAddresses?.length &&
      !tradeData.authorizationAddresses.includes(address)
    ) return "Not Authorized";

    return "Take Offer";
  }, [tradeData, address]);

  // Event handlers
  const handleSellAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (!tradeData) return;

    const maxAmount = parseFloat(tradeData.sellAmount);
    const parsedValue = parseFloat(value || "0");

    const newSellAmount = parsedValue > maxAmount ? maxAmount.toString() : value;
    const newBuyAmount = calculateBuyAmount(newSellAmount);

    updateTradeState({
      sellAmount: newSellAmount,
      buyAmount: newBuyAmount
    });
  }, [tradeData, calculateBuyAmount, updateTradeState]);

  const handleMaxClick = useCallback(() => {
    if (!tradeData) return;

    const maxAmount = tradeData.sellAmount;
    updateTradeState({
      sellAmount: maxAmount,
      buyAmount: calculateBuyAmount(maxAmount)
    });
  }, [tradeData, calculateBuyAmount, updateTradeState]);

  const handleTrade = useCallback(async () => {
    if (!tradeData || !isValidAmount(sellAmount) || !address) return;

    updateTradeState({ isTrading: true });

    try {
      // Validation checks
      const currentTime = Math.floor(Date.now() / 1000);
      if (tradeData.expiryTimestamp < currentTime) {
        throw new Error("Offer has expired");
      }

      if (tradeData.cancelled) {
        throw new Error("Offer has been cancelled");
      }

      if (
        tradeData.authorizationAddresses?.length &&
        !tradeData.authorizationAddresses.includes(address)
      ) {
        throw new Error("Address not authorized to take this offer");
      }

      // Check if approval is needed
      if (approvalState === ApprovalState.NOT_APPROVED) {
        await approveCallback();
        return; // Exit after approval, user will need to click again to execute trade
      }

      // Execute trade based on asset type
      const isUSDC = tradeData.depositAsset.address.toLowerCase() ===
                     USDC_ADDRESS[chainId]?.toLowerCase();

      if (parseFloat(tradeData.sellAmount) > 0) {
        if (isUSDC) {
          await depositWithOfferId(
            tradeData.depositAsset.address,
            formatAmount(sellAmount),
            tradeData.withdrawalAsset.symbol ?? "TSLA",
            parseInt(tradeData.id),
            formatAmount(buyAmount),
            false,
            "0",
          );
        } else {
          await withdraw(
            parseInt(tradeData.id),
            tradeData.depositAsset.address,
            Number(sellAmount),
            tradeData.depositAsset.symbol ?? "TSLA",
            buyAmount,
            false,
            "0",
          );
        }
      }

      // Reset fields on success
      updateTradeState({
        showSuccessModal: true,
        sellAmount: '',
        buyAmount: ''
      });
    } catch (err) {
      console.error("Trade failed:", err);
      const errorMessage = (err as Error).message || "Trade failed";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else {
        updateTradeState({
          modalError: err as Error,
          showErrorModal: true
        });
      }
    } finally {
      updateTradeState({ isTrading: false });
    }
  }, [
    tradeData, sellAmount, buyAmount, address, chainId, isValidAmount,
    approvalState, approveCallback, formatAmount, depositWithOfferId,
    withdraw, updateTradeState
  ]);

  // Get button configuration
  const getButtonConfig = useCallback(() => {
    if (!address) {
      return {
        text: "Connect Wallet",
        disabled: true
      };
    }

    if (!sellAmount || !isValidAmount(sellAmount)) {
      return {
        text: "Enter valid amount",
        disabled: true
      };
    }

    if (!canTakeOffer()) {
      return {
        text: getOfferStateMessage(),
        disabled: true
      };
    }

    if (approvalState === ApprovalState.NOT_APPROVED) {
      return {
        text: `Approve ${tradeData?.depositAsset.symbol}`,
        disabled: false,
        onClick: handleTrade
      };
    }

    if (approvalState === ApprovalState.PENDING) {
      return {
        text: "Approval Pending...",
        disabled: true
      };
    }

    return {
      text: "Take Offer",
      disabled: false,
      onClick: handleTrade
    };
  }, [
    address, sellAmount, isValidAmount, canTakeOffer,
    getOfferStateMessage, approvalState, tradeData, handleTrade
  ]);

  // Modal handlers
  const closeSuccessModal = useCallback(() => {
    updateTradeState({ showSuccessModal: false });
  }, [updateTradeState]);

  const closeErrorModal = useCallback(() => {
    updateTradeState({ showErrorModal: false, modalError: null });
  }, [updateTradeState]);

  // Effects
  useEffect(() => {
    if (data?.offer) {
      initializeDataFromGraphQL();
    }
  }, [data, initializeDataFromGraphQL]);

  useEffect(() => {
    if (chainId === 84532 || !data) {
      fetchBaseSepoliaOffer();
    }
  }, [chainId, fetchBaseSepoliaOffer, data]);

  // Update button config when relevant state changes
  const buttonConfig = getButtonConfig();

  return (
    <div className="min-h-screen  p-4 flex items-center justify-center relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute bottom-0 w-full h-96 bg-gradient-to-t from-blue-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[800px] w-full"
             style={{
               backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
               backgroundSize: '120% 120%'
             }} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-400 border-t-transparent mb-3"></div>
          <h1 className="text-white font-medium">Loading...</h1>
        </div>
      ) : tradeData ? (
        <Card className="w-full max-w-md bg-gradient-to-b from-[#0f2744]/95 to-[#091a2f]/95 text-white shadow-xl rounded-xl overflow-hidden border border-[#1e3a5f]/50 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="text-xl font-semibold text-blue-300">
                Take offer #{tradeData?.id}
              </span>
            </div>

            {/* Sell Section */}
            <div className="space-y-3 bg-[#0a1928]/50 p-4 rounded-lg border border-[#1e3a5f]/30">
              <span className="text-sm text-blue-200 font-medium">Sell</span>
              <div className="relative">
                {isLoading ? (
                  <div className="h-12 w-full animate-pulse rounded-lg bg-[#1e3a5f]/50" />
                ) : (
                  <>
                    <input
                      type="text"
                      value={sellAmount}
                      onChange={handleSellAmountChange}
                      className="w-full bg-[#0a1928]/80 text-2xl font-bold tracking-tight outline-none focus:ring-1 focus:ring-blue-500/50 rounded-lg py-2 px-3"
                      placeholder="0.00"
                    />
                    <button
                      onClick={handleMaxClick}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors"
                    >
                      MAX
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {SellIcon ? <SellIcon /> : <CircleDollarSign className="h-5 w-5 text-blue-400" />}
                  <span className="font-medium">
                    {tradeData?.depositAsset.symbol || "Loading..."}
                  </span>
                </div>
                <span className="text-sm text-gray-300">
                  Available:{" "}
                  {isLoading ? (
                    <div className="inline-block h-4 w-20 animate-pulse rounded bg-[#1e3a5f]/50" />
                  ) : (
                    formatAmount(tradeData?.maxAmount || "0", tradeData?.depositAsset.decimals)
                  )}
                </span>
              </div>
            </div>

            {/* Buy Section */}
            <div className="space-y-3 bg-[#0a1928]/50 p-4 rounded-lg border border-[#1e3a5f]/30">
              <span className="text-sm text-blue-200 font-medium">Buy</span>
              <div className="text-2xl font-bold tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-32 animate-pulse rounded-lg bg-[#1e3a5f]/50" />
                ) : (
                  <span className="text-green-400">
                    {formatAmount(buyAmount, tradeData?.withdrawalAsset.decimals)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {BuyIcon ? (
                    <BuyIcon />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-green-500/80 flex items-center justify-center">
                      <span className="text-white text-xs">↑</span>
                    </div>
                  )}
                  <span className="font-medium">
                    {tradeData?.withdrawalAsset.symbol || "Loading..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm p-4 bg-[#0a1928]/30 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-400">Rate:</span>
                <span className="font-medium text-white">
                  {!isLoading && tradeData ? (
                    `1 ${tradeData.depositAsset.symbol} = ${price.toFixed(4)} ${tradeData.withdrawalAsset.symbol}`
                  ) : (
                    <div className="inline-block h-4 w-16 animate-pulse rounded bg-[#1e3a5f]/50" />
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Network cost</span>
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                ) : (
                  <span className="font-medium text-white">
                    {tradeData?.networkCost} {tradeData?.depositAsset.symbol}
                  </span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Expires:</span>
                <span className="font-medium text-white">
                  {!isLoading && tradeData ? (
                    new Date(tradeData?.expiryTimestamp * 1000).toLocaleString()
                  ) : (
                    <div className="inline-block h-4 w-16 animate-pulse rounded bg-[#1e3a5f]/50" />
                  )}
                </span>
              </div>

              {address &&
                tradeData?.authorizationAddresses?.length > 0 &&
                !tradeData.authorizationAddresses.includes(address) && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 text-amber-300 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Authorized addresses only</span>
                  </div>
                )}
            </div>

            {/* Action Button */}
            <Button
              disabled={
                isLoading ||
                txLoading ||
                isTrading ||
                buttonConfig.disabled ||
                approvalLoading ||
                !sellAmount ||
                sellAmount === "0"
              }
              onClick={buttonConfig.onClick}
              className="w-full py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-blue-600/50 disabled:to-blue-500/50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out rounded-lg shadow-lg"
            >
              {isLoading || txLoading || isTrading || approvalLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                buttonConfig.text || "Enter valid amount"
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="text-white text-xl font-medium p-6 bg-red-500/20 rounded-xl border border-red-500/30">
          Offer not found
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        title="Transaction Failed"
        message={modalError?.message || "Something went wrong. Please try again."}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={closeSuccessModal}
        title="Transaction Successful"
        message="Offer taken successfully!"
        txHash={receipt}
        chainId={chainId}
      />

      {/* Funding Helper for Account Kit */}
      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </div>
  );
}
