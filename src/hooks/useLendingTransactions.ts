import { useCallback, useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import { ethers } from "ethers";
import { useUserAccount } from "@/context/UserAccountContext";
import { WalletType } from "@/constant/account/enum";
import { SupportedChainId, LENDING_POOL_ADDRESS } from "@/constant/addresses";
import LendingPoolABI from "@/abis/LendingPoolABI.json";
import ERC20ABI from "@/abis/ERC20.json";
import type { TransactionData } from "@/types";
import { TransactionStatus } from "@/constant/transactionStatus";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";

export interface LendingAsset {
  id: string;
  name: string;
  symbol: string;
  tokenAddress: `0x${string}`;
  decimals: number;
}

interface TransactionState {
  loading: boolean;
  error: Error | null;
  receipt: string | null;
}

export function useLendingTransactions() {
  const { walletType, address, addTransaction } = useUserAccount();
  const chainId = useChainId();

  const [transactionState, setTransactionState] = useState<TransactionState>({
    loading: false,
    error: null,
    receipt: null,
  });

  // Web3 wallet hooks
  const { writeContractAsync } = useWriteContract();

  // Use centralized smart account client with real gas sponsorship (safe version)
  const {
    client,
    isGasSponsored,
    isClientReady,
    executeTransaction,
    executeSponsoredTransaction,
    sendUserOperationResult,
    isSendingUserOperation,
    sendUserOperationError,
  } = useSmartAccountClientSafe();

  // Map lending actions to backend transaction statuses
  const getTransactionStatus = (action: string) => {
    switch (action) {
      case "supply":
        return TransactionStatus.SUPPLY; // TransactionStatus.DEPOSIT
      case "borrow":
        return TransactionStatus.BORROW; // TransactionStatus.WITHDRAW
      case "repay":
        return "repay-debt"; // TransactionStatus.REPAY_DEBT
    }
  };

  // Core transaction handler following SwarmVault pattern
  const handleLendingTransaction = useCallback(
    async (
      action: "supply" | "borrow" | "repay" | "withdraw",
      asset: LendingAsset,
      amount: string
    ) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      setTransactionState({ loading: true, error: null, receipt: null });

      const amountInWei = parseUnits(amount, asset.decimals);
      const lendingPoolAddress = LENDING_POOL_ADDRESS[chainId as SupportedChainId];

      // Prepare transaction data for backend
      const transactionData: TransactionData = {
        type: "zybra", // Backend expects 'pool' for lending transactions
        amount: Number(amountInWei),
        status: getTransactionStatus(action),
        metadata: {
          assetType: "Asset",
          assetSymbol: asset.symbol,
          assetAddress: asset.tokenAddress,
          poolAddress: lendingPoolAddress,
          action: action,
        },
      };

      try {
        let txHash: string | undefined;

        // WEB3 WALLET TRANSACTION FLOW
        if (walletType === WalletType.WEB3) {
          let functionName: string;
          let args: any[];

          switch (action) {
            case "supply":
              functionName = "deposit";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "borrow":
              functionName = "borrow";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "repay":
              functionName = "repay";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "withdraw":
              functionName = "withdraw";
              args = [asset.tokenAddress, amountInWei];
              break;
            default:
              throw new Error(`Unsupported action: ${action}`);
          }

          const tx = await writeContractAsync({
            address: lendingPoolAddress as `0x${string}`,
            abi: LendingPoolABI,
            functionName: functionName,
            args: args,
          });

          txHash = tx;
        }
        // MINIMAL WALLET (ACCOUNT ABSTRACTION) TRANSACTION FLOW
        else if (walletType === WalletType.MINIMAL) {
          // Wait for client to be ready with timeout
          let retryCount = 0;
          const maxRetries = 10; // 2 seconds total wait time
          const retryDelay = 200; // 200ms between retries

          while (!isClientReady && retryCount < maxRetries) {
            console.log(`Waiting for smart account client to be ready for ${action}... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
          }

          // Final check if client is ready
          if (!isClientReady) {
            throw new Error("Smart account client is not ready after waiting. Please ensure your wallet is connected and try again.");
          }

          if (!executeTransaction) {
            throw new Error("Execute transaction function is not available. Please try again.");
          }

          if (!client) {
            throw new Error("Smart account client not available");
          }

          console.log("Smart account client validation passed for lending transaction");

          let functionName: string;
          let args: any[];

          switch (action) {
            case "supply":
              functionName = "deposit";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "borrow":
              functionName = "borrow";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "repay":
              functionName = "repay";
              args = [asset.tokenAddress, amountInWei];
              break;
            case "withdraw":
              functionName = "withdraw";
              args = [asset.tokenAddress, amountInWei];
              break;
            default:
              throw new Error(`Unsupported action: ${action}`);
          }

          console.log("Executing Account Kit lending transaction:", {
            action,
            functionName,
            args,
            target: lendingPoolAddress,
          });

          // Validate contract address
          if (!lendingPoolAddress || lendingPoolAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("Invalid lending pool address. Contract not deployed on this network.");
          }

          try {
            // Create real transaction data for gas sponsorship
            const realTransactionData = {
              target: lendingPoolAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: LendingPoolABI,
                functionName,
                args,
              }),
              value: 0n,
              abi: LendingPoolABI,
              functionName,
              args,
            };

            // Execute with enhanced transaction system
            let userOp;
            if (isGasSponsored) {
              try {
                console.log("Attempting real gas sponsorship for lending...");
                userOp = await executeSponsoredTransaction(realTransactionData, {
                  waitForTxn: true
                });
              } catch (sponsorError) {
                console.warn("Real gas sponsorship failed, falling back to regular transaction:", sponsorError);
                userOp = await executeTransaction(realTransactionData, {
                  waitForTxn: true
                });
              }
            } else {
              userOp = await executeTransaction(realTransactionData, {
                waitForTxn: true
              });
            }

            console.log("Account Kit lending transaction result:", userOp);

            // Extract transaction hash from various possible result formats
            if (userOp) {
              if (typeof userOp === 'string') {
                txHash = userOp;
              } else if (userOp.hash) {
                txHash = userOp.hash;
              } else if (sendUserOperationResult?.hash) {
                txHash = sendUserOperationResult.hash;
              }
            }

            if (!txHash) {
              throw new Error("Transaction was submitted but no hash was returned");
            }

            console.log("Account Kit lending transaction hash:", txHash);
          } catch (accountKitError) {
            console.error("Account Kit lending transaction failed:", accountKitError);

            // Provide specific error messages for Account Kit issues
            if (accountKitError instanceof Error) {
              if (accountKitError.message.includes("insufficient funds") ||
                  accountKitError.message.includes("sender balance and deposit together is 0")) {
                const smartAccountAddress = client?.account?.address || address;
                throw new Error(`Your Account Kit smart wallet needs ETH for gas fees. Send Base Sepolia ETH to: ${smartAccountAddress || 'your smart wallet address'} or switch to a Web3 wallet.`);
              } else if (accountKitError.message.includes("user rejected")) {
                throw new Error(`${action} transaction was rejected by user.`);
              } else if (accountKitError.message.includes("Missing or invalid parameters")) {
                throw new Error(`Account Kit ${action} transaction failed. Please try again or switch to a Web3 wallet.`);
              } else if (accountKitError.message.includes("execution reverted")) {
                // Handle specific lending protocol errors
                if (action === "borrow" && accountKitError.message.includes("account is not healthy")) {
                  throw new Error("Your account doesn't have enough collateral for this borrow amount.");
                } else if (action === "withdraw" && accountKitError.message.includes("account is not healthy")) {
                  throw new Error("You can't withdraw this amount because it's being used as collateral for your borrows.");
                } else {
                  throw new Error(`${action} transaction was rejected by the smart contract. Please check your account status.`);
                }
              }
            }

            throw new Error(`Account Kit ${action} transaction failed: ${accountKitError instanceof Error ? accountKitError.message : 'Unknown error'}`);
          }
        }

        // If transaction was successful, process it
        if (txHash) {
          // Update transaction data with success info
          const updatedTransactionData = {
            ...transactionData,
            tx_hash: txHash,
          };

          await addTransaction(updatedTransactionData);

          // Update transaction state
          setTransactionState({
            loading: false,
            error: null,
            receipt: txHash,
          });

          return { success: true, txHash };
        }

        throw new Error("Transaction failed to execute");
      } catch (err) {
        console.error(`Error in ${action}:`, err);
        setTransactionState({
          loading: false,
          error: err as Error,
          receipt: null,
        });
        throw err;
      }
    },
    [
      chainId,
      walletType,
      address,
      writeContractAsync,
      executeTransaction,
      sendUserOperationResult,
      addTransaction,
      client,
      isClientReady,
      executeTransaction,
      executeSponsoredTransaction,
      isGasSponsored,
    ]
  );

  // Enhanced approval handler for ERC20 tokens
  const handleApproval = useCallback(
    async (asset: LendingAsset, amount: string) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      setTransactionState({ loading: true, error: null, receipt: null });

      // Use max uint256 for unlimited approval to avoid repeated approvals
      const maxApproval = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      const amountInWei = parseUnits(maxApproval, 0); // Max uint256
      const lendingPoolAddress = LENDING_POOL_ADDRESS[chainId as SupportedChainId];

      // Validate contract addresses
      if (!lendingPoolAddress || lendingPoolAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Invalid lending pool address. Contract not deployed on this network.");
      }

      try {
        let txHash: string | undefined;

        // WEB3 WALLET APPROVAL
        if (walletType === WalletType.WEB3) {
          console.log("Executing Web3 approval:", {
            tokenAddress: asset.tokenAddress,
            spender: lendingPoolAddress,
            amount: maxApproval,
          });

          const tx = await writeContractAsync({
            address: asset.tokenAddress,
            abi: ERC20ABI,
            functionName: "approve",
            args: [lendingPoolAddress, amountInWei],
          });

          txHash = tx;
          console.log("Web3 approval transaction hash:", txHash);
        }
        // MINIMAL WALLET APPROVAL
        else if (walletType === WalletType.MINIMAL) {
          // Wait for client to be ready with timeout
          let retryCount = 0;
          const maxRetries = 10; // 2 seconds total wait time
          const retryDelay = 200; // 200ms between retries

          while (!isClientReady && retryCount < maxRetries) {
            console.log(`Waiting for smart account client to be ready for approval... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
          }

          // Final check if client is ready
          if (!isClientReady) {
            throw new Error("Smart account client is not ready after waiting. Please ensure your wallet is connected and try again.");
          }

          if (!executeTransaction) {
            throw new Error("Execute transaction function is not available. Please try again.");
          }

          if (!client) {
            throw new Error("Smart account client not available");
          }

          console.log("Smart account client validation passed for approval transaction");

          console.log("Executing Account Kit approval:", {
            tokenAddress: asset.tokenAddress,
            spender: lendingPoolAddress,
            amount: maxApproval,
          });

          try {
            // Create real transaction data for gas sponsorship
            const realTransactionData = {
              target: asset.tokenAddress,
              data: encodeFunctionData({
                abi: ERC20ABI,
                functionName: "approve",
                args: [lendingPoolAddress, amountInWei],
              }),
              value: 0n,
              abi: ERC20ABI,
              functionName: "approve",
              args: [lendingPoolAddress, amountInWei],
            };

            // Execute with enhanced transaction system
            let userOp;
            if (isGasSponsored) {
              try {
                console.log("Attempting real gas sponsorship for approval...");
                userOp = await executeSponsoredTransaction(realTransactionData, {
                  waitForTxn: true
                });
              } catch (sponsorError) {
                console.warn("Real gas sponsorship failed for approval, falling back:", sponsorError);
                userOp = await executeTransaction(realTransactionData, {
                  waitForTxn: true
                });
              }
            } else {
              userOp = await executeTransaction(realTransactionData, {
                waitForTxn: true
              });
            }

            console.log("Account Kit approval transaction result:", userOp);

            // Extract transaction hash from various possible result formats
            if (userOp) {
              if (typeof userOp === 'string') {
                txHash = userOp;
              } else if (userOp.hash) {
                txHash = userOp.hash;
              } else if (sendUserOperationResult?.hash) {
                txHash = sendUserOperationResult.hash;
              }
            }

            if (!txHash) {
              throw new Error("Transaction was submitted but no hash was returned");
            }

            console.log("Account Kit approval transaction hash:", txHash);
          } catch (accountKitError) {
            console.error("Account Kit approval failed:", accountKitError);

            // Provide specific error messages for Account Kit issues
            if (accountKitError instanceof Error) {
              if (accountKitError.message.includes("insufficient funds") ||
                  accountKitError.message.includes("sender balance and deposit together is 0")) {
                const smartAccountAddress = client?.account?.address || address;
                throw new Error(`Your Account Kit smart wallet needs ETH for gas fees. Send Base Sepolia ETH to: ${smartAccountAddress || 'your smart wallet address'} or switch to a Web3 wallet.`);
              } else if (accountKitError.message.includes("user rejected")) {
                throw new Error("Approval was rejected by user.");
              } else if (accountKitError.message.includes("Missing or invalid parameters")) {
                throw new Error("Account Kit approval failed. Please try again or switch to a Web3 wallet.");
              }
            }

            throw new Error(`Account Kit approval failed: ${accountKitError instanceof Error ? accountKitError.message : 'Unknown error'}`);
          }
        }

        if (txHash) {
          // Save approval transaction to database
          await addTransaction({
            type: "pool",
            amount: parseFloat(amount),
            status: "approval", // TransactionStatus.APPROVAL
            tx_hash: txHash,
            metadata: {
              assetType: "Asset",
              assetSymbol: asset.symbol,
              assetAddress: asset.tokenAddress,
              spender: lendingPoolAddress,
              action: "approve",
            },
          });

          // Update transaction state
          setTransactionState({
            loading: false,
            error: null,
            receipt: txHash,
          });

          return { success: true, txHash };
        }

        throw new Error("Approval failed to execute");
      } catch (err) {
        console.error("Error in approval:", err);
        setTransactionState({
          loading: false,
          error: err as Error,
          receipt: null,
        });
        throw err;
      }
    },
    [
      chainId,
      walletType,
      address,
      writeContractAsync,
      executeTransaction,
      sendUserOperationResult,
      addTransaction,
      client,
      isClientReady,
      executeTransaction,
      executeSponsoredTransaction,
      isGasSponsored,
    ]
  );

  // Specific lending operations
  const supply = useCallback(
    (asset: LendingAsset, amount: string) =>
      handleLendingTransaction("supply", asset, amount),
    [handleLendingTransaction]
  );

  const borrow = useCallback(
    (asset: LendingAsset, amount: string) =>
      handleLendingTransaction("borrow", asset, amount),
    [handleLendingTransaction]
  );

  const repay = useCallback(
    (asset: LendingAsset, amount: string) =>
      handleLendingTransaction("repay", asset, amount),
    [handleLendingTransaction]
  );

  const withdraw = useCallback(
    (asset: LendingAsset, amount: string) =>
      handleLendingTransaction("withdraw", asset, amount),
    [handleLendingTransaction]
  );

  return {
    // Transaction operations
    supply,
    borrow,
    repay,
    withdraw,
    approve: handleApproval,

    // Transaction state
    loading: transactionState.loading || isSendingUserOperation,
    error: transactionState.error || sendUserOperationError,
    receipt: transactionState.receipt,

    // Utility
    setError: (err: Error | null) =>
      setTransactionState(prev => ({ ...prev, error: err })),
  };
}
