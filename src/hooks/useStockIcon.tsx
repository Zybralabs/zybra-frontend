import React from "react";

import {
  NvidiaIcon,
  TeslaIcon,
  MicrosoftIcon,
  GoogleIcon,
  AppleIcon,
  BnbIcon,
  EthIcon,
  BtcIcon,
  SolIcon,
  TeslaFilledIcon,
  XrpIcon,
  ZfiIcon,
  UsdcIcon,
  ZRUSDIcon,
} from "@/components/Icons/index";

/**
 * Hook to get the corresponding stock icon based on a stock symbol.
 *
 * @param {string} symbol - The stock symbol (e.g., TSLA, AAPL).
 * @returns {React.ElementType | null} - The icon component or null if not found.
 */
export function useStockIcon(symbol: string | undefined): React.ElementType | null {
  const stockIcons: Record<string, React.ElementType> = {
    tsla: TeslaIcon,
    aapl: AppleIcon,
    msft: MicrosoftIcon,
    goog: GoogleIcon,
    nvda: NvidiaIcon,
    btc: BtcIcon,
    eth: EthIcon,
    sol: SolIcon,
    xrp: XrpIcon,
    bnb: BnbIcon,
    zfi: ZfiIcon,
    zrusd: ZRUSDIcon,
    usdc: UsdcIcon,
    "84532": TeslaFilledIcon,
    "8453": NvidiaIcon,
    "1": MicrosoftIcon,
  };

  const normalizedSymbol = symbol?.toLowerCase();

  return normalizedSymbol ? stockIcons[normalizedSymbol] : null;
}

// Usage Example
// const StockIcon = useStockIcon('TSLA');
// return StockIcon ? <StockIcon /> : null;
