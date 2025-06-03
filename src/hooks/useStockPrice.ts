import { useEffect, useState, useCallback, useRef } from "react";
import { DefaultApi } from 'finnhub-ts';

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  timestamp: number | null;
  change: number;
  changePercent: number;
  marketcap: number;
}

export function useStockPrices(stockSymbols: string[]) {
  const [stockPrices, setStockPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedSymbols, setFetchedSymbols] = useState<Set<string>>(new Set());
  
  // Store the Finnhub client instance
  const finnhubClient = useRef(
    new DefaultApi({
      apiKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '',
      isJsonMime: (mime: string) => mime === 'application/json'
    })
  ).current;
  
  // Track if we've already fetched data
  const hasFetched = useRef(false);

  const fetchPrices = useCallback(async (symbols: string[]) => {
    // Skip if we've already fetched data for all these symbols
    if (symbols.every(symbol => fetchedSymbols.has(symbol))) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // If no symbols provided, use TSLA as fallback
      const symbolsToFetch = symbols.length ? symbols : ['TSLA'];
      // Only fetch symbols we haven't fetched yet
      const newSymbols = symbolsToFetch.filter(symbol => !fetchedSymbols.has(symbol));
      
      if (newSymbols.length === 0) {
        setLoading(false);
        return;
      }
      
      const newPrices = await Promise.all(
        newSymbols.map(async (symbol) => {
          try {
            const [quote, profile] = await Promise.all([
              finnhubClient.quote(symbol),
              finnhubClient.companyProfile2(symbol)
            ]);

            return {
              symbol,
              name: profile?.data?.name || symbol,
              price: quote?.data?.c || 0,
              currency: 'USD',
              marketcap: profile?.data?.marketCapitalization || 0,
              timestamp: Math.floor(Date.now() / 1000),
              change: quote?.data?.d || 0,
              changePercent: quote?.data?.dp || 0,
            };
          } catch (err) {
            console.error(`Failed to fetch price for ${symbol}:`, err);
            return null;
          }
        })
      );

      const validNewPrices = newPrices.filter(Boolean) as StockPrice[];
      
      // Update the list of fetched symbols
      const updatedFetchedSymbols = new Set(fetchedSymbols);
      newSymbols.forEach(symbol => updatedFetchedSymbols.add(symbol));
      setFetchedSymbols(updatedFetchedSymbols);
      
      // Combine new prices with existing prices
      setStockPrices(prevPrices => [...prevPrices, ...validNewPrices]);
      
    } catch (err) {
      console.error("Failed to fetch stock prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stock prices.");
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, [finnhubClient, fetchedSymbols]);

  // Effect for initial fetch
  useEffect(() => {
    // Only fetch if we haven't fetched yet
    if (!hasFetched.current) {
      fetchPrices(stockSymbols);
    }
  }, [stockSymbols, fetchPrices]);

  // Function to manually trigger a fetch (for example, for a "refresh" button)
  const refetch = useCallback(() => {
    hasFetched.current = false; // Reset the fetch flag
    fetchPrices(stockSymbols);
  }, [fetchPrices, stockSymbols]);

  return { stockPrices, loading, error, refetch };
}