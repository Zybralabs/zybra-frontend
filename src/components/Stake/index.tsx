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
import { useChainId, useWaitForTransactionReceipt } from "wagmi";
import { fromWei, toWei } from "@/hooks/formatting";
import { useUserAccount } from "@/context/UserAccountContext";
import { useRouter } from "next/navigation";
import { useStockIcon } from "@/hooks/useStockIcon";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import { ethers } from "ethers";
import { WalletType } from "@/constant/account/enum";
import FundingHelper from "@/components/AccountKit/FundingHelper";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";
import { useReferralCompletion } from "@/hooks/useReferralCompletion";
import { handleTransactionError } from "@/utils/gaslessErrorHandler";


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
  const [approvalSuccess, setApprovalSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [showFundingHelper, setShowFundingHelper] = useState(false);

  // State to track transaction hashes for confirmation
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [stakingTxHash, setStakingTxHash] = useState<string | null>(null);



  // Refs to track processed transactions
  const processedApprovalRef = useRef<string | null>(null);
  const processedReceiptRef = useRef<string | null>(null);

  const { address: userAddress, walletType, zfi_balance } = useUserAccount();
  const chainId = useChainId();
  const { attemptReferralCompletion } = useReferralCompletion();

  // Use centralized smart account client with gas sponsorship (safe version)
  const {
    client,
    isGasSponsored,
    isClientReady,
    sendUserOperationAsync,
    sendUserOperationResult,
  } = useSmartAccountClientSafe();

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

  // Wait for approval transaction confirmation
  const {
    data: approvalTxReceipt,
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    isError: isApprovalError,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}` | undefined,
    confirmations: 2,
  });

  // Wait for staking transaction confirmation
  const {
    data: stakingTxReceipt,
    isLoading: isStakingConfirming,
    isSuccess: isStakingConfirmed,
    isError: isStakingError,
  } = useWaitForTransactionReceipt({
    hash: stakingTxHash as `0x${string}` | undefined,
    confirmations: 2,
  });

  // For Account Kit transactions, we'll use the sendUserOperationResult from the context
  // which provides transaction status and hash information

  // Enhanced error handling with gasless transaction support
  useEffect(() => {
    if (approvalError) {
      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: approvalError
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    }

    if (stakingError) {
      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: stakingError
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    }
  }, [approvalError, stakingError, walletType, isGasSponsored, client]);

  // Handle approval transaction hash and set it for confirmation tracking
  useEffect(() => {
    if (approvalReceipt && (approvalReceipt.message || approvalReceipt.hash)) {
      const txHash = approvalReceipt.message || approvalReceipt.hash || "";
      if (txHash && !approvalTxHash) {
        console.log("Approval transaction submitted:", txHash);
        setApprovalTxHash(txHash);
      }
    }
  }, [approvalReceipt, approvalTxHash]);

  // Handle staking transaction hash and set it for confirmation tracking
  useEffect(() => {
    if (receipt && typeof receipt === 'string' && !stakingTxHash) {
      console.log("Staking transaction submitted:", receipt);
      setStakingTxHash(receipt);
    }
  }, [receipt, stakingTxHash]);

  // Handle Account Kit transaction results for immediate success feedback
  useEffect(() => {
    const handleAccountKitTransaction = async () => {
      if (sendUserOperationResult && walletType === WalletType.MINIMAL) {
        const txHash = typeof sendUserOperationResult === 'string'
          ? sendUserOperationResult
          : sendUserOperationResult.hash;

        if (txHash && !processedReceiptRef.current) {
          console.log("Account Kit transaction completed:", {
            txHash,
            sendUserOperationResult,
            type: typeof sendUserOperationResult
          });

          // Clear approval success modal when main transaction succeeds
          setApprovalSuccess(null);

          // For Account Kit transactions, show success immediately since they're already confirmed
          setTransactionSuccess({
            title: isStaking ? "Staking Confirmed" : "Unstaking Confirmed",
            message: isStaking
              ? "Your tokens have been successfully staked and confirmed on the blockchain."
              : "Your tokens have been successfully unstaked and confirmed on the blockchain.",
            txHash: txHash,
          });

          // Complete referral if this is the user's first qualifying action
          await attemptReferralCompletion('staking');

          // Mark this transaction as processed
          processedReceiptRef.current = txHash;
          setIsLoading(false);
          setStakingTxHash(null);
        }
      }
    };

    handleAccountKitTransaction();
  }, [sendUserOperationResult, walletType, isStaking, attemptReferralCompletion]);

  // Success handling - only show success when transactions are CONFIRMED
  useEffect(() => {
    // Handle approval confirmation for regular wallets
    if (isApprovalConfirmed && approvalTxReceipt && walletType !== WalletType.MINIMAL) {
      const txHash = approvalTxReceipt.transactionHash;
      // Check if we've already processed this approval confirmation
      if (processedApprovalRef.current !== txHash) {
        console.log("Approval transaction confirmed:", txHash);
        setApprovalSuccess({
          title: "Approval Confirmed",
          message: "ZFI token approval has been confirmed on the blockchain",
          txHash: txHash,
        });
        // Mark this approval as processed
        processedApprovalRef.current = txHash;
        // Clear approval loading state
        setIsLoading(false);
        // Reset approval tx hash
        setApprovalTxHash(null);
      }
    }

    // Handle approval confirmation for Account Kit (immediate success)
    if (approvalReceipt && walletType === WalletType.MINIMAL) {
      const txHash = approvalReceipt.hash || approvalReceipt.message;
      if (txHash && processedApprovalRef.current !== txHash) {
        console.log("Account Kit approval transaction completed:", txHash);
        setApprovalSuccess({
          title: "Approval Confirmed",
          message: "ZFI token approval has been confirmed on the blockchain",
          txHash: txHash,
        });
        // Mark this approval as processed
        processedApprovalRef.current = txHash;
        // Clear approval loading state
        setIsLoading(false);
        // Reset approval tx hash
        setApprovalTxHash(null);
      }
    }

    // Handle staking confirmation
    if (isStakingConfirmed && stakingTxReceipt) {
      const txHash = stakingTxReceipt.transactionHash;
      // Check if we've already processed this staking confirmation
      if (processedReceiptRef.current !== txHash) {
        console.log("Staking transaction confirmed:", txHash);

        // Clear approval success modal when main transaction succeeds
        setApprovalSuccess(null);

        setTransactionSuccess({
          title: isStaking ? "Staking Confirmed" : "Unstaking Confirmed",
          message: isStaking
            ? "Your tokens have been successfully staked and confirmed on the blockchain."
            : "Your tokens have been successfully unstaked and confirmed on the blockchain.",
          txHash: txHash,
        });

        // Complete referral if this is the user's first qualifying action
        attemptReferralCompletion('staking');

        // Mark this transaction as processed
        processedReceiptRef.current = txHash;
        // Clear loading state
        setIsLoading(false);
        // Reset staking tx hash
        setStakingTxHash(null);
      }
    }
  }, [isApprovalConfirmed, approvalTxReceipt, isStakingConfirmed, stakingTxReceipt, isStaking, walletType, approvalReceipt]);

  // Handle transaction confirmation errors
  useEffect(() => {
    if (isApprovalError && approvalTxHash) {
      console.error("Approval transaction failed confirmation");
      setError({
        title: "Approval Failed",
        message: "The approval transaction failed to confirm. Please try again.",
      });
      setApprovalTxHash(null);
      setIsLoading(false);
    }

    if (isStakingError && stakingTxHash) {
      console.error("Staking transaction failed confirmation");
      setError({
        title: isStaking ? "Staking Failed" : "Unstaking Failed",
        message: `The ${isStaking ? 'staking' : 'unstaking'} transaction failed to confirm. Please try again.`,
      });
      setStakingTxHash(null);
      setIsLoading(false);
    }
  }, [isApprovalError, approvalTxHash, isStakingError, stakingTxHash, isStaking]);

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
      setApprovalSuccess(null);
      setTransactionSuccess(null);

      // Reset the processed approval ref when initiating a new approval
      processedApprovalRef.current = null;

      const result = await approveCallback();
      console.log("Approval result:", result);
    } catch (err) {
      console.error("Error during approval:", err);

      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: err as Error
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    } finally {
      // Don't set loading to false here, let the success handler do it
      // setIsLoading(false);
    }
  }, [userAddress, setError, setIsLoading, approveCallback, setShowFundingHelper, walletType, isGasSponsored, client]);

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
    setApprovalSuccess(null);
    setTransactionSuccess(null);
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

      const errorHandlerResult = handleTransactionError({
        walletType: walletType || WalletType.WEB3,
        isGasSponsored,
        smartAccountAddress: client?.account?.address,
        originalError: err as Error
      });

      if (errorHandlerResult.shouldShowFundingHelper) {
        setShowFundingHelper(true);
      } else if (errorHandlerResult.shouldShowErrorModal) {
        setError({
          title: errorHandlerResult.errorTitle,
          message: errorHandlerResult.errorMessage,
        });
      }
    } finally {
      // Don't set loading to false here, let the success handler do it
      // setIsLoading(false);
    }
  }, [userAddress, amount, isStaking, setError, setIsLoading, stake, unstake, setShowFundingHelper, walletType, isGasSponsored, client]);

  const handleApprovalSuccessClose = useCallback(() => {
    setApprovalSuccess(null);
  }, []);

  const handleTransactionSuccessClose = useCallback(() => {
    setTransactionSuccess(null);
    // Also clear approval success when closing transaction success
    setApprovalSuccess(null);
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
      // Check if approval is pending confirmation (for regular wallets)
      if (approvalTxHash && isApprovalConfirming && walletType !== WalletType.MINIMAL) {
        return {
          text: "Confirming Approval...",
          onClick: () => {},
          loading: true,
          disabled: true,
        };
      }

      // Check if approval is needed (real-time state update)
      if (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) {
        return {
          text: approvalState === ApprovalState.PENDING ? "Approving..." : "Approve ZFI",
          onClick: handleApproval,
          loading: approvalLoading || approvalState === ApprovalState.PENDING,
          disabled: amount <= 0 || approvalState === ApprovalState.PENDING,
        };
      }

      // Check if staking transaction is pending confirmation
      if (stakingTxHash && isStakingConfirming && walletType !== WalletType.MINIMAL) {
        return {
          text: "Confirming Transaction...",
          onClick: () => {},
          loading: true,
          disabled: true,
        };
      }

      // Check if Account Kit transaction is in progress
      if (walletType === WalletType.MINIMAL && (stakingLoading || isLoading)) {
        return {
          text: "Processing Transaction...",
          onClick: () => {},
          loading: true,
          disabled: true,
        };
      }

      return {
        text: "Stake ZFI",
        onClick: handleStakeUnstake,
        loading: stakingLoading || isLoading,
        disabled: amount <= 0 || approvalState !== ApprovalState.APPROVED,
      };
    }

    // Unstaking mode
    if (stakingTxHash && isStakingConfirming) {
      return {
        text: "Confirming Transaction...",
        onClick: () => {},
        loading: true,
        disabled: true,
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
    approvalTxHash,
    isApprovalConfirming,
    stakingTxHash,
    isStakingConfirming,
    walletType,
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
                  // Clear all success states and reset processed refs when switching tabs
                  setApprovalSuccess(null);
                  setTransactionSuccess(null);
                  setError(null);
                  processedApprovalRef.current = null;
                  processedReceiptRef.current = null;
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
                  // Clear all success states and reset processed refs when switching tabs
                  setApprovalSuccess(null);
                  setTransactionSuccess(null);
                  setError(null);
                  processedApprovalRef.current = null;
                  processedReceiptRef.current = null;
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

            {/* Approval Status Indicator - Only show in staking mode when approved and not pending */}
            {isStaking && approvalState === ApprovalState.APPROVED && !approvalTxHash && (
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

            {/* Approval Pending Indicator */}
            {isStaking && (approvalState === ApprovalState.PENDING || (approvalTxHash && isApprovalConfirming)) && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-3 text-xs text-yellow-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
                {approvalTxHash ? "Confirming approval..." : "Approval pending..."}
              </motion.div>
            )}

            {/* Transaction Confirming Indicator */}
            {stakingTxHash && isStakingConfirming && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-3 text-xs text-blue-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                Transaction confirming...
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Entity Staking Section - Coming Soon */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)] mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="p-6 relative">
            {/* Coming Soon Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                COMING SOON
              </span>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Entity Staking</h3>
              <p className="text-gray-400 text-sm">
                Advanced staking features designed for institutional and corporate entities with enhanced compliance and reporting capabilities.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">Compliance Reporting</span>
                </div>
                <p className="text-gray-400 text-sm">Automated compliance reports and audit trails for regulatory requirements.</p>
              </div>

              <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-600/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">Multi-Signature Support</span>
                </div>
                <p className="text-gray-400 text-sm">Enterprise-grade multi-signature wallet integration for secure transactions.</p>
              </div>

              <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">Advanced Analytics</span>
                </div>
                <p className="text-gray-400 text-sm">Detailed performance metrics and portfolio analytics for institutional needs.</p>
              </div>

              <div className="bg-[#00233A] p-4 rounded-lg border border-[#003354]/60 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-600/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">Enhanced Security</span>
                </div>
                <p className="text-gray-400 text-sm">Additional security layers and risk management tools for large-scale operations.</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">
                Interested in entity staking features? Get notified when they become available.
              </p>
          
            </div>
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

      {/* Approval Success Modal - Only show if no transaction success */}
      <SuccessModal
        isOpen={approvalSuccess != null && approvalSuccess.txHash != null && transactionSuccess == null}
        onClose={handleApprovalSuccessClose}
        title={approvalSuccess?.title || "Approval Successful"}
        message={approvalSuccess?.message || "Token approval successful"}
        txHash={approvalSuccess?.txHash}
        chainId={chainId}
      />

      {/* Transaction Success Modal - Takes priority over approval success */}
      <SuccessModal
        isOpen={transactionSuccess != null && transactionSuccess.txHash != null}
        onClose={handleTransactionSuccessClose}
        title={transactionSuccess?.title || "Transaction Successful"}
        message={transactionSuccess?.message || "Transaction completed successfully"}
        txHash={transactionSuccess?.txHash}
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