import { useCallback, useState } from "react";
import { useUserAccount } from "@/context/UserAccountContext";

interface UseMoonPayProps {
  walletAddress: string; // Explicitly define the type
  fiatCurrency?: string;
  cryptoCurrency?: string;
  fiatAmount?: number;
}

/**
 * Represents a Fiat currency such as USD, EUR, GBP.
 */
type FiatCurrency = {
  /** The code of the currency such as "USD", "EUR", "GBP". */
  code: string;
  /** The full name of the fiat currency, e.g., "US Dollar", "Euro". */
  name: string;
  /** The symbol of the currency, e.g., "$", "€", "£". */
  id: string;
};

type CryptoCurrency = {
  /** The code of the currency such as "ETH", "BTC". */
  code: string;
  /** The full name of the crypto currency, e.g., "Ethereum", "Bitcoin". */
  name: string;
  /** The address location of the token contract on the blockchain. */
  contractAddress: string | null;
  /** The coin type as defined in SLIP-0044. */
  coinType: string | null;
  /** The chain's Chain ID. */
  chainId: string | null;
  /** The currency's network such as "ethereum", "bitcoin". */
  networkCode: string | null;
};

type WidgetVariant = 'overlay' | 'embedded' | 'newTab' | 'newWindow';

export const useMoonPay = ({
  walletAddress,
  fiatCurrency = "usd",
  cryptoCurrency = "eth",
  fiatAmount = 50,
}: UseMoonPayProps) => {
  const { addTransaction } = useUserAccount();
  const [transactions, setTransactions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [depositId, setDepositId] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Fetch a signature from the backend for URL authentication
  const handleGetSignature = useCallback(async (url: string) => {
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

  // Simulate a deposit request
  const deposit = async (cryptoCode: string, cryptoAmount: number, walletAddress: string) => {
    try {
      console.log(`Depositing ${cryptoAmount} of ${cryptoCode} to ${walletAddress}`);
      return "mocked_deposit_id"; // Mocked deposit ID for example purposes
    } catch (error) {
      console.error("Deposit failed:", error);
      return null;
    }
  };

  // Configuration for MoonPay widget
  const configuration = {
    environment: 'sandbox',
    flow: 'buy',
    defaultBaseCurrencyCode: cryptoCurrency,
    quoteCurrencyCode: fiatCurrency,
    refundWalletAddress: walletAddress,
    quoteCurrencyAmount: fiatAmount.toString(),
    variant: "overlay" as WidgetVariant,
    onUrlSignatureRequested: handleGetSignature,

    async onInitiateDeposit(properties: {
      cryptoCurrency: { code: string };
      cryptoCurrencyAmount: string | number; // Adjusted type
      depositWalletAddress: string;
      cancelTransactionOnError?: boolean;
    }) {
      const { cryptoCurrency, cryptoCurrencyAmount, depositWalletAddress,cancelTransactionOnError } = properties;

      try {
        setLoading(true);
        const normalizedCryptoAmount =
          typeof cryptoCurrencyAmount === "string"
            ? parseFloat(cryptoCurrencyAmount)
            : cryptoCurrencyAmount;

        if (isNaN(normalizedCryptoAmount)) {
          throw new Error("Invalid cryptoCurrencyAmount");
        }

        const redirectUrl = `http://localhost:3001/wallet-sign?cryptoCode=${cryptoCurrency.code}&amount=${normalizedCryptoAmount}&walletAddress=${depositWalletAddress}`;

        const depositId = await deposit(cryptoCurrency.code, normalizedCryptoAmount, depositWalletAddress);
        setDepositId(depositId || "default-deposit-id");

        window.open(redirectUrl, "_blank");

        return {
          depositId: depositId || "default-deposit-id",
          cancelTransactionOnError: cancelTransactionOnError ?? false, // Ensure this property is always present
        };
      } catch (error) {
        console.error("Error during deposit initiation:", error);
        setError("Failed to initiate deposit.");
        setLoading(false);

        return {
          depositId: "error-deposit-id",
          cancelTransactionOnError: cancelTransactionOnError ?? false,
        };
    
      }
    },
  //   type  = {
  //     /** The identifier of the transaction */
  //     id: string;
  //     /** When the transaction was created */
  //     createdAt: string;
  //     /** The base (fiat) currency */
  //     baseCurrency: FiatCurrency;
  //     /** The quote (crypto) currency */
  //     quoteCurrency: CryptoCurrency;
  //     /** The spent fiat amount */
  //     baseCurrencyAmount: number;
  //     /** The expected or received quote amount */
  //     quoteCurrencyAmount: number;
  //     /** The MoonPay fee amount, in the fiat currency */
  //     feeAmount: number;
  //     /** The partner's fee amount, in the fiat currency */
  //     extraFeeAmount: number;
  //     /** The network fees incurred in this transaction, in the fiat currency */
  //     networkFeeAmount: number;
  //     /** Whether the base currency amount includes fees */
  //     areFeesIncluded: boolean;
  //     /** The customer's destination wallet address */
  //     walletAddress: string;
  //     /** The customer's destination wallet address tag */
  //     walletAddressTag: string | null;
  //     /** The current status of the transaction */
  //     status: TransactionStatus;
  // };
  async onTransactionCompleted(props: {
    id: string;
    createdAt: string;
    baseCurrency: FiatCurrency;
    quoteCurrency: CryptoCurrency;
    baseCurrencyAmount: number;
    quoteCurrencyAmount: number;
    feeAmount: number;
    extraFeeAmount: number;
    networkFeeAmount: number;
    areFeesIncluded: boolean;
    walletAddress: string;
    walletAddressTag: string | null;
    status: string;
  }) {
    try {
      const {
        id,
        createdAt,
        baseCurrency,
        quoteCurrency,
        baseCurrencyAmount,
        quoteCurrencyAmount,
        feeAmount,
        extraFeeAmount,
        networkFeeAmount,
        areFeesIncluded,
        walletAddress,
        walletAddressTag,
        status,
      } = props;

      const transactionDetails = {
        type: "Moonpay_buy",
        amount: quoteCurrencyAmount,
        asset: quoteCurrency.code,
        status,
        metadata: {
          baseCurrency,
          baseCurrencyAmount,
          quoteCurrency,
          quoteCurrencyAmount,
          feeAmount,
          extraFeeAmount,
          networkFeeAmount,
          areFeesIncluded,
          walletAddress,
          walletAddressTag,
          createdAt,
        },
        tx_hash: id,
      };

      await addTransaction(transactionDetails);
      setTransactions((prev) => ({
        ...prev,
        [id]: transactionDetails,
      }));
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
    depositId,
  };
};