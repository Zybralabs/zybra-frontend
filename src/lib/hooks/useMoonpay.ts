import { useCallback, useState } from "react";

import { useUserAccount } from "@/context/UserAccountContext";

export const useMoonPay = ({
  walletAddress,
  fiatCurrency = "usd",
  cryptoCurrency = "eth",
  fiatAmount = 50,
}) => {
  const { addTransaction } = useUserAccount();
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [depositId, setDepositId] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch a signature from the backend for URL authentication
  const handleGetSignature = useCallback(async (url: string | number | boolean) => {
    try {
      const response = await fetch(`/api/sign-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch signature: ${response.statusText}`);
      }
      const data = await response.text();
      return data;
    } catch (error) {
      console.error("Error fetching the signature:", error);
      setError("Failed to fetch signature.");
      return "";
    }
  }, []);

  const deposit = async (cryptoCode: any, cryptoAmount: any, walletAddress: any) => {
    try {
      console.log(`Depositing ${cryptoAmount} of ${cryptoCode} to ${walletAddress}`);
      // Simulate a successful deposit and return a depositId
      const depositId = "mocked_deposit_id";
      return depositId;
    } catch (error) {
      console.error("Deposit failed:", error);
      return null;
    }
  };
  // Function to add a transaction to the backend

  // Configuration for the MoonPay widget
  const configuration = {
    defaultBaseCurrencyCode: cryptoCurrency,
    quoteCurrencyCode: fiatCurrency,
    refundWalletAddress: walletAddress,
    quoteCurrencyAmount: fiatAmount.toString(),
    variant: "overlay",
    lockAmount: false,
    onUrlSignatureRequested: handleGetSignature,

    async onInitiateDeposit(properties: {
      cryptoCurrency: any;
      cryptoCurrencyAmount: any;
      depositWalletAddress: any;
    }) {
      const { cryptoCurrency, cryptoCurrencyAmount, depositWalletAddress } = properties;

      try {
        setLoading(true);
        const redirectUrl = `http://localhost:3001/wallet-sign?cryptoCode=${cryptoCurrency}&amount=${cryptoCurrencyAmount}&walletAddress=${depositWalletAddress}`;

        const mockDepositId = deposit(
          cryptoCurrency.code,
          cryptoCurrencyAmount,
          depositWalletAddress,
        );
        const depositId = mockDepositId ? mockDepositId.toString() : "default-deposit-id";

        window.open(redirectUrl, "_blank");
        setDepositId(depositId);

        return { depositId }; // Ensure depositId is a string
      } catch (error) {
        console.error("Error during deposit initiation:", error);
        setError("Failed to initiate deposit.");
        setLoading(false);

        return { depositId: "error-deposit-id" }; // Return a fallback string on error
      }
    },

    async onTransactionCompleted(props: {
      id: any;
      baseCurrency: any;
      baseCurrencyAmount: any;
      quoteCurrency: any;
      quoteCurrencyAmount: any;
      walletAddress: any;
      status: any;
      feeAmount: any;
      networkFeeAmount: any;
      extraFeeAmount: any;
    }) {
      try {
        const {
          id,
          baseCurrency,
          baseCurrencyAmount,
          quoteCurrency,
          quoteCurrencyAmount,
          walletAddress,
          status,
          feeAmount,
          networkFeeAmount,
          extraFeeAmount,
        } = props;

        const transactionDetails = {
          type: "Moonpay_buy",
          amount: quoteCurrencyAmount,
          asset: quoteCurrency,
          status,
          metadata: {
            baseCurrency,
            baseCurrencyAmount,
            walletAddress,
            feeAmount,
            networkFeeAmount,
            extraFeeAmount,
          },
          tx_hash: id,
        };

        await addTransaction(transactionDetails);
        setTransactions(transactionDetails);
        console.log(`Transaction ${id} completed with status: ${status}`);
        setSuccess(true);
        setLoading(false);
      } catch (error) {
        console.error("Error during transaction completion:", error);
        setLoading(false);
        setError("Failed to complete transaction.");
      }
    },
  };

  return {
    configuration,
    transactions,
    loading,
    error,
    success,
  };
};
