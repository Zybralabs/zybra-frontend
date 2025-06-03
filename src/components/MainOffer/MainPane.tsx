"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { ChevronDown, ArrowLeftRight, FilterIcon, X } from "lucide-react";
import ZybraLogoLoader from "@/components/ZybraLogoLoader";
import { Button } from "@/components/ui/button";
import { Accordion } from "../ui/accordion";
import AccordionItem from "../AccordionItem";
import { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import { useChainId } from "wagmi";
import { useUserAccount } from "@/context/UserAccountContext";
import { useQuery } from "@apollo/client";
import { OffersQuery } from "@/hooks/useSwarmQl";
import { useSwarmVault } from "@/hooks/useSwarmVault";
import keyFormatterSnakeToCamel from "../../../utils/snakeToCamel";
import type { TradingPair } from "./types/trading";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { accountType } from "@/config";
import { WalletType } from "@/constant/account/enum";
import FundingHelper from "@/components/AccountKit/FundingHelper";

export default function OfferInterface() {
  const chainId = useChainId();
  const { getBaseSepoliaOffers, baseSepoliaOffers, address, walletType } = useUserAccount();
  const [activeTab, setActiveTab] = useState<"all" | "my" | "private">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showFundingHelper, setShowFundingHelper] = useState(false);
  const [filters, setFilters] = useState<any>({
    toSell: "all",
    toBuy: "all",
    status: "all",
  });

  // Account Kit integration
  const { client } = useSmartAccountClient({ type: accountType });
  const { sendUserOperationAsync, sendUserOperationResult } = useSendUserOperation({
    client,
    waitForTxn: true,
  });
  const [allFilters, setAllFilters] = useState<{
    toSell: string[] | [];
    toBuy: string[] | [];
    status: string[] | [];
  }>({
    toSell: [],
    toBuy: [],
    status: [],
  });
  const [offersData, setOffersData] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    loading: dataloading,
    error: dataError,
    data: result,
  } = useQuery(OffersQuery, {
    variables: { first: 15, skip: 0, orderBy: "id", orderDirection: "asc" },
  });

  const { getAllOffers } = useSwarmVault(chainId);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setMobileFiltersOpen(false);
      }
    }

    if (mobileFiltersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchend", handleClickOutside as EventListener, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchend", handleClickOutside as EventListener);
    };
  }, [mobileFiltersOpen]);

  // Lock body scroll when modal is open to prevent background scrolling on mobile
  useEffect(() => {
    if (mobileFiltersOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      // iOS specific handling
      document.body.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingBottom = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingBottom = '';
    };
  }, [mobileFiltersOpen]);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const offerDetails = getAllOffers(1);

      if (offerDetails?.result) {
        const [, , depositAsset, withdrawalAsset] = offerDetails.result;
        console.log("Deposit Asset:", depositAsset);
        console.log("Withdrawal Asset:", withdrawalAsset);
      }

      const tradingPairs: TradingPair[] = result?.offers?.map((offer: any) => ({
        id: offer.id,
        sellAmount: parseFloat(offer.amountIn),
        sellCurrency: offer.depositAsset.symbol,
        buyAmount: parseFloat(offer.amountOut),
        buyCurrency: offer.withdrawalAsset.symbol,
        rate:
          offer.amountIn && offer.amountOut
            ? parseFloat((offer.amountOut / offer.amountIn).toFixed(2))
            : 0,
        status:
          offer.offerFillType === "NotTaken" ? StatusEnum.Completed : StatusEnum["Not Filled"],
        type: offer.isPrivate ? "private" : "all",
        maker: offer.maker,
        expiryTimestamp: parseInt(offer.expiryTimestamp),
        depositAsset: offer.depositAsset,
        withdrawalAsset: offer.withdrawalAsset,
        takingOfferType: offer.takingOfferType,
        specialAddresses: offer.specialAddresses || [],
        authorizationAddresses: offer.authorizationAddresses || [],
        availableAmount: parseFloat(offer.availableAmount),
        orders: offer.orders.map((order: any) => ({
          affiliate: order.affiliate,
          amountPaid: parseFloat(order.amountPaid),
          amountToReceive: parseFloat(order.amountToReceive),
          createdAt: parseInt(order.createdAt),
          id: order.id,
        })),
        cancelled: !!offer.cancelledAt,
      }));

      setOffersData(tradingPairs || []);
      setAllFilters({
        toBuy: [...new Set(tradingPairs?.map((item) => item?.buyCurrency))],
        toSell: [...new Set(tradingPairs?.map((item) => item?.sellCurrency))],
        status: [
          StatusEnum.Cancelled,
          StatusEnum.Completed,
          StatusEnum["Not Filled"],
          StatusEnum["Partially Filled"],
        ],
      });
    } catch (err) {
      console.error(err);
      setError("An error occurred");
      setOffersData(generateDemoData());
    } finally {
      setLoading(false);
    }
  }, [result, getAllOffers]);

  useEffect(() => {
    if (result) fetchOffers();
  }, [result, fetchOffers]);

  const fetchOffersFromDb = async () => {
    setLoading(true);
    try {
      await getBaseSepoliaOffers();
    } catch (err) {
      console.error(err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersFromDb();
  }, [chainId]);

  const baseSepoliaOffersFormatter = () => {
    if (baseSepoliaOffers) {
      const tradingPairs = baseSepoliaOffers.map((item) =>
        keyFormatterSnakeToCamel<TradingPair>(item),
      );

      setOffersData(tradingPairs || []);
      setAllFilters({
        toBuy: [...new Set(tradingPairs?.map((item) => item?.buyCurrency))],
        toSell: [...new Set(tradingPairs?.map((item) => item?.sellCurrency))],
        status: [
          StatusEnum.Cancelled,
          StatusEnum.Completed,
          StatusEnum["Not Filled"],
          StatusEnum["Partially Filled"],
        ],
      });
    }
  };

  useEffect(() => {
    baseSepoliaOffersFormatter();
  }, [baseSepoliaOffers]);

  const generateDemoData = (): TradingPair[] => [
    {
      id: "demo-1",
      sellAmount: 0.5,
      sellCurrency: "TSLA",
      buyAmount: 250.0,
      buyCurrency: "USDC",
      rate: 500.0,
      status: StatusEnum["Not Filled"],
      type: "all",
      maker: "0xDemoMaker",
      expiryTimestamp: 1700000000,
      depositAsset: {
        symbol: "TSLA",
        address: "0xDemoSell",
        assetType: "ERC20",
        decimals: 18,
        id: "tsla",
        name: "Tesla",
        tokenId: null,
        tradedVolume: 0
      },
      withdrawalAsset: {
        symbol: "USDC",
        address: "0xDemoBuy",
        assetType: "ERC20",
        decimals: 6,
        id: "usdc",
        name: "USD Coin",
        tokenId: null,
        tradedVolume: 0
      },
      specialAddresses: [],
      authorizationAddresses: [],
      availableAmount: 0.5,
      orders: [],
      cancelled: false
    },
    {
      id: "demo-2",
      sellAmount: 0.6,
      sellCurrency: "TSLA",
      buyAmount: 300.0,
      buyCurrency: "USDC",
      rate: 500.0,
      status: StatusEnum.Private,
      type: "private",
      maker: "0xDemoMaker2",
      expiryTimestamp: 1700000000,
      depositAsset: {
        symbol: "TSLA",
        address: "0xDemoSell2",
        assetType: "ERC20",
        decimals: 18,
        id: "tsla",
        name: "Tesla",
        tokenId: null,
        tradedVolume: 0
      },
      withdrawalAsset: {
        symbol: "USDC",
        address: "0xDemoBuy2",
        assetType: "ERC20",
        decimals: 6,
        id: "usdc",
        name: "USD Coin",
        tokenId: null,
        tradedVolume: 0
      },
      specialAddresses: [],
      authorizationAddresses: [],
      availableAmount: 0.6,
      orders: [],
      cancelled: false
    },
  ];

  const filteredPairs = offersData.filter((pair) => {
    if (activeTab === "my" && pair.maker?.toLowerCase() !== address?.toLowerCase()) {
      return false;
    }

    if (activeTab === "private" && pair.type !== "private") {
      return false;
    }

    if (filters.toSell !== "all" && pair.sellCurrency !== filters.toSell) return false;
    if (filters.toBuy !== "all" && pair.buyCurrency !== filters.toBuy) return false;
    if (filters.status !== "all" && pair.status !== filters.status) return false;

    return true;
  });

  const tabs = [
    {
      name: "All Offers",
      id: "all",
    },
    {
      name: "My Offers",
      id: "my",
    },
    {
      name: "Private Offers",
      id: "private",
    },
  ];

  const resetFilters = () => {
    setFilters({
      toSell: "all",
      toBuy: "all",
      status: "all",
    });
  };

  const applyFilters = () => {
    setMobileFiltersOpen(false);
  };

  // Determine if there are any active filters
  const hasActiveFilters = filters.toSell !== "all" || filters.toBuy !== "all" || filters.status !== "all";

  return (
    <div
      className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 w-full overflow-hidden"
      style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}
    >
      {/* Tabs and Filters Section */}
      <div className="flex flex-col mb-4 sm:mb-6">
        {/* Tabs - Scrollable on Mobile */}
        <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:-mx-0 sm:px-0 pb-2">
          <ul className="flex items-center gap-5 sm:gap-10 min-w-max">
            {tabs.map((tab, i) => (
              <li
                key={i}
                className={`${
                  activeTab === tab.id
                    ? "text-[#4BB6EE] border-[#4BB6EE]"
                    : "text-white/80 border-transparent hover:text-white"
                } border-b-2 cursor-pointer text-sm sm:text-base py-2 transition-colors px-1`}
                onClick={() => setActiveTab(tab.id as "all" | "my" | "private")}
                role="button"
                tabIndex={0}
                // Removed unsupported aria-selected attribute
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab(tab.id as "all" | "my" | "private");
                    e.preventDefault();
                  }
                }}
              >
                {tab.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Filter Actions */}
        <div className="mt-4 flex items-center justify-between md:hidden">
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 min-w-max pr-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Filters:</span>
              <div className="flex flex-nowrap gap-2">
                {filters.toSell !== "all" && (
                  <FilterTag label={`Sell: ${filters.toSell}`} onRemove={() => setFilters((prev: any) => ({ ...prev, toSell: "all" }))} />
                )}
                {filters.toBuy !== "all" && (
                  <FilterTag label={`Buy: ${filters.toBuy}`} onRemove={() => setFilters((prev: any) => ({ ...prev, toBuy: "all" }))} />
                )}
                {filters.status !== "all" && (
                  <FilterTag label={`Status: ${filters.status}`} onRemove={() => setFilters((prev: any) => ({ ...prev, status: "all" }))} />
                )}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-gray-400 hover:text-white underline whitespace-nowrap flex-shrink-0"
                    aria-label="Reset all filters"
                  >
                    Reset all
                  </button>
                )}
                {!hasActiveFilters && (
                  <span className="text-xs text-gray-400 italic">None active</span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setMobileFiltersOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 bg-[#013853]/50 border-[#013853] text-white hover:bg-[#013853] hover:text-white ml-2 flex-shrink-0"
            aria-label="Open filters"
            aria-haspopup="dialog"
            aria-expanded={mobileFiltersOpen}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            <span className="text-xs">Filters</span>
          </Button>
        </div>

        {/* Desktop Filters - Hidden on Mobile */}
        <div className="hidden md:flex mt-6 items-start gap-4 flex-wrap xl:flex-nowrap">
          <FilterSelect
            className="flex-1 min-w-[140px]"
            label="To Sell"
            value={filters.toSell}
            options={["all", ...allFilters.toSell]}
            onChange={(value: any) => setFilters((prev: any) => ({ ...prev, toSell: value }))}
          />
          <div className="mt-7 hidden xl:block">
            <ArrowLeftRight className="text-gray-400" size={16} />
          </div>
          <FilterSelect
            className="flex-1 min-w-[140px]"
            label="To Buy"
            value={filters.toBuy}
            options={["all", ...allFilters.toBuy]}
            onChange={(value: any) => setFilters((prev: any) => ({ ...prev, toBuy: value }))}
          />
          <FilterSelect
            className="flex-1 min-w-[140px]"
            label="Status"
            value={filters.status}
            options={["all", ...allFilters.status]}
            onChange={(value: any) => setFilters((prev: any) => ({ ...prev, status: value }))}
          />
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="mt-6 h-8 bg-transparent border-[#4BB6EE] text-[#4BB6EE] hover:bg-[#4BB6EE]/10"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal - iOS compatible */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
          style={{ touchAction: 'none' }}
        >
          <div
            ref={modalRef}
            className="bg-[#001824] w-full rounded-t-xl p-4 pb-8 mobile-slide-up max-h-[85vh] overflow-y-auto"
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="filter-modal-title" className="text-white font-medium">Filters</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-[#013853]/50 h-8 w-8 rounded-full"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <FilterSelect
                className="w-full"
                label="To Sell"
                value={filters.toSell}
                options={["all", ...allFilters.toSell]}
                onChange={(value: any) => setFilters((prev: any) => ({ ...prev, toSell: value }))}
              />

              <FilterSelect
                className="w-full"
                label="To Buy"
                value={filters.toBuy}
                options={["all", ...allFilters.toBuy]}
                onChange={(value: any) => setFilters((prev: any) => ({ ...prev, toBuy: value }))}
              />

              <FilterSelect
                className="w-full"
                label="Status"
                value={filters.status}
                options={["all", ...allFilters.status]}
                onChange={(value: any) => setFilters((prev: any) => ({ ...prev, status: value }))}
              />

              <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-[#001824] pb-safe">
                <Button
                  variant="outline"
                  className="flex-1 mr-2 border-[#013853] text-white hover:bg-[#013853] min-h-[44px]"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1 ml-2 bg-[#4BB6EE] hover:bg-[#35a5e0] text-white min-h-[44px]"
                  onClick={applyFilters}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trading Pairs List */}
      <div className="mt-4 sm:mt-6">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-gray-400">
            <ZybraLogoLoader size="md" className="mb-3" />
            <p>Loading offers...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 rounded-lg text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredPairs.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <p className="mb-2">No offers found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="flex flex-col gap-2 sm:gap-3.5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {filteredPairs.map((pair) => (
              <AccordionItem
                key={pair.id}
                buyAmount={pair?.buyAmount}
                buyCurrency={pair?.buyCurrency}
                itemValue={pair?.id}
                rate={pair?.rate}
                takingOfferType={pair?.takingOfferType}
                sellAmount={pair?.sellAmount}
                sellCurrency={pair?.sellCurrency}
                status={StatusEnum?.[pair?.status] || StatusEnum.Cancelled}
                expiry={pair?.expiryTimestamp}
                pvtAdd={pair?.authorizationAddresses}
                offerId={pair?.id}
                offerMaker={pair?.maker}
                qualifier={pair?.specialAddresses}
                filled={`${pair?.filled || 0}/${pair?.sellAmount || 0} ${pair?.sellCurrency || ""}`}
                isFilled={pair?.status === "Completed" || pair?.filled === pair?.sellAmount}
                toBuy={pair?.withdrawalAsset?.address || pair?.withdrawalAssetAddress}
                toSell={pair?.depositAsset?.address || pair?.depositAssetAddress}
                chainId={chainId}
                isMyOffer={pair?.maker === address?.toLocaleLowerCase()}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* Funding Helper for Account Kit */}
      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#013853] rounded-full text-xs text-white">
      <span className="truncate max-w-[80px] xs:max-w-none">{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="text-gray-400 hover:text-white ml-1 flex-shrink-0 w-4 h-4 flex items-center justify-center"
        aria-label={`Remove ${label} filter`}
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, className = "" }: any) {
  return (
    <div className={className}>
      <label className="text-xs sm:text-sm mb-1 block text-gray-400">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#001824] border border-[#013853] rounded-md px-3 py-2 text-xs sm:text-sm text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#4BB6EE] min-h-[40px]"
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
          aria-label={`Filter by ${label}`}
        >
          {options.map((option: string) => (
            <option key={option} value={option} className="bg-[#001824]">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

// Add these CSS classes to your global stylesheet:
/*
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes mobile-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.mobile-slide-up {
  animation: mobile-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0.5rem);
}

@media (max-width: 400px) {
  .xs\:max-w-none {
    max-width: none;
  }
}
*/