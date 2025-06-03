import { useState, useMemo } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { X, Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useStockIcon } from "@/hooks/useStockIcon";
import { useUserAccount } from "@/context/UserAccountContext";
import { formatBalance, formatPercentage } from "@/utils/formatters";
import type { PoolCardProps, TrancheWithCurrency } from "@/components/MainPane/MainPane";

// Status enum for pool status
enum StatusEnum {
  "Open for investments" = "Open for investments",
  "Closed" = "Closed",
  "Upcoming" = "Upcoming",
  "Archived" = "Archived"
}

// Token interface
interface Token {
  id: string;
  name: string;
  symbol: string;
  logoURI?: string;
  address: string;
  chainId?: number;
  decimals: number;
  balance?: number;
  assetType?: string;
  tradedVolume?: string;
}

// Interface for the TokenSelector component
interface TokenSelectorProps {
  onSelect: (item: any) => void;
  onClose: () => void;
  items: any[];
  type: 'token' | 'pool';
  title?: string;
}

// Logo component for displaying token/pool icons
const Logo = ({ symbol, iconUri }: { symbol?: string; iconUri?: string }) => {
  const Icon = symbol ? useStockIcon(symbol) : null;
  
  if (iconUri) {
    return (
      <div className="w-8 h-8 bg-white rounded flex items-center justify-center relative overflow-hidden">
        <Image 
          src={iconUri} 
          alt={symbol || "icon"} 
          width={32} 
          height={32}
          className="object-cover"
          fill
        />
      </div>
    );
  }
  
  if (Icon) {
    return (
      <span className="mr-2">
        <Icon width={24} height={24} />
      </span>
    );
  }
  
  return (
    <div className="w-8 h-8 mr-3 rounded-full bg-[#013853] flex items-center justify-center text-[#4BB6EE] text-sm font-medium">
      {symbol?.substring(0, 2) || "??"}
    </div>
  );
};

// Helper functions to mimic the PoolCard functionality
const daysBetween = (startDate: string | Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

class CurrencyBalance {
  constructor(amount: number, decimals: number) {
    this.amount = amount;
    this.decimals = decimals;
  }
  
  amount: number;
  decimals: number;
  
  toDecimal() {
    return this.amount;
  }
}

const formatBalanceAbbreviated = (value: number, symbol: string = "", decimals: number = 2): string => {
  if (value === undefined || value === null) return "0";
  
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(decimals)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  } else {
    return value.toFixed(decimals);
  }
};

export default function TokenSelector({ 
  onSelect, 
  onClose, 
  items,
  type,
  title
}: TokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { zfi_balance } = useUserAccount();

  // Filter tokens/pools based on search term
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      if (type === 'token') {
        // Token filtering
        return (
          (item.name?.toLowerCase() || "").includes(searchLower) ||
          (item.address?.toLowerCase() || "").includes(searchLower) ||
          (item.symbol?.toLowerCase() || "").includes(searchLower) ||
          (item.assetType?.toLowerCase() || "").includes(searchLower)
        );
      } else {
        // Pool filtering
        return (
          (item.name?.toLowerCase() || "").includes(searchLower) ||
          (item.address?.toLowerCase() || "").includes(searchLower) ||
          (item.currencySymbol?.toLowerCase() || "").includes(searchLower) ||
          (item.assetClass?.toLowerCase() || "").includes(searchLower) ||
          (item.status?.toLowerCase() || "").includes(searchLower) ||
          (item.poolId?.toLowerCase() || "").includes(searchLower)
        );
      }
    });
  }, [items, searchTerm, type]);

  // Render token item
  const renderToken = (token: Token) => {
    return (
      <Button
        key={token.id || token.address}
        variant="ghost"
        className="w-full py-6 justify-start hover:bg-[#013853]"
        onClick={() => onSelect(token)}
      >
        <Logo symbol={token.symbol} />
        
        <div className="flex flex-col items-start">
          <span className="font-medium text-white">{token.name}</span>
          <span className="text-xs text-zinc-400">{token.symbol}</span>
        </div>
        
        <div className="ml-auto text-right">
          {/* <span className="text-sm text-white">{token.balance || "0"}</span> */}
          <span className="text-xs text-zinc-400 block">{token.symbol}</span>
        </div>
      </Button>
    );
  };

  // Render pool item
  const renderPool = (pool: PoolCardProps, onSelect: (pool: PoolCardProps) => void) => {
    // Check if pool is active based on status
    const isActive = pool.status === "Open for investments" || pool.status === "Upcoming";
    
    // Get pool tranches data for APY calculation
    const tranchesData = useMemo(() => {
      if (!pool.tranches || pool.tranches.length === 0) return [];
      
      return pool.tranches
        .map((tranche) => {
          const words = tranche.currency?.name?.trim().split(" ") || [];
          const metadata = pool.metaData?.tranches?.[tranche.id] ?? null;
          const trancheName = words[words.length - 1] || "";
          
          // Get investment balance if available
          const investmentBalance = metadata?.minInitialInvestment 
            ? new CurrencyBalance(
                Number(metadata.minInitialInvestment ?? 0),
                tranche.currency.decimals,
              ).toDecimal()
            : null;
  
          // Calculate APY based on various conditions
          const calculateApy = (tranche: TrancheWithCurrency) => {
            const daysSinceCreation = pool.createdAt 
              ? daysBetween(new Date(pool.createdAt), new Date()) 
              : 0;
              
            if (tranche.yield30DaysAnnualized && daysSinceCreation > 30) {
              return formatPercentage(tranche?.yield30DaysAnnualized, true, {}, 1);
            }
            
            if (tranche.interestRatePerSec) {
              return formatPercentage(tranche.interestRatePerSec?.toAprPercent(), true, {}, 1);
            }
            
            return "0%";
          };
  
          return {
            seniority: tranche.seniority,
            name: trancheName,
            apr: calculateApy(tranche),
            minInvestment: investmentBalance
              ? `$${formatBalanceAbbreviated(investmentBalance, "", 0)}`
              : "$1",
          };
        })
        .reverse();
    }, [pool]);
  
    // APY display
    const apy = tranchesData && tranchesData.length > 0 
      ? tranchesData[0].apr 
      : (pool.apr 
        ? (typeof pool.apr === 'object' && pool.apr.toAprPercent 
          ? formatPercentage(pool.apr.toAprPercent()) 
          : `${pool.apr}%`)
        : "0%");
    
    // Simplified minimum investment display
    const minInvestment = tranchesData && tranchesData.length > 0 
      ? tranchesData[0].minInvestment
      : "$1";
      
    // Check if APY is not zero for styling
    const hasPositiveApy = apy !== "0%";
    
    return (
      <div
        key={pool.poolId || pool.name}
        className="w-full bg-[#0a1928] border border-[#172d42] hover:border-[#1e4266] hover:bg-[#0c223b] transition-all duration-200 rounded-xl overflow-hidden cursor-pointer mb-4"
        onClick={() => onSelect(pool)}
      >
        {/* Main content */}
        <div className="p-4">
          {/* Top section with status and APY */}
          <div className="flex justify-between items-start w-full mb-3">
            <div>
              {pool.status && (
                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-md ${
                    isActive 
                      ? "bg-[#012b0c]/20 border border-[#44aa55]/30 text-[#44aa55]" 
                      : "bg-[#330505]/20 border border-[#aa4444]/30 text-[#aa4444]"
                  } text-xs`}
                >
                  <span
                    className={`${isActive ? "bg-[#44aa55]" : "bg-[#aa4444]"} w-1.5 h-1.5 rounded-full mr-1.5`}
                  ></span>
                  {pool.status}
                </div>
              )}
            </div>
            
            {/* APY display */}
            <div className="flex flex-col items-end">
              <div className="text-[#4BB6EE] text-xs font-medium mb-0.5">APY</div>
              <div className={`text-lg font-semibold ${hasPositiveApy ? 'text-[#44aa55]' : 'text-white'}`}>
                {apy}
                {hasPositiveApy && apy !== "0%" && (
                  <span className="text-xs text-gray-400 ml-1">target</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Pool identity - logo and name */}
          <div className="flex items-center space-x-3 mt-1">
            <div className="bg-[#132c42] p-1.5 rounded-full h-9 w-9 flex items-center justify-center">
              {pool.iconUri ? (
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center relative overflow-hidden">
                  <Image 
                    src={pool.iconUri} 
                    alt={pool.currencySymbol || "icon"} 
                    width={32} 
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-[#1e4266] text-white text-sm font-bold h-full w-full rounded-full flex items-center justify-center">
                  {pool.name?.substring(0, 2) || "??"}
                </div>
              )}
            </div>
            <h3 className="text-white font-medium">{pool.name}</h3>
          </div>
          
          {/* Divider */}
          <div className="h-px w-full bg-[#172d42] my-3"></div>
          
          {/* Pool details section */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
            <div>
              <div className="text-gray-400 text-xs">TVL ({pool.currencySymbol || "USDC"})</div>
              <div className="text-white font-medium">
                {pool.valueLocked ? formatBalance(pool.valueLocked, "") : "$0"}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-xs">Min.Investment</div>
              <div className="text-white font-medium">{minInvestment}</div>
            </div>
            
            <div className="mt-1">
              <div className="text-gray-400 text-xs">Asset type</div>
              <div className="text-sm text-white">{pool.assetClass || "-"}</div>
            </div>
            
            {/* Only show tranches if they exist */}
            {tranchesData && tranchesData.length > 0 && (
              <div className="mt-1">
                <div className="text-gray-400 text-xs">Tranches</div>
                <div className="text-sm text-white flex items-center gap-2">
                  {tranchesData.map((tranche, index) => (
                    <span key={index} className="text-xs bg-[#172d42] px-2 py-0.5 rounded">
                      {tranche.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* View details indicator/hover effect */}
        <div className="bg-[#0c223b] hover:bg-[#0f2744] text-center py-2 text-[#4BB6EE] text-xs font-medium border-t border-[#172d42]">
          View Details
        </div>
      </div>
    );
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <Card className="w-full relative max-w-md bg-darkGreen border-[#013853]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium text-white">
            {title || (type === 'token' ? 'Select a token' : 'Pool List')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white absolute right-2 top-2">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            <div className="relative flex">
              <Input
                type="text"
                placeholder={type === 'token' 
                  ? "Search name or paste address" 
                  : "Search pool name or asset class"
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#001C29] border-[#013853] pl-10 py-4 h-[100%] text-white"
              />
              <Search className="absolute left-3 top-4 h-5 w-5 text-zinc-400" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto user-card-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  <TrendingUp className="h-10 w-10 mb-2" />
                  <p className="text-sm">No {type === 'token' ? 'tokens' : 'pools'} found</p>
                </div>
              ) : (
                filteredItems.map(item => 
                  type === 'token'
                    ? renderToken(item) 
                    : renderPool(item, onSelect)
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}