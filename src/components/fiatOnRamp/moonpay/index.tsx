import React from "react";
import dynamic from "next/dynamic";
import { useMoonPay } from "@/lib/hooks/useMoonpay";

const MoonPayBuyWidget = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayBuyWidget),
  { ssr: false },
);

// Define props type for MoonPayWidget
interface MoonPayWidgetProps {
  walletAddress: string | null; // Wallet address can be null
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
}

const MoonPayWidget: React.FC<MoonPayWidgetProps> = ({
  walletAddress,
  fiatCurrency,
  cryptoCurrency,
  fiatAmount,
}) => {
  // Ensure walletAddress is always a string
  const normalizedWalletAddress = walletAddress ?? ""; // Default to an empty string if walletAddress is null

  const { configuration, loading, error, success } = useMoonPay({
    walletAddress: normalizedWalletAddress, // Pass the normalized walletAddress
    fiatCurrency,
    cryptoCurrency,
    fiatAmount,
  });

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold mb-4">Buy Crypto with MoonPay</h1>
      {/* MoonPay widget */}
      {configuration && (
        <MoonPayBuyWidget {...configuration} />
      )}
      {loading && <p className="mt-4 text-blue-500">Processing transaction...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      {success && <p className="mt-4 text-green-500">Transaction completed successfully!</p>}
    </div>
  );
};

export default MoonPayWidget;
