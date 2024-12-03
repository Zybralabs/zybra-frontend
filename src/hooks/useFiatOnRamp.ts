import { useState, useCallback } from "react";

import { useCoinbase } from "../lib/hooks/useCoinbase"; // Coinbase Onramp hook
import { useMoonPay } from "../lib/hooks/useMoonpay"; // MoonPay hook

interface UnifiedOnRampProps {
  provider: "moonpay" | "coinbase"; // Add more providers as needed
}

interface ConversionRate {
  fiatAmount: number;
  cryptoAmount: number;
}

interface UnifiedOnRampHookReturn {
  transactions: any[];
  conversionRate: ConversionRate | null;
  supportedAssets: string[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  fetchConversionRate: (
    cryptoCurrency: string,
    fiatCurrency: string,
    fiatAmount: number,
  ) => Promise<void>;
  createBuyTransaction: (fiatAmount: number, cryptoCurrency: string) => Promise<any>;
  listenForDeposits: (tokenAddress: string, tokenDecimals: number) => Promise<string | undefined>;
  initializeAccount: () => Promise<string>;
}

export function useUnifiedOnRamp({ provider }: UnifiedOnRampProps): UnifiedOnRampHookReturn {
  // Load API configuration from environment variables
  const MOONPAY_API_KEY = process.env.REACT_APP_MOONPAY_API_KEY || "";
  const MOONPAY_API_BASE_URL = process.env.REACT_APP_MOONPAY_API_BASE_URL || "";
  const COINBASE_API_BASE_URL = process.env.REACT_APP_COINBASE_API_BASE_URL || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize hooks for MoonPay and Coinbase
  const moonPay = useMoonPay({
    apiKey: MOONPAY_API_KEY,
    apiBaseUrl: MOONPAY_API_BASE_URL,
  });
  const coinbase = useCoinbase(COINBASE_API_BASE_URL);

  // Select provider-specific hook
  const selectedProvider = provider === "moonpay" ? moonPay : coinbase;

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (provider === "moonpay") {
        await moonPay.fetchTransactions();
      } else if (provider === "coinbase") {
        throw new Error("fetchTransactions is not yet implemented for Coinbase.");
      } else {
        throw new Error("Invalid provider specified.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [provider, moonPay]);

  // Fetch Conversion Rate
  const fetchConversionRate = useCallback(
    async (cryptoCurrency: string, fiatCurrency: string, fiatAmount: number) => {
      setLoading(true);
      setError(null);
      try {
        if (provider === "moonpay") {
          await moonPay.fetchConversionRate(cryptoCurrency, fiatCurrency, fiatAmount);
        } else if (provider === "coinbase") {
          // Placeholder for Coinbase conversion rate logic
        } else {
          throw new Error("Invalid provider specified.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [provider, moonPay],
  );

  // Create Buy Transaction
  const createBuyTransaction = useCallback(
    async (fiatAmount: number, cryptoCurrency: string) => {
      setLoading(true);
      setError(null);
      try {
        if (provider === "moonpay") {
          return await moonPay.createBuyTransaction(fiatAmount, cryptoCurrency);
        } else if (provider === "coinbase") {
          const quote = await coinbase.generateBuyQuote({
            purchase_currency: cryptoCurrency,
            payment_amount: fiatAmount.toString(),
            payment_currency: "USD",
            payment_method: "credit_card",
            country: "US",
          });
          return quote;
        } else {
          throw new Error("Invalid provider specified.");
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [provider, moonPay, coinbase],
  );

  // Listen for Deposits
  const listenForDeposits = useCallback(
    async (tokenAddress: string, tokenDecimals: number) => {
      if (provider === "moonpay") {
        return moonPay.listenForDeposits(tokenAddress, tokenDecimals);
      }
      throw new Error("listenForDeposits is not implemented for this provider.");
    },
    [provider, moonPay],
  );

  // Initialize Account
  const initializeAccount = useCallback(async () => {
    if (provider === "moonpay") {
      return moonPay.initializeAccount();
    }
    throw new Error("initializeAccount is not implemented for this provider.");
  }, [provider, moonPay]);

  return {
    transactions: selectedProvider.transactions,
    conversionRate: selectedProvider.conversionRate,
    supportedAssets: selectedProvider.supportedAssets,
    loading,
    error,
    fetchTransactions,
    fetchConversionRate,
    createBuyTransaction,
    listenForDeposits,
    initializeAccount,
  };
}
