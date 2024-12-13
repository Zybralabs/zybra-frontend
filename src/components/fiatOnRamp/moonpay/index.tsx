import React from "react";

import dynamic from "next/dynamic";

import { useMoonPay } from "@/lib/hooks/useMoonpay";



const MoonPayBuyWidget = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayBuyWidget),
  { ssr: false }
);

const MoonPayWidget = ({ walletAddress, fiatCurrency, cryptoCurrency, fiatAmount }) => {
  const {
    configuration,
    loading,
    error,
    success,
  } = useMoonPay({
    walletAddress,
    fiatCurrency,
    cryptoCurrency,
    fiatAmount,
  });

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold mb-4">Buy Crypto with MoonPay</h1>
      <MoonPayBuyWidget {...configuration} />
      {loading && <p className="mt-4 text-blue-500">Processing transaction...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      {success && (
        <p className="mt-4 text-green-500">Transaction completed successfully!</p>
      )}
    </div>
  );
};

export default MoonPayWidget;
