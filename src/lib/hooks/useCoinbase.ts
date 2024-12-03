import { useState, useCallback } from "react";
import type {
    BuyOptionsRequest,
    BuyOptionsResponse,
    BuyQuoteRequest,
    BuyQuoteResponse,
    SellOptionsRequest,
    SellOptionsResponse,
    SellQuoteRequest,
    SellQuoteResponse,
    GenerateWalletRequest,
    GenerateWalletResponse,
    SellTransactionStatusRequest,
    SellTransactionStatusResponse,
    CreateTransferRequest,
    CreateTransferResponse,
} from "./types";

export function useCoinbase(apiBaseUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSecureToken = useCallback(
    async ({
      ethAddress,
      blockchains,
    }: {
      ethAddress: string;
      blockchains?: string[];
    }): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/secure-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ethAddress, blockchains }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch secure token");
        }

        const json = await response.json();
        return json.token;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const generateBuyOptions = useCallback(
    async (params: BuyOptionsRequest): Promise<{
      json: BuyOptionsResponse;
      paymentCurrencies: { name: string }[];
      purchaseCurrencies: { name: string }[];
    }> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/buy-options-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch buy options");
        }

        const json: BuyOptionsResponse = await response.json();
        const paymentCurrencies = json.payment_currencies.map((currency) => ({
          name: currency.id,
        }));
        const purchaseCurrencies = json.purchase_currencies.map((currency) => ({
          name: currency.symbol,
        }));
        return { json, paymentCurrencies, purchaseCurrencies };
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const generateBuyQuote = useCallback(
    async (params: BuyQuoteRequest): Promise<BuyQuoteResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/buy-quote-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch buy quote");
        }

        const json: BuyQuoteResponse = await response.json();
        return json;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const generateSellOptions = useCallback(
    async (params: SellOptionsRequest): Promise<{
      json: SellOptionsResponse;
      cashoutCurrencies: { name: string }[];
      sellCurrencies: { name: string }[];
    }> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/sell-options-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sell options");
        }

        const json: SellOptionsResponse = await response.json();
        const cashoutCurrencies = json.cashout_currencies.map((currency) => ({
          name: currency.id,
        }));
        const sellCurrencies = json.sell_currencies.map((currency) => ({
          name: currency.symbol,
        }));
        return { json, cashoutCurrencies, sellCurrencies };
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const generateSellQuote = useCallback(
    async (params: SellQuoteRequest): Promise<SellQuoteResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/sell-quote-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sell quote");
        }

        const json: SellQuoteResponse = await response.json();
        return json;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const generateWallet = useCallback(
    async (params: GenerateWalletRequest): Promise<GenerateWalletResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/create-wallet-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to create wallet");
        }

        const json: GenerateWalletResponse = await response.json();
        return json;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const getSellTransactionStatus = useCallback(
    async (
      params: SellTransactionStatusRequest
    ): Promise<SellTransactionStatusResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${apiBaseUrl}/sell-transaction-status-api`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sell transaction status");
        }

        const json: SellTransactionStatusResponse = await response.json();
        return json;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const createTransfer = useCallback(
    async (params: CreateTransferRequest): Promise<CreateTransferResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/create-transfer-api`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to create transfer");
        }

        const json: CreateTransferResponse = await response.json();
        return json;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  return {
    generateSecureToken,
    generateBuyOptions,
    generateBuyQuote,
    generateSellOptions,
    generateSellQuote,
    generateWallet,
    getSellTransactionStatus,
    createTransfer,
    loading,
    error,
  };
}
