import { useState, useCallback, useEffect } from "react";

import axios from "axios";
import { ethers } from "ethers";

import { useAccountAbstraction } from "./useAccountAbstraction"; // Account abstraction hook
import { useEthersProvider } from "@/hooks/useContract";
import { useBlockContext } from "@/context/BlockContext";
import { ChainId } from "@/constant/addresses";

interface MoonPayTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  walletAddress: string;
  cryptoAmount: number;
  fiatAmount: number;
  currency: string;
  cryptoCurrency: string;
  feeAmount: number;
  extraFeeAmount: number;
  totalAmount: number;
  baseCurrency: string;
}

interface ConversionRate {
  fiatAmount: number;
  cryptoAmount: number;
}

interface MoonPayHookProps {
  apiKey: string;
  apiBaseUrl: string; // MoonPay's API Base URL
}

export function useMoonPay({ apiKey, apiBaseUrl }: MoonPayHookProps) {
  const { deployMinimalAccount, minimalAccountAddress} = useAccountAbstraction(); // Hook for managing account abstraction
  const { chainId} = useBlockContext(); // Hook for managing account abstraction
  const provider = useEthersProvider(chainId ?? ChainId.Testnet);
  const [transactions, setTransactions] = useState<MoonPayTransaction[]>([]);
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [supportedAssets, setSupportedAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useCallback(() => {
    return axios.create({
      baseURL: apiBaseUrl,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }, [apiBaseUrl, apiKey]);

  // Step 1: Deploy Minimal Account and return the address
  const initializeAccount = useCallback(async () => {
    if (!minimalAccountAddress) {
      return await deployMinimalAccount();
    }
    return minimalAccountAddress;
  }, [deployMinimalAccount, minimalAccountAddress]);

  // Step 2: Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!minimalAccountAddress) {
        throw new Error("Minimal account address not found");
      }

      const response = await apiClient().get("/v3/transactions", {
        params: { walletAddress: minimalAccountAddress },
      });
      setTransactions(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  }, [apiClient, minimalAccountAddress]);

  // Step 3: Fetch Supported Assets
  const fetchSupportedAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient().get("/v3/currencies");
      setSupportedAssets(response.data.map((asset: any) => asset.code));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch supported assets.");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  // Step 4: Fetch Conversion Rate
  const fetchConversionRate = useCallback(
    async (cryptoCurrency: string, fiatCurrency: string, fiatAmount: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient().get("/v3/currency/price", {
          params: { cryptoCurrency, fiatCurrency, baseCurrencyAmount: fiatAmount },
        });
        setConversionRate({
          fiatAmount: response.data.baseCurrencyAmount,
          cryptoAmount: response.data.quoteCurrencyAmount,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch conversion rate.");
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  // Step 5: Create Buy Transaction
  const createBuyTransaction = useCallback(
    async (fiatAmount: number, cryptoCurrency: string) => {
      setLoading(true);
      setError(null);

      try {
        const walletAddress = await initializeAccount(); // Ensure account exists
        const response = await apiClient().post("/v3/transactions", {
          baseCurrencyAmount: fiatAmount,
          cryptoCurrency,
          walletAddress,
        });
        return response.data as MoonPayTransaction;
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to create buy transaction.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, initializeAccount],
  );

  // Step 6: Listen for Deposits
  const listenForDeposits = useCallback(
    async (tokenAddress: string, tokenDecimals: number) => {
      if (!minimalAccountAddress || !provider) return;

      const contract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider,
      );

      const balance = await contract.balanceOf(minimalAccountAddress);
      return ethers.utils.formatUnits(balance, tokenDecimals);
    },
    [minimalAccountAddress, provider],
  );

  useEffect(() => {
    fetchSupportedAssets();
  }, [fetchSupportedAssets]);

  return {
    transactions,
    conversionRate,
    supportedAssets,
    loading,
    error,
    fetchTransactions,
    fetchConversionRate,
    createBuyTransaction,
    listenForDeposits,
    initializeAccount,
  };
}
