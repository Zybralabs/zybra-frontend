"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "./slider";
import { EthIcon,  ZfiIcon } from "../Icons";
import { Card } from "./Card";
import { Button } from "./Button";
import { useZRUSDStaking } from "../../hooks/useStaking";
import { ErrorModal, SuccessModal } from "../Modal";
import { SupportedChainId, ZFI, ZFI_STAKING_ADDRESS } from "@/constant/addresses";
import { useChainId } from "wagmi";
import { fromWei, toWei } from "@/hooks/formatting";
import { useUserAccount } from "@/context/UserAccountContext";
import { useRouter } from "next/navigation";
import { useStockIcon } from "@/hooks/useStockIcon";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { accountType } from "@/config";
import { ethers } from "ethers";
import { WalletType } from "@/constant/account/enum";
import FundingHelper from "@/components/AccountKit/FundingHelper";

interface ErrorState {
  title: string;
  message: string;
}

export default function Staking() {
  // State management
  const route = useRouter();
  const [isStaking, setIsStaking] = useState(true);
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // Refs to track processed transactions
  const processedApprovalRef = useRef<string | null>(null);
  const processedReceiptRef = useRef<string | null>(null);

  const { address: userAddress, walletType, zfi_balance } = useUserAccount();
  const chainId = useChainId();

  // Account Kit integration
  const { client } = useSmartAccountClient({ type: accountType });
  const { sendUserOperationAsync, sendUserOperationResult } = useSendUserOperation({
    client,
    waitForTxn: true,
  });

  const {
    totalStaked,
    stakerResult: szfi_balance,
    totalProfitDistributed,
    stake,
    unstake,
    loading: stakingLoading,
    receipt,
    error: stakingError,
    setError: setStakingError,
  } = useZRUSDStaking(ZFI_STAKING_ADDRESS[chainId as SupportedChainId], chainId);

  const [amount, setAmount] = useState(0);
  const SZFI_BALANCE = useMemo(
    () => (szfi_balance ? (fromWei(szfi_balance?.amountStaked)) : undefined),
    [szfi_balance],
  );

  // Contract interactions
  const {
    approvalState,
    approveCallback,
    loading: approvalLoading,
    error: approvalError,
    receipt: approvalReceipt,
  } = useApproveCallback(
    toWei(amount),
    userAddress,
    ZFI_STAKING_ADDRESS[chainId as SupportedChainId],
    ZFI[chainId as SupportedChainId],
    walletType,
    "ZFI",
  );

  // Enhanced error handling with Account Kit support
  useEffect(() => {
    if (approvalError) {
      const errorMessage = approvalError.message || "Failed to approve token";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Approval Error",
          message: errorMessage,
        });
      }
    }

    if (stakingError) {
      const errorMessage = stakingError.message || "Failed to Stake token";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Staking Error",
          message: errorMessage,
        });
      }
    }
  }, [approvalError, stakingError]);

  // Success handling
  useEffect(() => {
    // Handle approval receipt - check both message and hash
    if (approvalReceipt && (approvalReceipt.message || approvalReceipt.hash)) {
      const txHash = approvalReceipt.message || approvalReceipt.hash || "";
      // Check if we've already processed this approval receipt
      if (processedApprovalRef.current !== txHash && txHash) {
        console.log("Approval receipt received:", txHash);
        setSuccess({
          title: "Approval Successful",
          message: "ZFI token approval successful",
          txHash: txHash,
        });
        // Mark this approval as processed
        processedApprovalRef.current = txHash;

        // Clear approval loading state
        setIsLoading(false);
      }
    }

    // Handle transaction receipt
    if (receipt) {
      // Check if we've already processed this transaction receipt
      if (processedReceiptRef.current !== receipt) {
        console.log("Transaction receipt received:", receipt);
        setSuccess({
          title: isStaking ? "Staking Successful" : "Unstaking Successful",
          message: isStaking
            ? "Your tokens have been successfully staked."
            : "Your tokens have been successfully unstaked.",
          txHash: receipt,
        });
        // Mark this transaction as processed
        processedReceiptRef.current = receipt;

        // Clear loading state
        setIsLoading(false);
      }
    }
  }, [approvalReceipt, receipt, isStaking]);

  // Amount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAmount(sliderValue);
    }, 100);
    return () => clearTimeout(timer);
  }, [sliderValue]);

  // Fallback to clear loading state if transaction takes too long
  useEffect(() => {
    if (isLoading || approvalLoading) {
      const timeout = setTimeout(() => {
        console.log("Transaction timeout - clearing loading state");
        setIsLoading(false);
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, approvalLoading]);

  // Handle input change
  const handleInputChange = (e: { target: { value: string; }; }) => {
    const value = parseFloat(e.target.value) || 0;
    const max = isStaking ? (zfi_balance ?? 0) : (SZFI_BALANCE ?? 0);
    if (value > max) {
      setSliderValue(max);
    } else {
      setSliderValue(value);
    }
  };

  // Handle approval process
  const handleApproval = useCallback(async () => {
    if (!userAddress) {
      setError({ title: "Error", message: "Please connect your wallet" });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Reset the processed approval ref when initiating a new approval
      processedApprovalRef.current = null;

      const result = await approveCallback();
      console.log("Approval result:", result);
    } catch (err) {
      console.error("Error during approval:", err);

      const errorMessage = (err as Error).message || "Approval failed";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: "Approval Error",
          message: errorMessage,
        });
      }
    } finally {
      // Don't set loading to false here, let the success handler do it
      // setIsLoading(false);
    }
  }, [userAddress, setError, setIsLoading, setSuccess, approveCallback, setShowFundingHelper]);

  // Handle stake/unstake process
  const handleStakeUnstake = useCallback(async () => {
    if (!userAddress) {
      setError({ title: "Error", message: "Please connect your wallet" });
      return;
    }

    if (!amount || amount <= 0) {
      setError({ title: "Invalid Amount", message: "Please enter a valid amount" });
      return;
    }

    setIsLoading(true);
    setSuccess(null);
    setError(null);

    // Reset the processed receipt ref when initiating a new transaction
    processedReceiptRef.current = null;

    try {
      if (isStaking) {
        const result = await stake(amount);
        console.log("Staking result:", result);
      } else {
        const result = await unstake(amount);
        console.log("Unstaking result:", result);
      }
    } catch (err) {
      console.error("Error during staking/unstaking:", err);

      const errorMessage = (err as Error).message || "Transaction failed";

      // Check if it's an Account Kit gas fee issue
      if (errorMessage.includes("needs ETH for gas fees") ||
          errorMessage.includes("Send Base Sepolia ETH to:")) {
        setShowFundingHelper(true);
      } else if (stakingError) {
        setError({
          title: "Staking Error",
          message: stakingError.message || "Failed to Stake token",
        });
      } else {
        setError({
          title: isStaking ? "Staking Error" : "Unstaking Error",
          message: errorMessage,
        });
      }
    } finally {
      // Don't set loading to false here, let the success handler do it
      // setIsLoading(false);
    }
  }, [userAddress, amount, isStaking, setError, setIsLoading, setSuccess, stake, unstake, stakingError, setShowFundingHelper]);

  const handleSuccessClose = useCallback(() => {
    setSuccess(null);

    // Don't reset the processed transaction refs here
    // This would cause the success modal to show again if the receipt is still in state
    // We only want to reset these when a new transaction is initiated
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
    setStakingError(null);
  }, [setStakingError]);

  // Handle percentage clicks
  const handlePercentageClick = (percentage: number) => {
    const max = isStaking ? (zfi_balance ?? 0) : (SZFI_BALANCE ?? 0);
    setSliderValue(max * (percentage / 100));
  };

  // Determine button state and text
  const getButtonConfig = useCallback(() => {
    if (!userAddress) {
      return {
        text: "Connect Wallet",
        onClick: () => {
          route.push("/signup");
        },
        loading: false,
        disabled: false,
      };
    }

    if (isStaking) {
      if (approvalState === ApprovalState.NOT_APPROVED) {
        return {
          text: "Approve ZFI",
          onClick: handleApproval,
          loading: approvalLoading,
          disabled: amount <= 0,
        };
      }
      return {
        text: "Stake ZFI",
        onClick: handleStakeUnstake,
        loading: stakingLoading || isLoading,
        disabled: amount <= 0 || approvalState !== ApprovalState.APPROVED,
      };
    }
    return {
      text: "Unstake sZFI",
      onClick: handleStakeUnstake,
      loading: stakingLoading || isLoading,
      disabled: amount <= 0,
    };
  }, [
    userAddress,
    isStaking,
    approvalState,
    amount,
    approvalLoading,
    stakingLoading,
    isLoading,
    route,
    handleApproval,
    handleStakeUnstake
  ]);

  const buttonConfig = getButtonConfig();

  return (
    <div className="flex-1 text-white flex flex-col items-center justify-center py-10">
      <div className="max-w-2xl w-full space-y-8 px-4">
        {/* Header with subtle animation */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            {isStaking ? "Simple and secure staking" : "Unstake your sZFI"}
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            {isStaking
              ? "Earn staking rewards every second with sZFI, a decentralized liquid staking token with slashing protection."
              : "Convert your sZFI back to ZFI tokens and withdraw your staking position."}
          </p>
        </motion.div>

        {/* Toggle Buttons */}
        <div className="flex justify-center">
          <motion.div
            className="bg-[#00233A] rounded-full p-1 w-64 shadow-[0_0_15px_rgba(0,80,140,0.3)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative flex items-center">
              <motion.div
                className="absolute bg-[#065C92] rounded-full h-full w-1/2 shadow-[0_0_10px_rgba(6,92,146,0.5)]"
                animate={{ x: isStaking ? "0%" : "100%" }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
              ></motion.div>
              <button
                className={`relative  flex-1 text-center py-2 transition-colors duration-300 ${isStaking ? "text-white font-medium" : "text-gray-400"
                  }`}
                onClick={() => {
                  setIsStaking(true);
                  // Clear success state when switching tabs
                  setSuccess(null);
                }}
                disabled={isLoading || approvalLoading || stakingLoading}
              >
                Stake
              </button>
              <button
                className={`relative  flex-1 text-center py-2 transition-colors duration-300 ${!isStaking ? "text-white font-medium" : "text-gray-400"
                  }`}
                onClick={() => {
                  setIsStaking(false);
                  // Clear success state when switching tabs
                  setSuccess(null);
                }}
                disabled={isLoading || approvalLoading || stakingLoading}
              >
                Unstake
              </button>
            </div>
          </motion.div>
        </div>

        {/* Main content area */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* WRAPPER Header */}


          <div className="p-6">
            {/* Stats Cards - Only show in staking mode */}
            <AnimatePresence mode="wait">
              {isStaking && (
                <motion.div
                  className="grid grid-cols-2 gap-4 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  key="stats-cards"
                >
                 <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60">
  <div className="text-gray-400 text-sm flex items-center">
    APY
    <div className="relative ml-1 group">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      {/* Hidden tooltip that only appears on hover */}
      <div className="absolute top-full left-0 mt-2 w-48 bg-[#001C29] text-xs p-2.5 rounded shadow-lg border border-[#003354] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
        <div className="absolute top-0 left-3 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-[#001C29] border-l border-t border-[#003354]"></div>
        <div className="text-gray-300">
          <div className="flex justify-between mb-1">
            <span>Zybra yield:</span>
            <span className="text-green-400">1.5%</span>
          </div>
          <div className="flex justify-between">
            <span>Debt charge fees:</span>
            <span className="text-blue-400">1.39%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="text-2xl font-bold mt-1 text-white">2.89%</div>
</div>
                  <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60">
  <div className="text-gray-400 text-sm flex items-center">
    Proj. annual reward
    <div className="relative ml-1 group">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      {/* Tooltip that appears below the info icon */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[#001C29] text-xs p-2.5 rounded shadow-lg border border-[#003354] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200  pointer-events-none">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-[#001C29] border-l border-t border-[#003354]"></div>
        <div className="text-gray-300 text-center">
          These numbers can vary based on network conditions and staking participation
        </div>
      </div>
    </div>
  </div>

  <div className="text-2xl font-bold mt-1 flex items-center">
    <EthIcon className="h-4 w-4 mr-1 text-yellow-500" />
    {amount > 0 ? (amount * 0.0289).toFixed(2) : "0.00"}
  </div>
</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* From/To Section - Direction changes based on mode */}
            <div className="flex items-center gap-3 mb-6 bg-[#00233A] rounded-lg border border-[#003354]/60 p-4 ">
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">From</div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${isStaking ? "bg-blue-600" : "bg-green-600"} flex items-center justify-center text-xs font-bold`}>
                  <ZfiIcon/>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 flex items-center justify-center bg-[#001C29] rounded-full border border-[#003354]/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">To</div>
                <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${!isStaking ? "bg-blue-600" : "bg-green-600"} flex items-center justify-center text-xs font-bold`}>
                <ZfiIcon/>
                  </div>
                  {/* <div className="font-medium">{isStaking ?<sZfiIcon/>: <ZfiIcon/>}</div> */}
                </div>
              </div>
            </div>

            {/* Available Balance */}
            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full ${isStaking ? "bg-blue-600" : "bg-green-600"} flex items-center justify-center`}>
                  <span className="text-xs font-bold">{isStaking ? "ZF" : "SZ"}</span>
                </div>
                <span className="text-sm text-gray-400">Available to {isStaking ? "Stake" : "Unstake"}</span>
              </div>
              <div className="font-medium text-lg">
                {isStaking
                  ? `${zfi_balance ? zfi_balance.toFixed(2) : "0.00"} ZFI`
                  : `${SZFI_BALANCE ? SZFI_BALANCE.toFixed(2) : "0.00"} sZFI`}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6 bg-[#00182A] rounded-lg border border-[#003354]/60 p-4">
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  className="bg-transparent text-2xl w-full outline-none font-medium"
                  placeholder="0"
                  value={amount > 0 ? amount : ""}
                  onChange={handleInputChange}
                  disabled={isLoading || approvalLoading || stakingLoading}
                />
                <div className="flex items-center gap-2 bg-[#001C29] px-3 py-2 rounded-full border border-[#003354]/60 shadow-inner">
                  <EthIcon className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{isStaking ? "ZFI" : "sZFI"}</span>
                </div>
              </div>

              <div className="text-sm text-gray-400 mt-2">$ {(amount * 2000).toFixed(2)}</div>
            </div>

            {/* Percentage buttons */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handlePercentageClick(percent)}
                  className="py-2 px-2 bg-[#001C29] rounded-md border border-[#003354]/60 text-sm hover:bg-[#002E48] transition-colors duration-200 hover:border-[#0A4B7C]/80"
                  disabled={isLoading || approvalLoading || stakingLoading}
                >
                  {percent}%
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="mb-6">
              <Slider
                value={[sliderValue]}
                onValueChange={(value) => setSliderValue(value[0])}
                max={isStaking ? (zfi_balance ?? 0) : (SZFI_BALANCE ?? 0)}
                step={0.01}
                className="my-4"
                thumbClassName="w-5 h-5 border-2 border-[#4BB6EE] bg-white shadow-[0_0_10px_rgba(75,182,238,0.5)] hover:shadow-[0_0_15px_rgba(75,182,238,0.7)]"
                trackClassName="bg-gradient-to-r from-[#4BB6EE] to-[#65C7F7]"
                disabled={isLoading || approvalLoading || stakingLoading}
              />
            </div>

            {/* Exchange Rate & You Will Receive */}
            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm">Exchange Rate</span>
                <span className="font-medium">
                  {isStaking
                    ? "1 ZFI → 0.95 sZFI"
                    : "1 sZFI → 1.05 ZFI"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">You Receive</span>
                <span className="font-medium text-[#4BB6EE]">
                  {isStaking
                    ? `${amount > 0 ? (amount * 0.95).toFixed(2) : "0"} sZFI`
                    : `${amount > 0 ? (amount * 1.05).toFixed(2) : "0"} ZFI`}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-[#4BB6EE] to-[#65C7F7] hover:from-[#5BC0F5] hover:to-[#75D1FF] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(75,182,238,0.3)] font-medium py-4 text-lg rounded-lg"
                size="lg"
                onClick={buttonConfig.onClick}
                loading={buttonConfig.loading}
                disabled={buttonConfig.disabled}
                variant="default"
              >
                {buttonConfig.text}
              </Button>
            </motion.div>

            {/* Approval Status Indicator - Only show in staking mode when approved */}
            {isStaking && approvalState === ApprovalState.APPROVED && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-3 text-xs text-green-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                ZFI token approved for staking
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        onClose={handleErrorClose}
        title={error?.title || "Error"}
        message={error?.message || "Something went wrong"}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={success != null && success.txHash != null}
        onClose={handleSuccessClose}
        title={success?.title || "Success"}
        message={success?.message || "Operation completed successfully"}
        txHash={success?.txHash}
        chainId={chainId}
      />

      {/* Funding Helper for Account Kit */}
      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </div>
  );
}