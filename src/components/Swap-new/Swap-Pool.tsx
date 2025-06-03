import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./components/button";
import { Card, CardContent } from "./components/card";
import { Input } from "./components/input";
import { Label } from "./components/label";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/state/hooks";
import { LoadingSpinner } from "../Modal/loading-spinner";
import { useUserAccount } from "@/context/UserAccountContext";
import { ErrorModal, SuccessModal } from "../Modal";
import { useChainId } from "wagmi";
import { CENTRIFUGE_VAULT_ADDRESS, USDC_ADDRESS } from "@/constant/addresses";
import { useTokenBalancess } from "@/lib/hooks/useCurrencyBalance";
import { ApprovalState, useApproveCallback } from "@/hooks/useApproveCallback";
import { fromWei, toWei } from "@/hooks/formatting";
import { useCentrifugeVault } from "@/hooks/useCentrifugeVault";
import { formatBalance, formatPercentage } from "@/utils/formatters";
import type { PoolCardProps } from "../MainPane/MainPane";
import TokenSelector from "./components/token-selector";
import Image from "next/image";
import { usePoolData } from "@/hooks/usePoolsRead";

// Interface for Pool data
interface Pool {
  id: string;
  name: string;
  iconUri: string;
  apr: number;
  valueLocked: number;
  assetClass: string;
  address: string;
  minInvestment?: number;
  currencySymbol: string;
  decimals?: number;
  status?: string;
}

type ErrorState = {
  title: string;
  message: string;
};

type SuccessState = {
  title: string;
  message: string;
  txHash?: string;
};

type ActionState =
  | "connect"
  | "approve"
  | "setOperator"
  | "claimDeposit"
  | "cancelDeposit"
  | "requestDeposit"
  | "claimWithdraw"
  | "requestWithdraw"
  | "noFundsToWithdraw"
  | "cancelWithdraw";

interface PoolInvestPageProps {
  isWithdraw?: boolean;
  setActiveTab?: (tab: string) => void;
}

export default function PoolInvestPage({ isWithdraw = false, setActiveTab }: PoolInvestPageProps) {
  // Chain and router
  const chainId = useChainId();
  const router = useRouter();

  // User account data
  const { address: userAddress, walletType } = useUserAccount();
  const [amount, setAmount] = useState<number | string>("0");
  const [ZrUSDmintAmount, setZrUSDmintAmount] = useState(0);
  const [expectedZTokens, setExpectedZTokens] = useState(0);

  // UI state
  const [isPoolSelectorOpen, setIsPoolSelectorOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAmountTooLarge, setIsAmountTooLarge] = useState(false);

  // Status modals
  const [error, setError] = useState<ErrorState | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  // Get available pools from redux
  const { filteredPools: allPools, loading :poolsLoading} = usePoolData();


  // Default to first pool if available
  const [selectedPool, setSelectedPool] = useState<PoolCardProps | null>(null);

  // Initialize with first pool when data loads
  useEffect(() => {
    if (allPools?.length > 0 && !selectedPool) {
      setSelectedPool(allPools[0]);
    }
  }, [allPools, selectedPool]);

  // Set up vault address based on selected pool
  const vaultAddress = useMemo(() => {
    //@ts-ignore
    return selectedPool?.address || CENTRIFUGE_VAULT_ADDRESS[chainId];
  }, [selectedPool, chainId]);

  // Get token balances
  const [tokenBalances, isLoadingTokenBalances] = useTokenBalancess(
    [USDC_ADDRESS[chainId]],
    userAddress
  );

  // Get approval state for USDC
  const {
    approvalState,
    approveCallback,
    loading: approvalLoading,
    error: approvalError,
    receipt: approvalReceipt,
  } = useApproveCallback(
    toWei(0),
    userAddress,
    vaultAddress,
    USDC_ADDRESS[chainId],
    walletType,
    "USDC"
  );

  // Hook into the Centrifuge Vault functionality
  const {
    requestDeposit,
    deposit,
    requestWithdraw,
    withdraw,
    cancelDepositRequest,
    cancelWithdrawRequest,
    setOperator,
    claimCancelDepositRequest,
    repayingDebt,
    poolTotalCirculationResult,
    userTrancheAssetResult,
    borrowedResult,
    userDepReqVaultCollatAsset,
    userVaultTrancheAsset,
    claimableDepositRequestResult,
    pendingDepositRequestResult,
    pendingCancelDepositRequestResult,
    claimableRedeemRequestResult,
    onRedeemClaimableResult,
    isOperator,
    loading: vaultLoading,
    error: vaultError,
    receipt,
  } = useCentrifugeVault(chainId);

  // Create a memoized object with all vault data for easier access
  const vaultData = useMemo(
    () => ({
      // Vault status
      totalCirculation: poolTotalCirculationResult,
      vaultErr: vaultError,
      vaultReceipt: receipt,
      // User assets and requests
      userTrancheAsset: userTrancheAssetResult ? Number(fromWei(userTrancheAssetResult)) : 0,
      userVaultAsset: userVaultTrancheAsset ? Number(fromWei(userVaultTrancheAsset)) : 0,
      userDepositRequest: userDepReqVaultCollatAsset,
      // Request statuses
      claimableDeposit: claimableDepositRequestResult ? Number(fromWei(claimableDepositRequestResult)) : 0,
      pendingDeposit: pendingDepositRequestResult ? Number(fromWei(pendingDepositRequestResult)) : 0,
      pendingCancelDeposit: pendingCancelDepositRequestResult ? Number(fromWei(pendingCancelDepositRequestResult)) : 0,
      claimableRedeem: claimableRedeemRequestResult ? Number(fromWei(claimableRedeemRequestResult)) : 0,
      onRedeemClaimable: onRedeemClaimableResult,
      // Batch and transaction data
      borrowed: borrowedResult,
      repayingDebt,
      isOperatorCall: isOperator,
    }),
    [
      poolTotalCirculationResult,
      vaultError,
      receipt,
      userTrancheAssetResult,
      userVaultTrancheAsset,
      userDepReqVaultCollatAsset,
      claimableDepositRequestResult,
      pendingDepositRequestResult,
      pendingCancelDepositRequestResult,
      claimableRedeemRequestResult,
      onRedeemClaimableResult,
      borrowedResult,
      repayingDebt,
      isOperator,
    ])

  // Calculate USDC balance
  const usdcBalance = useMemo(
    () => fromWei(
      (tokenBalances as { [tokenAddress: string]: string })[USDC_ADDRESS[chainId]] ?? 0,
      6 // USDC has 6 decimals
    ),
    [tokenBalances, chainId]
  );

  // Determine current action state for UI
  const getActionState = useCallback(() => {
    const {
      claimableDeposit,
      pendingDeposit,
      claimableRedeem,
      isOperatorCall,
      userTrancheAsset,
    } = vaultData;

    // First check if wallet is connected
    if (!userAddress) return "connect";

    // Then check token approval status
    if (!isWithdraw && approvalState === ApprovalState.NOT_APPROVED) return "approve";

    // Check if operator is set
    if (!isOperatorCall) return "setOperator";

    // Handle deposit flow
    if (!isWithdraw) {
      if (claimableDeposit > 0) return "claimDeposit";
      if (pendingDeposit > 0) return "cancelDeposit";
      return "requestDeposit";
    }

    // Handle withdrawal flow
    if (isWithdraw) {
      if (claimableRedeem > 0) return "claimWithdraw";
      if (userTrancheAsset > 0) return "requestWithdraw";
      return "noFundsToWithdraw";
    }

    return isWithdraw ? "requestWithdraw" : "requestDeposit";
  }, [approvalState, isWithdraw, userAddress, vaultData]);

  // Check if amount is too large
  useEffect(() => {
    const actionState = getActionState();

    if (actionState === "requestDeposit") {
      setIsAmountTooLarge(Number(amount) > usdcBalance);
    } else if (actionState === "requestWithdraw") {
      setIsAmountTooLarge(Number(amount) > vaultData.userTrancheAsset);
    }
  }, [amount, usdcBalance, getActionState, vaultData.userTrancheAsset]);

  // Calculate expected zTokens based on investment amount
  useEffect(() => {
    if (amount && selectedPool) {
      // This is a simplified calculation
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const zTokenRate = numAmount * 0.625; // 62.5% ratio for ZrUSD minting
      setZrUSDmintAmount(Number(zTokenRate.toFixed(2)));

      // Calculate expected tokens based on pool APR
      const apr = selectedPool?.apr ? Number(selectedPool.apr) : 0;
      const expectedTokens = numAmount * (1 + (apr / 100));
      setExpectedZTokens(Number(expectedTokens.toFixed(2)));
    } else {
      setZrUSDmintAmount(0);
      setExpectedZTokens(0);
    }
  }, [amount, selectedPool]);

  // Update amount when there are pending operations
  useEffect(() => {
    const actionState = getActionState();
    if (actionState === "cancelDeposit" && vaultData.pendingDeposit > 0) {
      setAmount(vaultData.pendingDeposit);
    } else if (actionState === "claimDeposit" && vaultData.claimableDeposit > 0) {
      setAmount(vaultData.claimableDeposit);
    } else if (actionState === "claimWithdraw" && vaultData.claimableRedeem > 0) {
      setAmount(vaultData.claimableRedeem);
    } else if ((actionState === "requestDeposit" || actionState === "requestWithdraw") && amount === "") {
      setAmount("");
    }
  }, [vaultData, getActionState]);

  // Handle errors
  useEffect(() => {
    if (approvalError) {
      setError({
        title: "Approval Failed",
        message: approvalError.message || "Failed to approve token",
      });
    }
    if (vaultError) {
      setError({
        title: "Transaction Failed",
        message: vaultError.message || "Failed in Action",
      });
    }
  }, [approvalError, vaultError]);

  // Handle success
  useEffect(() => {
    if (approvalReceipt) {
      setSuccess({
        title: "Approval Successful",
        message: "Token approval completed",
        txHash: approvalReceipt.hash,
      });
    }
    if (receipt) {
      setSuccess({
        title: success?.title || "Transaction Successful",
        message: success?.message || "Your transaction was successful",
        txHash: receipt,
      });
    }
  }, [approvalReceipt, receipt]);

  // Function to get the input token based on action state
  const getInputToken = () => {
    const actionState = getActionState();

    switch (actionState) {
      case "requestDeposit":
      case "approve":
      case "cancelDeposit":
        return "USDC"; // When depositing or canceling deposit, input is in USDC
      case "claimWithdraw":
      case "requestWithdraw":
        return "ZrUSD"; // When withdrawing, input is in ZrUSD
      case "claimDeposit":
        return "ZrUSD"; // When claiming deposit, show ZrUSD to be received
      default:
        return isWithdraw ? "ZrUSD" : "USDC";
    }
  };

  // Handle pool selection
  const handlePoolSelect = (pool : PoolCardProps) => {
    setSelectedPool(pool);
    setIsPoolSelectorOpen(false);

    // Reset amounts when changing pools
    setAmount("");
    setZrUSDmintAmount(0);
  };

  // Handle max button click
  const handleMaxClick = () => {
    const actionState = getActionState();

    if (actionState === "requestDeposit") {
      // Deduct estimated fee to avoid "insufficient balance" errors
      const maxAmount = Math.max(0, usdcBalance - 1);
      setAmount(maxAmount.toFixed(2));
    } else if (actionState === "requestWithdraw") {
      setAmount(vaultData.userTrancheAsset.toFixed(2));
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value === "" ? "" : parseFloat(value));
  };

  // Handle ZrUSD amount change
  const handleZrUSDAmountChange = (value: number) => {
    // Limit to 62.5% of deposit amount (simplified calculation)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const maxZrUSDAmount = numAmount * 0.625;

    if (value <= maxZrUSDAmount) {
      setZrUSDmintAmount(value);
    } else {
      setZrUSDmintAmount(maxZrUSDAmount);
    }
  };

  // Handle connect wallet
  const handleConnectWallet = () => {
    router.push("/signup");
  };

  // Handle approval
  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await approveCallback();
      // Success will be handled by the approvalReceipt effect
    } catch (err) {
      // Error will be handled by the approvalError effect
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle set operator
  const handleSetOperator = async () => {
    try {
      setIsProcessing(true);
      const tx = await setOperator();
      if (tx) {
        setSuccess({
          title: "Operator Set Successfully",
          message: "You can now proceed with borrowing ZrUSD",
          txHash: receipt,
        });
      }
    } catch (err: any) {
      setError({
        title: "Failed to Set Operator",
        message: err.message || "Failed to set operator",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deposit request
  const handleRequestDeposit = async () => {
    try {
      setIsProcessing(true);
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const tx = await requestDeposit(numAmount, vaultAddress);
      setSuccess({
        title: "Deposit Requested",
        message: "Your deposit request has been submitted",
        txHash: receipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Request Failed",
        message: err.message || "Failed to request deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle claim deposit
  const handleClaimDeposit = async () => {
    try {
      setIsProcessing(true);
      const tx = await deposit(vaultAddress, ZrUSDmintAmount);
      setSuccess({
        title: "Deposit Successful",
        message: "Your deposit has been processed",
        txHash: receipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Deposit Failed",
        message: err.message || "Failed to process deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel deposit
  const handleCancelDeposit = async () => {
    try {
      setIsProcessing(true);
      const tx = await cancelDepositRequest();
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Cancel Failed",
        message: err.message || "Failed to cancel deposit request",
      });
    } finally {
      if (receipt) {
        setSuccess({
          title: "Deposit Cancelled",
          message: "Your deposit request has been cancelled",
          txHash: receipt,
        });
      }
      setIsProcessing(false);
      setShowDetails(false);
    }
  };

  // Handle withdraw request
  const handleRequestWithdraw = async () => {
    try {
      setIsProcessing(true);
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const tx = await requestWithdraw(numAmount, userAddress || "");
      setSuccess({
        title: "Withdraw Requested",
        message: "Your withdraw request has been submitted",
        txHash: receipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Request Failed",
        message: err.message || "Failed to request withdraw",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle claim withdraw
  const handleClaimWithdraw = async () => {
    try {
      setIsProcessing(true);
      const tx = await withdraw(vaultAddress);
      setSuccess({
        title: "Withdrawal Successful",
        message: "Your withdrawal has been processed",
        txHash: receipt,
      });
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Withdrawal Failed",
        message: err.message || "Failed to process withdrawal",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel withdraw
  const handleCancelWithdraw = async () => {
    try {
      setIsProcessing(true);
      const tx = await cancelWithdrawRequest();
      setShowDetails(false);
    } catch (err: any) {
      setError({
        title: "Cancel Failed",
        message: err.message || "Failed to cancel withdraw request",
      });
    } finally {
      if (receipt) {
        setSuccess({
          title: "Withdraw Cancelled",
          message: "Your withdraw request has been cancelled",
          txHash: receipt,
        });
      }
      setIsProcessing(false);
      setShowDetails(false);
    }
  };

  // Close modals
  const handleSuccessClose = useCallback(() => {
    setSuccess(null);
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  // Handle action button click
  const handleActionClick = () => {
    const actionState = getActionState();

    switch (actionState) {
      case "connect":
        handleConnectWallet();
        break;
      case "approve":
        handleApprove();
        break;
      case "setOperator":
        handleSetOperator();
        break;
      case "requestDeposit":
        handleRequestDeposit();
        break;
      case "claimDeposit":
        handleClaimDeposit();
        break;
      case "cancelDeposit":
        handleCancelDeposit();
        break;
      case "requestWithdraw":
        handleRequestWithdraw();
        break;
      case "claimWithdraw":
        handleClaimWithdraw();
        break;
      // case "cancelWithdraw":
      //   handleCancelWithdraw();
        break;
      case "noFundsToWithdraw":
        // Do nothing, button should be disabled
        break;
      default:
        if (isWithdraw) {
          handleRequestWithdraw();
        } else {
          handleRequestDeposit();
        }
    }
  };

  // Get button text based on state
  const getButtonText = () => {
    const actionState = getActionState();
    const isLoading = isProcessing || approvalLoading || vaultLoading;

    if (isLoading) {
      return (
        <span className="flex items-center gap-2">
          <LoadingSpinner className="h-4 w-4" />
          <span>Processing...</span>
        </span>
      );
    }

    switch (actionState) {
      case "connect":
        return "Connect Wallet";
      case "approve":
        return "Approve USDC";
      case "setOperator":
        return "Set Operator";
      case "requestDeposit":
        return "Request Deposit";
      case "claimDeposit":
        return "Claim Deposit";
      case "cancelDeposit":
        return "Cancel Deposit";
      case "requestWithdraw":
        return "Request Withdraw";
      case "claimWithdraw":
        return "Claim Withdraw";
      // case "cancelWithdraw":
      //   return "Cancel Withdraw";
      case "noFundsToWithdraw":
        return "No Funds to Withdraw";
      default:
        return isWithdraw ? "Request Withdraw" : "Request Deposit";
    }
  };

  // Get button style based on state
  const getButtonStyle = () => {
    const actionState = getActionState();

    switch (actionState) {
      case "connect":
        return "bg-[#9d5bfe] hover:bg-[#a86aff]";
      case "approve":
      case "setOperator":
        return "bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#b45309]";
      case "claimDeposit":
      case "requestDeposit":
        return "bg-gradient-to-r from-[#4BB6EE] to-[#065C92] hover:from-[#5bc0f4] hover:to-[#076eae]";
      case "claimWithdraw":
      case "requestWithdraw":
        return "bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#047857]";
      case "cancelDeposit":
      // case "cancelWithdraw":
      //   return "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500";
      case "noFundsToWithdraw":
        return "bg-gray-500/50 cursor-not-allowed";
      default:
        return isAmountTooLarge
          ? "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 cursor-not-allowed"
          : "bg-[#9d5bfe] hover:bg-[#a86aff]";
    }
  };

  // Determine if button should be disabled
  const isButtonDisabled = () => {
    const actionState = getActionState();
    const isLoading = isProcessing || approvalLoading || vaultLoading;

    if (isLoading) return true;

    // No amount needed for these actions
    const noAmountNeeded = ["connect", "approve", "setOperator", "claimWithdraw"];

    // Amount needed actions
    if (!noAmountNeeded.includes(actionState)) {
      if (actionState === "noFundsToWithdraw") return true;

      if (actionState === "requestDeposit" || actionState === "requestWithdraw") {
        if (!amount || Number(amount) <= 0 || isAmountTooLarge) {
          return true;
        }
      }
    }

    return false;
  };

  const currentActionState = getActionState();
  const inputToken = getInputToken();
  return (
    <div className="flex-1 w-full text-white flex justify-center items-start py-5">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Header Card */}
        <Card className="w-full bg-[#001a26] backdrop-blur-md border border-[#022e45]/60 rounded-xl shadow-[0_4px_16px_rgba(0,10,20,0.25)] overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Invest</h2>
              <p className="text-white/70 text-base">
                {isWithdraw
                  ? "Withdraw your ZrUSD tokens from pools"
                  : `Invest USDC and receive ${selectedPool?.currencySymbol} while investing`}
              </p>

              {/* Pool Selector Button */}
              <div className="mt-4 flex justify-end">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full max-w-xs"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 bg-[#013853]/80 border-[#034a70] text-white hover:bg-[#024d74] transition-colors shadow-sm rounded-md"
                    onClick={() => setIsPoolSelectorOpen(true)}
                  >
                    <div className="flex items-center justify-between w-full">
                      {poolsLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="xs" color="blue" />
                          <span className="text-sm">Loading pools...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            {selectedPool?.iconUri && (
                              <Image
                                src={selectedPool.iconUri}
                                alt={selectedPool?.name || "Pool"}
                                className="w-5 h-5 rounded-full"
                                width={100}
                                height={100}
                              />
                            )}
                            <span className="text-sm">{selectedPool?.name || "Select Pool"}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-[#4BB6EE]" />
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card className="w-full bg-[#001a26] backdrop-blur-md border border-[#022e45]/60 rounded-xl shadow-[0_4px_16px_rgba(0,10,20,0.25)] overflow-hidden">
          <CardContent className="p-0">
            {/* Balance Section */}
            <div className="grid grid-cols-2 gap-0 border-b border-[#022e45]/40">
              {/* Available to invest */}
              <div className="p-5 border-r border-[#022e45]/40">
                <Label className="text-white/60 text-xs mb-1 block">
                  {isWithdraw ? "Available USDC" : "Available to invest"}
                </Label>
                <div className="text-xl font-semibold">
                  {isLoadingTokenBalances ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="xs" color="blue" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span>{Number(usdcBalance).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</span>
                      <span className="text-white/70 text-sm">USDC</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Available invested */}
              <div className="p-5">
                <Label className="text-white/60 text-xs mb-1 block">
                  {isWithdraw ? "Available to withdraw" : "Available invested"}
                </Label>
                <div className="text-xl font-semibold">
                  <div className="flex items-baseline gap-1.5">
                    <span>{formatBalance(vaultData.userTrancheAsset)}</span>
                    <span className="text-white/70 text-sm">{selectedPool?.currencySymbol || "ZrUSD"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment amount input */}
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#013853] flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-[#4BB6EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  disabled={["cancelDeposit", "claimDeposit", "claimWithdraw"].includes(currentActionState)}
                  className="text-2xl bg-transparent border-none text-white focus:ring-0 px-0 h-12 w-full"
                />
               <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-[#012A3F] px-3 py-1 rounded-full">
                    <span className="text-sm font-medium">{inputToken}</span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaxClick}
                      disabled={["cancelDeposit", "claimDeposit", "claimWithdraw"].includes(currentActionState)}
                      className="rounded-md bg-[#013853] hover:bg-[#024d74] text-[#4BB6EE] px-3 py-1 h-9 text-sm"
                    >
                      Max
                    </Button>
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {isAmountTooLarge && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-400 text-xs mt-2 flex items-center gap-1.5 bg-red-500/10 p-2 rounded-md"
                  >
                    <svg className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Insufficient balance
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Status Cards */}
            {currentActionState === "cancelDeposit" && vaultData.pendingDeposit > 0 && (
              <div className="mx-5 mb-5 bg-[#00131b] border border-[#f59e0b]/20 rounded-lg p-4">
                <h4 className="text-[#f59e0b] text-sm font-medium mb-1 flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Deposit
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Amount:</span>
                  <span className="font-medium text-white">{formatBalance(vaultData.pendingDeposit)} USDC</span>
                </div>
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your deposit request is being processed
                </p>
              </div>
            )}

            {currentActionState === "claimDeposit" && vaultData.claimableDeposit > 0 && (
              <div className="mx-5 mb-5 bg-[#00131b] border border-[#10b981]/20 rounded-lg p-4">
                <h4 className="text-[#10b981] text-sm font-medium mb-1 flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Deposit Ready to Claim
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Amount:</span>
                  <span className="font-medium text-white">{formatBalance(vaultData.claimableDeposit)} ZrUSD</span>
                </div>
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your deposit is ready to be claimed
                </p>
              </div>
            )}

            {currentActionState === "claimWithdraw" && vaultData.claimableRedeem > 0 && (
              <div className="mx-5 mb-5 bg-[#00131b] border border-[#10b981]/20 rounded-lg p-4">
                <h4 className="text-[#10b981] text-sm font-medium mb-1 flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Withdrawal Ready to Claim
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Amount:</span>
                  <span className="font-medium text-white">{formatBalance(vaultData.claimableRedeem)} USDC</span>
                </div>
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your withdrawal is ready to be claimed
                </p>
              </div>
            )}

            {/* Action button */}
            <div className="px-5 pb-5">
              <Button
                className={`w-full py-3 ${getButtonStyle()} rounded-md transition-colors text-white font-medium shadow-sm text-sm`}
                onClick={handleActionClick}
                disabled={isButtonDisabled()}
              >
                {getButtonText()}
              </Button>
            </div>

            {/* Summary Section */}
            {!isWithdraw && currentActionState === "requestDeposit" && (
              <div className="border-t border-[#022e45]/40 p-5">
                <h4 className="text-[#4BB6EE] font-medium text-sm mb-3">Summary</h4>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/70 text-sm">You will receive</span>
                  <span className="text-[#9d5bfe] font-medium text-sm">{expectedZTokens.toFixed(2)} Tokens</span>
                </div>

                {/* Warning Message */}
                <div className="bg-[#021A27] p-3 rounded-md text-xs text-white/70 flex items-start space-x-2 border border-[#022e45]/40">
                  <svg className="h-3.5 w-3.5 text-[#4BB6EE] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    By investing, you agree to the pool&apos;s terms and conditions.
                    Investment rewards are subject to pool performance.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pool Selector Modal */}
        {isPoolSelectorOpen && (
          <TokenSelector
            onSelect={handlePoolSelect}
            onClose={() => setIsPoolSelectorOpen(false)}
            items={allPools}
            type="pool"
            title="Pool List"
          />
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={!!error}
          onClose={handleErrorClose}
          title={error?.title || "Error"}
          message={error?.message || "An error occurred"}
        />

        {/* Success Modal */}
        <SuccessModal
          isOpen={success != null}
          onClose={handleSuccessClose}
          title={success?.title || "Success"}
          message={success?.message || "Transaction successful"}
          txHash={success?.txHash || ""}
          chainId={chainId}
        />
      </div>
    </div>
  );
}