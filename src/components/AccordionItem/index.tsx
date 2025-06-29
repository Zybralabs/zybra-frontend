import React, { useEffect, useState } from "react";
import {
  AccordionContent,
  AccordionTrigger,
  AccordionItem as ShadcnAccordionItem,
} from "../ui/accordion";
import { TeslaFilledIcon, USDCIcon } from "../Icons";
import { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import { Share2Icon, SquareArrowOutUpRight, WalletIcon } from "lucide-react";
import Link from "next/link";
import { shortenText } from "@/utils/formatters";
import { useStockIcon } from "@/hooks/useStockIcon";
import { toast } from "../ui/use-toast";
import { TakingOfferTypeEnum } from "../MainOffer/types/trading";
import { LoadingSpinner } from "../Modal/loading-spinner";
import { useSwarmVault } from "@/hooks/useSwarmVault";
import { SupportedChainId } from "@/constant/addresses";
import { Button } from "../ui/button";
import { WalletType } from "@/constant/account/enum";
import { useUserAccount } from "@/context/UserAccountContext";

import FundingHelper from "@/components/AccountKit/FundingHelper";

interface AccordionItemProps {
  itemValue: string;
  status: StatusEnum;
  type?: string;
  expiry?: number;
  filled?: string;
  offerId?: string;
  offerLink?: string;
  offerMaker?: string;
  pvtAdd?: string[];
  qualifier?: string[];
  shareLink?: string;
  toBuy?: string;
  toSell?: string;
  buyCurrency?: string;
  sellCurrency?: string;
  sellAmount?: number;
  buyAmount?: number;
  takingOfferType?: TakingOfferTypeEnum;
  rate?: number;
  isMyOffer?: boolean; // New prop
  isFilled: boolean;
  chainId: number | undefined;
}

function CurrencyRow({ Icon, label, amount, currency, color }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 flex items-center justify-center">
        {Icon ? (
          <Icon className={`text-${color}-500`} />
        ) : (
          <span className={`text-xs text-${color}-500`}>{label[0]}</span>
        )}
      </div>
      <span className={`text-${color}-500`}>{label}</span>
      <span className="text-gray-200">
        {amount} {currency}
      </span>
    </div>
  );
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  itemValue,
  status,
  type,
  expiry,
  filled,
  offerId,
  offerLink = "",
  offerMaker,
  pvtAdd,
  qualifier,
  shareLink = "",
  toBuy,
  toSell,
  buyCurrency,
  sellCurrency,
  sellAmount,
  buyAmount,
  takingOfferType,
  rate,
  isMyOffer = false,
  isFilled,
  chainId,
}) => {
  const SellIcon = useStockIcon(sellCurrency);
  const BuyIcon = useStockIcon(buyCurrency);
  const { cancelOffer, claimOffer, receipt, error, loading } = useSwarmVault(chainId ?? SupportedChainId.Testnet);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // Get wallet type for Account Kit integration
  const { walletType } = useUserAccount();



  const handleCopy = (val: string) => {
    if (!val) return;

    navigator.clipboard.writeText(val);
    toast({
      description: "Copied to clipboard",
      duration: 2000,
    });
  };

  // Status styles with enhanced visual design
  const generateStatusStyles = (status: StatusEnum) => {
    switch (status) {
      case StatusEnum.Cancelled:
        return {
          bg: "bg-red-500/90",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: "bg-red-500",
        };
      case StatusEnum.Completed:
        return {
          bg: "bg-emerald-500/90",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          icon: "bg-emerald-500",
        };
      case StatusEnum["Not Filled"]:
        return {
          bg: "bg-slate-500/90",
          border: "border-slate-500/30",
          text: "text-slate-300",
          icon: "bg-slate-400",
        };
      case StatusEnum["Partially Filled"]:
        return {
          bg: "bg-blue-500/90",
          border: "border-blue-400/30",
          text: "text-blue-400",
          icon: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-slate-500/90",
          border: "border-slate-500/30",
          text: "text-slate-300",
          icon: "bg-slate-400",
        };
    }
  };

  // Offer types with enhanced visual design
  const generateOfferTakingStyles = (type: TakingOfferTypeEnum) => {
    switch (type) {
      case TakingOfferTypeEnum.PartialOffer:
        return {
          bg: "bg-emerald-500/90",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          icon: "bg-emerald-500",
        };
      case TakingOfferTypeEnum.BlockOffer:
        return {
          bg: "bg-blue-500/90",
          border: "border-blue-400/30",
          text: "text-blue-400",
          icon: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-emerald-500/90",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          icon: "bg-emerald-500",
        };
    }
  };

  useEffect(() => {
    if (receipt) {
      toast({
        title: "Transaction Successful",
        description: status === StatusEnum["Not Filled"]
          ? "Offer successfully cancelled"
          : "Offer successfully claimed",
        duration: 5000,
      });
      setIsProcessing(false);
      // You might want to trigger a refresh of offers here
    }

    if (error) {
      const errorMessage = error || "Something went wrong. Please try again.";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else {
        toast({
          title: "Transaction Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
      setIsProcessing(false);
    }
  }, [receipt, error, status]);

  useEffect(() => {
    setIsProcessing(loading);
  }, [loading]);

  const handleClaimOffer = async () => {
    try {
      if (!offerId) {
        toast({
          description: "Invalid offer ID",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      setIsProcessing(true);

      if (isFilled) {
        if (sellCurrency) {
          await claimOffer(Number(offerId), 0, sellCurrency);
        } else {
          toast({
            description: "Invalid sell currency",
            variant: "destructive",
            duration: 3000,
          });
        }
      } else if (status === StatusEnum["Not Filled"]) {
        if (buyCurrency) {
          await cancelOffer(Number(offerId), 0, buyCurrency);
        } else {
          toast({
            description: "Invalid buy currency",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error claiming/cancelling offer:", error);
      toast({
        description: "Failed to claim offer. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const offerMapper = {
    [TakingOfferTypeEnum.BlockOffer]: "Block Offer",
    [TakingOfferTypeEnum.PartialOffer]: "Partial Offer",
  };

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <ShadcnAccordionItem
      value={itemValue}
      className="border-0 mb-3 overflow-hidden group transition-all duration-300 hover:shadow-md hover:shadow-[#0066A1]/5"
    >
      <AccordionTrigger
        className="bg-gradient-to-r from-[#001A26] to-[#002338] px-3 sm:px-6 py-4 sm:py-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 border border-[#003553]/30 transition-all duration-300 group-hover:border-[#0066A1]/25 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 w-full sm:w-auto">
          {/* Sell Information */}
          <div className="bg-[#00121b]/30 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border border-[#00395a]/20 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#001824]/80 rounded-full p-1.5 border border-[#003553]/30 flex-shrink-0">
                {SellIcon && <SellIcon className="text-red-400" />}
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Sell</div>
                <div className="text-red-400 font-semibold flex items-center text-sm sm:text-base">
                  {sellAmount} <span className="ml-1 text-white/80">{sellCurrency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buy Information */}
          <div className="bg-[#00121b]/30 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border border-[#00395a]/20 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#001824]/80 rounded-full p-1.5 border border-[#003553]/30 flex-shrink-0">
                {BuyIcon && <BuyIcon className="text-green-400" />}
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Buy</div>
                <div className="text-green-400 font-semibold flex items-center text-sm sm:text-base">
                  {buyAmount} <span className="ml-1 text-white/80">{buyCurrency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-left flex flex-col gap-2 w-full sm:w-auto sm:mr-4 mt-1 sm:mt-0">
          <div className="text-sm md:text-base font-medium text-[#4BB6EE]">
            {rate} {buyCurrency}/{sellCurrency}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {takingOfferType && (
              <div
                className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border ${generateOfferTakingStyles(takingOfferType).border} ${generateOfferTakingStyles(takingOfferType).text}`}
              >
                <span
                  className={`${generateOfferTakingStyles(takingOfferType).icon} w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-1 sm:mr-2`}
                ></span>
                <p className="text-xs font-medium whitespace-nowrap">{offerMapper[takingOfferType]}</p>
              </div>
            )}

            <div
              className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border ${generateStatusStyles(status).border} ${generateStatusStyles(status).text}`}
            >
              <span
                className={`${generateStatusStyles(status).icon} w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full mr-1 sm:mr-2`}
              ></span>
              <p className="text-xs font-medium whitespace-nowrap">{status}</p>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="py-4 sm:py-5 px-3 sm:px-6 bg-[#001824] rounded-b-xl mt-0.5 border-x border-b border-[#003553]/30">
        <div className="w-full flex flex-col gap-3">
          {/* Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3">
            {/* Offer ID */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Offer ID</span>
              <span className="text-white font-medium text-sm sm:text-base break-all">{offerId}</span>
            </div>

            {/* Offer maker */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Offer maker</span>
              <span className="flex items-center gap-1 bg-[#002740]/40 px-2 py-1 rounded-md text-white/90 text-sm overflow-hidden text-ellipsis">
                {offerMaker ? shortenText(offerMaker) : "--"}
                {offerMaker && (
                  <button
                    className="text-[#4BB6EE] hover:text-[#5bc0f4] transition-colors flex-shrink-0"
                    onClick={() => handleCopy(offerMaker)}
                  >
                    <SquareArrowOutUpRight size={14} />
                  </button>
                )}
              </span>
            </div>

            {/* Qualifier */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Qualifier</span>
              <span className="text-white/90 font-medium text-sm break-all">{qualifier?.join(", ") || "--"}</span>
            </div>

            {/* Filled */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Filled</span>
              <span className="text-white/90 font-medium text-sm">
                {filled && (
                  <div className="bg-[#002740]/40 px-2 py-1 rounded-md">
                    {filled}
                  </div>
                )}
                {!filled && "--"}
              </span>
            </div>

            {/* Private Addresses */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Private Addresses</span>
              <span className="text-white/90 font-medium text-sm break-all">{pvtAdd?.join(", ") || "--"}</span>
            </div>

            {/* Expiry */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">Expiry</span>
              <span className="text-white/90 font-medium text-sm">
                {expiry ? (
                  <div className="bg-[#002740]/40 px-2 py-1 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(expiry)}</span>
                  </div>
                ) : "--"}
              </span>
            </div>

            {/* To sell */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">To sell</span>
              <span className="flex items-center gap-1">
                {toSell ? (
                  <div className="bg-[#002740]/40 px-2 py-1 rounded-md flex items-center text-white/90 text-sm max-w-full overflow-hidden">
                    <span className="truncate max-w-full">{shortenText(toSell)}</span>
                    <button
                      className="text-[#4BB6EE] hover:text-[#5bc0f4] transition-colors ml-1 flex-shrink-0"
                      onClick={() => handleCopy(toSell)}
                    >
                      <SquareArrowOutUpRight size={14} />
                    </button>
                  </div>
                ) : "--"}
              </span>
            </div>

            {/* To buy */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#00121b]/40 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-0">To buy</span>
              <span className="flex items-center gap-1">
                {toBuy ? (
                  <div className="bg-[#002740]/40 px-2 py-1 rounded-md flex items-center text-white/90 text-sm max-w-full overflow-hidden">
                    <span className="truncate max-w-full">{shortenText(toBuy)}</span>
                    <button
                      className="text-[#4BB6EE] hover:text-[#5bc0f4] transition-colors ml-1 flex-shrink-0"
                      onClick={() => handleCopy(toBuy)}
                    >
                      <SquareArrowOutUpRight size={14} />
                    </button>
                  </div>
                ) : "--"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3 w-full">
            <Link
              href={shareLink}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-2.5 bg-[#001824]/80 text-white/90 font-medium rounded-xl border border-[#00395a]/40 hover:bg-[#00243a]/80 transition-all duration-300 hover:border-[#0066A1]/30 w-full sm:w-auto text-sm sm:text-base"
            >
              <Share2Icon size={16} className="text-[#4BB6EE]" />
              <span>Share</span>
            </Link>

            {isMyOffer ? (
              <Button
                onClick={handleClaimOffer}
                disabled={isProcessing}
                className={`flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-2.5 bg-[#F97316] text-white font-medium rounded-xl hover:bg-[#F97316]/90 transition-all duration-300 ${isProcessing ? 'opacity-70' : ''} w-full sm:w-auto text-sm sm:text-base`}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <WalletIcon size={16} />
                    <span>Claim/Cancel Offer</span>
                  </>
                )}
              </Button>
            ) : (
              <Link
                href={`/takeoffer/${offerId}`}
                className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-2.5 bg-[#4BB6EE] text-white font-medium rounded-xl hover:bg-[#4BB6EE]/90 transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Take Offer</span>
              </Link>
            )}
          </div>
        </div>
      </AccordionContent>

      {/* Funding Helper for Account Kit */}
      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </ShadcnAccordionItem>
  );
};

export default AccordionItem;
