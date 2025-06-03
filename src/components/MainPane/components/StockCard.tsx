import { SwarmIcon, TeslaFilledIcon } from "@/components/Icons";
import { useStockIcon } from "@/hooks/useStockIcon";
import { formatAmount, formatNumber } from "@/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PoolCardType = {
  active?: boolean;
  status?: string;
  name?: string;
  symbol?: string;
  icon?: React.ReactNode;
  offerUrl?: string;
  change: string;
  price: number;
  quantity: number;
  ZrUSD: number;
  marketCap: number;
  expiry: string;
  address: string;
};
const DemoIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#0078D4" fillOpacity="0.2" stroke="#0078D4" strokeWidth="2"/>
  </svg>
);
export default function StockCard({
  name = "Coupang Inc - Class A",
  symbol = "CPNG",
  active = true,
  status = "Active",
  change = "3.0952%",
  expiry = "Dec 11, '26 at 9:36 PM",
  ZrUSD = 0,
  quantity = 0,
  marketCap = 39090,
  price = 21.65,
  offerUrl = "",
  address = "",
}) {
  const Icon = useStockIcon(symbol);
  
  // Convert string percentage to number for comparison
  const changeNumber = parseFloat(change);
  const isPositive = changeNumber >= 0;
  
  // Format number with commas and decimals
  const formatNumber = (num: string | number | bigint) => {
    const parsedNum = typeof num === "string" ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 2,
      minimumFractionDigits: 2 
    }).format(parsedNum);
  };
  
  // Format large numbers to K, M, B
  const formatAmount = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };
  
  return (
    <div className="bg-[#001C29] text-white p-3 sm:p-4 rounded-xl w-full max-w-full flex flex-col justify-between shadow-lg border border-[#00304a]/20 hover:border-[#00304a]/40 transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3">
        <div className="space-y-2 sm:space-y-3 max-w-[75%]">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#001620] border-[0.25px] ${
              active ? "border-green-500/50 text-green-500" : "border-red-500/50 text-red-500"
            } text-xs`}
          >
            <span
              className={`${active ? "bg-green-500" : "bg-red-500"} w-1.5 h-1.5 rounded-full mr-1`}
            ></span>
            <p className="text-xs whitespace-nowrap"> {status} </p>
          </div>

          {/* Stock Logo and Name */}
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 bg-[#00304a]/30 rounded-full p-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
           { Icon ? <Icon className="w-3 h-3 sm:w-4 sm:h-4" /> : <DemoIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-semibold truncate">
                {name} 
              </h1>
              <p className="text-xs text-gray-300 truncate">{`(${symbol})`}</p>
            </div>
          </div>
        </div>

        {/* Company Logo */}
        <div className="flex-shrink-0 bg-[#00304a]/30 rounded-full p-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 sm:w-4 sm:h-4"
          >
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="2"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-2">
        {/* Price */}
        <div className="flex justify-between items-center border-b border-dashed border-[#313E44] pb-2">
          <span className="text-gray-400 text-xs">Price</span>
          <span className="text-sm sm:text-base font-semibold truncate">{formatNumber(price)} USDC</span>
        </div>

        {/* Quantity */}
        <div className="flex justify-between items-center border-b border-dashed border-[#313E44] pb-2">
          <span className="text-gray-400 text-xs">Quantity</span>
          <span className="text-sm sm:text-base font-semibold truncate">{formatNumber(quantity)}</span>
        </div>

        {/* ZrUSD */}
        <div className="flex justify-between items-center border-b border-dashed border-[#313E44] pb-2">
          <span className="text-gray-400 text-xs">ZrUSD Borrowed</span>
          <span className="text-sm sm:text-base font-semibold truncate">{formatNumber(ZrUSD)}</span>
        </div>

        {/* Market Cap and Change */}
        <div className="flex pt-3 justify-between gap-2">
          {/* Market Cap */}
          <div className="w-1/2">
            <div className="text-gray-400 mb-1 text-xs">Market Cap.</div>
            <div className="text-base sm:text-lg font-semibold truncate">${formatAmount(marketCap)}</div>
          </div>
          
          {/* Change + Graph */}
          <div className="w-1/2 flex justify-between items-start gap-2">
            <div className="flex flex-col justify-between">
              <div className="text-gray-400 mb-1 text-xs">Change</div>
              <span
                className={`text-base sm:text-lg font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}
              >
                {change}
              </span>
            </div>
            
            {/* Graph - Simplified for better responsiveness */}
            <div className="h-10 relative self-end overflow-hidden">
              {isPositive ? (
                <svg
                  width="60"
                  height="30"
                  viewBox="0 0 60 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-14 h-10"
                >
                  <path
                    d="M1 21.5C1 21.5 4 15 7 15C10 15 9.5 7 13 7C16.5 7 15.5 1 18 1C20.5 1 19.5 8.5 23.5 8.5C27.5 8.5 26 10.5 29 10.5C32 10.5 32 8.5 35 8.5C38 8.5 36.5 11 40 11C43.5 11 42.5 14 45 14C47.5 14 48 11 50.5 11C53 11 54 12 56 12C58 12 59 29 59 29H1V21.5Z"
                    fill="rgba(0,73,17,0.3)"
                  />
                  <path
                    d="M1 21.5C1 21.5 4 15 7 15C10 15 9.5 7 13 7C16.5 7 15.5 1 18 1C20.5 1 19.5 8.5 23.5 8.5C27.5 8.5 26 10.5 29 10.5C32 10.5 32 8.5 35 8.5C38 8.5 36.5 11 40 11C43.5 11 42.5 14 45 14C47.5 14 48 11 50.5 11C53 11 54 12 56 12C58 12 59 10 59 10"
                    stroke="#1ECB44"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              ) : (
                <svg
                  width="60"
                  height="30"
                  viewBox="0 0 60 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-14 h-10"
                >
                  <path
                    d="M1 10C1 10 4 16.5 7 16.5C10 16.5 9.5 24.5 13 24.5C16.5 24.5 15.5 29 18 29C20.5 29 19.5 21.5 23.5 21.5C27.5 21.5 26 19.5 29 19.5C32 19.5 32 21.5 35 21.5C38 21.5 36.5 19 40 19C43.5 19 42.5 16 45 16C47.5 16 48 19 50.5 19C53 19 54 18 56 18C58 18 59 1 59 1H1V10Z"
                    fill="rgba(102,0,0,0.3)"
                  />
                  <path
                    d="M1 10C1 10 4 16.5 7 16.5C10 16.5 9.5 24.5 13 24.5C16.5 24.5 15.5 29 18 29C20.5 29 19.5 21.5 23.5 21.5C27.5 21.5 26 19.5 29 19.5C32 19.5 32 21.5 35 21.5C38 21.5 36.5 19 40 19C43.5 19 42.5 16 45 16C47.5 16 48 19 50.5 19C53 19 54 18 56 18C58 18 59 20 59 20"
                    stroke="#FF0000"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry and Invest Button */}
      <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        {/* Expiry */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-hidden">
          <div className="text-gray-400 text-xs shrink-0">Expiry</div>
          <div className="text-xs text-white/90 truncate ml-1">{expiry}</div>
        </div>
        
        {/* Invest Button */}
        <button
          className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-[#001620] text-white text-xs flex items-center justify-center transition-colors border border-white/50 hover:bg-[#002435] hover:border-white/70"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-3 h-3 mr-1.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Invest
        </button>
      </div>
    </div>
  );
}
