import React, { useState } from "react";

import { useMoonPayWithAbstraction } from "./hooks/useMoonPayWithAbstraction";

const MoonPayAbstractionComponent = () => {
  const {
    createBuyTransaction,
    fetchConversionRate,
    listenForDeposits,
    transactions,
    supportedAssets,
    conversionRate,
    initializeAccount,
  } = useMoonPayWithAbstraction({
    apiKey: "your_moonpay_api_key",
    apiBaseUrl: "https://api.moonpay.com",
  });

  const [fiatAmount, setFiatAmount] = useState(100);
  const [cryptoCurrency, setCryptoCurrency] = useState("USDC");

  const handleBuy = async () => {
    await initializeAccount(); // Ensure account exists
    const tx = await createBuyTransaction(fiatAmount, cryptoCurrency);
    console.log("Transaction:", tx);
  };

  return (
    <div>
      <h1>MoonPay with Account Abstraction</h1>
      <input
        type="number"
        value={fiatAmount}
        onChange={(e) => setFiatAmount(Number(e.target.value))}
      />
      <button onClick={handleBuy}>Buy {cryptoCurrency}</button>
    </div>
  );
};

export default MoonPayAbstractionComponent;
