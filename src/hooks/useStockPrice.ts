import { useEffect, useState } from "react";

import yahooFinance from "yahoo-finance2";

export interface StockPrice {
  symbol: string;
  price: number;
  currency: string;
  timestamp: number | null; // Allow null if `regularMarketTime` is undefined
}

/**
 * Hook to fetch stock prices using Yahoo Finance API.
 * @param stockSymbols Array of stock symbols to fetch prices for.
 * @returns Stock prices and their associated metadata.
 */
export function useStockPrices(stockSymbols: string[]) {
  const [stockPrices, setStockPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch prices for all symbols
        const prices = await Promise.all(
          stockSymbols.map(async (symbol) => {
            try {
              const data = await yahooFinance.quote(symbol);
              return {
                symbol: data.symbol,
                price: data.regularMarketPrice,
                currency: data.currency,
                timestamp: data.regularMarketTime
                  ? new Date(data.regularMarketTime * 1000).getTime() // Convert to milliseconds
                  : null, // Fallback to null if `regularMarketTime` is undefined
              };
            } catch (err) {
              console.error(`Failed to fetch price for ${symbol}:`, err);
              return null;
            }
          }),
        );

        // Filter out any null results
        setStockPrices(prices.filter((price) => price !== null) as StockPrice[]);
      } catch (err) {
        console.error("Failed to fetch stock prices:", err);
        setError("Failed to fetch stock prices.");
      } finally {
        setLoading(false);
      }
    };

    if (stockSymbols.length > 0) {
      fetchPrices();
    }
  }, [stockSymbols]);

  return { stockPrices, loading, error };
}
