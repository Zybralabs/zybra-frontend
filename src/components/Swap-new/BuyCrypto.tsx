"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useMoonPay } from "@/lib/hooks/useMoonpay";
import { useCoinbasePay } from "@/lib/hooks/useCoinbase";
import { useUserAccount } from "@/context/UserAccountContext";
import countries from "@/json/countries.json";
import moonpay from "../../../public/img/moonpay.png";
import coinbase from "../../../public/img/coinbase.png";

const MoonPayBuyWidget = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayBuyWidget),
  { ssr: false },
);

const amounts = [100, 300, 1000];

const paymentProviders = [
  { name: "Coinbase", methods: "Debit Card, ACH", icon: coinbase },
  {
    name: "MoonPay",
    methods: "Venmo, PayPal, Debit Card, and other options",
    icon: moonpay,
  },
];

type ProcessStatus = "idle" | "processing" | "success" | "error";

export default function BuyCrypto() {
  const [selectedAmount, setSelectedAmount] = useState(300);
  const [showCheckout, setShowCheckout] = useState(false);
  const { address } = useUserAccount();
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const fiatCurrency = "usd";
  const cryptoCurrency = "usdc";
  const fiatAmount = selectedAmount;

  // MoonPay Hook
  const { configuration: moonPayConfig, loading: moonPayLoading } = useMoonPay({
    walletAddress: address ?? "",
    fiatCurrency,
    cryptoCurrency,
    fiatAmount,
  });

  // Coinbase Pay Hook
  const { openCoinbasePay, loading: coinbaseLoading } = useCoinbasePay({
    addresses: { ethereum: [address ?? ""] },
    assets: [cryptoCurrency],
  });

  // Handle status changes from payment providers
  useEffect(() => {
    if (moonPayLoading || coinbaseLoading) {
      setProcessStatus("processing");
      setStatusMessage("Processing your payment...");
      setShowStatusDialog(true);
    } else if (processStatus === "processing") {
      // This will trigger when loading completes
      // In a real app, you'd have success/error callbacks
      const timer = setTimeout(() => {
        if (Math.random() > 0.2) { // Simulate 80% success rate
          setProcessStatus("success");
          setStatusMessage("Payment successful! Your assets will be available shortly.");
        } else {
          setProcessStatus("error");
          setStatusMessage("There was an issue processing your payment. Please try again.");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [moonPayLoading, coinbaseLoading, processStatus]);

  // Reset state when status dialog is closed
  useEffect(() => {
    if (!showStatusDialog && processStatus !== "idle") {
      const timer = setTimeout(() => {
        setProcessStatus("idle");
        setStatusMessage("");
        if (processStatus === "success") {
          setSelectedProvider(null);
          setShowCheckout(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showStatusDialog, processStatus]);

  const handleContinue = () => {
    if (!address) {
      setProcessStatus("error");
      setStatusMessage("Please connect your wallet first to continue.");
      setShowStatusDialog(true);
      return;
    }
    
    if (selectedAmount <= 0) {
      setProcessStatus("error");
      setStatusMessage("Please enter a valid amount.");
      setShowStatusDialog(true);
      return;
    }
    
    setShowCheckout(true);
  };

  const handlePaymentSelection = (provider: { name: string; methods?: string; icon?: StaticImageData | string }) => {
    setSelectedProvider(provider.name);
    setProcessStatus("processing");
    setShowStatusDialog(true);
    
    setTimeout(() => {
      if (provider.name === "MoonPay") {
        // Ensure MoonPay logic doesn't re-render unnecessarily
        if (!moonPayConfig) {
          setProcessStatus("error");
          setStatusMessage("Unable to initialize MoonPay. Please try again.");
          return;
        }
        console.log("MoonPay widget configured:", moonPayConfig);
      } else if (provider.name === "Coinbase") {
        // Trigger Coinbase logic
        openCoinbasePay();
      }
    }, 1000);
  };

  // Status icon based on current status
  const getStatusIcon = () => {
    switch (processStatus) {
      case "processing":
        return <Loader2 className="h-10 w-10 animate-spin text-[#4BB6EE]" />;
      case "success":
        return <CheckCircle2 className="h-10 w-10 text-green-500" />;
      case "error":
        return <AlertCircle className="h-10 w-10 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full">
      {/* Main container with responsive width */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-0">
        {/* Outer card */}
        <div className="bg-[#001a26] border border-[#022e45]/60 rounded-xl shadow-[0_8px_32px_rgba(0,20,40,0.3)] overflow-hidden mb-4">
          {/* Inner card - with responsive padding */}
          <div className="bg-[#001a26] border border-[#022e45]/60 rounded-lg m-2 sm:m-4 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-3 sm:p-4">
              <h2 className="text-sm sm:text-base font-medium text-white">You&apos;re buying</h2>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-28 sm:w-36 py-1 px-2 rounded-lg bg-[#001824] text-white/80 border border-[#034a70]/40 text-xs sm:text-sm">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-[#001824] border-[#034a70]/40 max-h-60">
                  {countries
                    .sort((a, b) => a.country.localeCompare(b.country))
                    .map((country) => (
                      <SelectItem
                        key={country.abbreviation}
                        className="text-white/80 focus:text-white focus:bg-[#013853] text-xs sm:text-sm"
                        value={country.abbreviation.toLowerCase()}
                      >
                        {country.country}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Amount display - responsive sizing */}
            <div className="p-3 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-full mb-8 sm:mb-16 mt-4 sm:mt-8">
                <span className="text-5xl sm:text-7xl text-white/80 font-bold mr-3 sm:mr-6">$</span>
                <input
                  type="text"
                  value={selectedAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setSelectedAmount(value ? Number(value) : 0);
                  }}
                  className="text-5xl sm:text-7xl w-36 sm:w-60 text-center bg-transparent text-white font-bold border-none outline-none"
                  placeholder="0"
                />
              </div>
              
              {/* Amount buttons - responsive grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 w-full px-2 sm:px-6 mb-4 sm:mb-6">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-2 rounded-md text-white text-sm transition-colors duration-200 ${
                      selectedAmount === amount 
                        ? "bg-[#013853] border border-[#034a70]/80" 
                        : "bg-[#001824] border border-[#034a70]/40 hover:bg-[#012B3F]/70"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={processStatus === "processing"}
            className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] mx-2 sm:mx-4 mb-2 sm:mb-4 py-2.5 sm:py-3 bg-[#013853] hover:bg-[#013853]/90 text-white font-medium text-sm sm:text-base rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processStatus === "processing" ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                Processing...
              </span>
            ) : "Continue"}
          </button>
        </div>
      </div>
  
      {/* Payment Selection Dialog - responsive */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-[#001824] text-white border-[#034a70]/60 max-w-md w-[calc(100%-32px)] sm:w-full mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl mb-2">Checkout with</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 mt-2">
            {paymentProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => handlePaymentSelection(provider)}
                disabled={processStatus === "processing"}
                className={`w-full flex items-center justify-start p-3 sm:p-4 text-left border transition-all duration-200 rounded-md
                  ${selectedProvider === provider.name
                    ? "bg-[#013853]/70 border-[#4BB6EE]/60 ring-1 ring-[#4BB6EE]/40"
                    : "bg-[#012B3F]/50 border-[#034a70]/60 hover:bg-[#013853]/40 hover:border-[#034a70]/80"
                  } 
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {provider.icon ? (
                  <Image
                    src={provider.icon}
                    alt={`${provider.name} icon`}
                    width={36}
                    height={36}
                    className="mr-3 sm:mr-4 rounded-full p-1 sm:w-11 sm:h-11"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#013853]/40 rounded-full mr-3 sm:mr-4 flex items-center justify-center">
                    <span className="text-[#4BB6EE] font-bold">{provider.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-sm sm:text-base">{provider.name}</div>
                  <div className="text-xs sm:text-sm text-gray-400">{provider.methods}</div>
                </div>
                {selectedProvider === provider.name && processStatus === "processing" && (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 ml-2 animate-spin text-[#4BB6EE]" />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-2 pt-2 border-t border-[#034a70]/40 text-xs text-white/60">
            Your purchase will be available in your wallet after payment confirmation.
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Status Dialog - responsive */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-[#001425] border-[#034a70]/60 text-white max-w-md w-[calc(100%-32px)] sm:w-full mx-auto rounded-lg">
          <div className="flex items-start py-3 sm:py-4">
            <div className="mr-3 sm:mr-4 flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <h3 className={`text-base sm:text-lg font-medium mb-1 sm:mb-2 ${
                processStatus === "success" ? "text-green-400" : 
                processStatus === "error" ? "text-red-400" : "text-[#4BB6EE]"
              }`}>
                {processStatus === "processing" ? "Processing" : 
                 processStatus === "success" ? "Success" : 
                 processStatus === "error" ? "Error" : ""}
              </h3>
              <p className="text-sm sm:text-base text-white/80">{statusMessage}</p>
              
              {processStatus === "success" && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#012B3F]/70 rounded-md border border-[#034a70]/40">
                  <div className="text-xs sm:text-sm font-medium text-white mb-1">Transaction Details</div>
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs">
                    <div className="text-white/60">Amount:</div>
                    <div className="text-right">${selectedAmount.toFixed(2)} USD</div>
                    <div className="text-white/60">Payment Method:</div>
                    <div className="text-right">{selectedProvider}</div>
                    <div className="text-white/60">Transaction ID:</div>
                    <div className="text-right text-[#4BB6EE]">
                      {Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
              
              {processStatus === "error" && (
                <button 
                  onClick={() => setShowStatusDialog(false)}
                  className="mt-3 sm:mt-4 w-full py-2 bg-[#013853] hover:bg-[#013853]/90 text-white text-sm rounded-md transition-colors"
                >
                  Try Again
                </button>
              )}
              
              {processStatus === "success" && (
                <button 
                  onClick={() => setShowStatusDialog(false)}
                  className="mt-3 sm:mt-4 w-full py-2 bg-[#013853] hover:bg-[#013853]/90 text-white text-sm rounded-md transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  
      {/* MoonPay Widget */}
      {moonPayConfig && selectedProvider === "MoonPay" && processStatus !== "processing" && (
        <MoonPayBuyWidget {...moonPayConfig} />
      )}
    </div>
  );
}