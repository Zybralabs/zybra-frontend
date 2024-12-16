import React, { useState, type Dispatch, type SetStateAction } from "react";

import { useUserAccount } from "@/context/UserAccountContext";

import CoinbaseWidget from "./coinbase";
import MoonPayWidget from "./moonpay";

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  fiatAmount: number;
  setFiatAmount: Dispatch<SetStateAction<number>>;
  fiatCurrency: string;
  setFiatCurrency: Dispatch<SetStateAction<string>>;
  cryptoCurrency: string;
  setCryptoCurrency: Dispatch<SetStateAction<string>>;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fiatAmount,
  setFiatAmount,
  fiatCurrency,
  setFiatCurrency,
  cryptoCurrency,
  setCryptoCurrency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div className="bg-white p-6 rounded shadow-md w-1/3">
        <h2 className="text-xl font-semibold mb-4">Set Payment Details</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fiat Amount</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(Number(e.target.value))}
            placeholder="Enter the amount in fiat"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fiat Currency</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value)}
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Crypto Currency</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={cryptoCurrency}
            onChange={(e) => setCryptoCurrency(e.target.value)}
          >
            <option value="eth">ETH</option>
            <option value="btc">BTC</option>
            <option value="usdc">USDC</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const CryptoPaymentPage: React.FC = () => {
  const { address } = useUserAccount(); // Address comes from UserAccountContext
  const [fiatAmount, setFiatAmount] = useState<number>(100);
  const [fiatCurrency, setFiatCurrency] = useState<string>("usd");
  const [cryptoCurrency, setCryptoCurrency] = useState<string>("eth");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSave = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Choose Your Payment Method</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setIsModalOpen(true)}
      >
        Set Payment Details
      </button>

      <InputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        fiatAmount={fiatAmount}
        setFiatAmount={setFiatAmount}
        fiatCurrency={fiatCurrency}
        setFiatCurrency={setFiatCurrency}
        cryptoCurrency={cryptoCurrency}
        setCryptoCurrency={setCryptoCurrency}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MoonPay Section */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">MoonPay</h2>
          <p className="text-sm mb-4">Buy crypto easily with MoonPay.</p>
          <MoonPayWidget
          
            walletAddress={address}
            fiatCurrency={fiatCurrency}
            cryptoCurrency={cryptoCurrency}
            fiatAmount={fiatAmount}
          />
        </div>

        {/* Coinbase Section */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Coinbase</h2>
          <p className="text-sm mb-4">Buy crypto through Coinbase Pay.</p>
          <CoinbaseWidget
            assets={["ETH", "USDC", "BTC"]}
            onSuccess={() => console.log("Coinbase transaction successful")}
            onExit={() => console.log("Coinbase widget exited")}
            onEvent={(event) => console.log("Coinbase event", event)}
          />
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentPage;
