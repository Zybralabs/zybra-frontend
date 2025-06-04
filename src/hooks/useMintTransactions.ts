import { useCallback, useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { useSendUserOperation, useSmartAccountClient } from "@account-kit/react";
import { ethers } from "ethers";
import { useUserAccount } from "@/context/UserAccountContext";
import { WalletType } from "@/constant/account/enum";
import { SupportedChainId, TOKEN_FAUCET_ADDRESS } from "@/constant/addresses";
import { accountType, accountClientOptions as opts } from "@/config";
import TokenFaucetABI from "@/abis/TokenFaucetABI.json";
import type { TransactionData } from "@/types";
import { toWei } from "./formatting";

export interface MintableToken {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  contractAddress: string;
  tokenIndex: number;
  cooldownPeriod: string;
  description: string;
}

interface TransactionState {
  loading: boolean;
  error: Error | null;
  receipt: string | null;
}

export function useMintTransactions() {
  const { walletType, address, addTransaction } = useUserAccount();
  const chainId = useChainId();

  const [transactionState, setTransactionState] = useState<TransactionState>({
    loading: false,
    error: null,
    receipt: null,
  });

  // Web3 wallet hooks
  const { writeContractAsync } = useWriteContract();

  // Account Kit hooks with enhanced configuration
  const { client } = useSmartAccountClient({
    type: accountType,
    opts: {
      ...opts,
      // Ensure proper configuration for MultiTokenFaucet
      txMaxRetries: 20,
      txRetryIntervalMs: 2000,
    },
  });

  const {
    sendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    error: sendUserOperationError,
  } = useSendUserOperation({
    client: client,
    waitForTxn: true,
  });

  // Get the single token faucet contract address
  const getContractAddress = useCallback((): string => {
    return TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId] || "";
  }, [chainId]);

  // Validate Account Kit setup for debugging
  const validateAccountKitSetup = useCallback(() => {
    if (walletType === WalletType.MINIMAL) {
      const issues: string[] = [];

      if (!client) {
        issues.push("Smart account client is not available");
      } else {
        if (!client.account) {
          issues.push("Smart account is not connected");
        } else {
          console.log("Account Kit Setup Valid:", {
            clientType: client.account.type,
            accountAddress: client.account.address,
            chainId: client.chain?.id,
            chainName: client.chain?.name,
          });
        }
      }

      if (!sendUserOperationAsync) {
        issues.push("sendUserOperationAsync function is not available");
      }

      if (issues.length > 0) {
        console.warn("Account Kit Setup Issues:", issues);
        return { valid: false, issues };
      }
    }

    return { valid: true, issues: [] };
  }, [walletType, client, sendUserOperationAsync]);

  // Core transaction handler following SwarmVault pattern
  const handleMintTransaction = useCallback(
    async (token: MintableToken) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      setTransactionState({ loading: true, error: null, receipt: null });

      const contractAddress = getContractAddress();

      // Prepare transaction data for backend
      const transactionData: TransactionData = {
        type: "stock", // Backend expects 'stock' for token minting
        amount: Number(toWei(100)),
        status: "mint-zrusd", // TransactionStatus.MINT_ZRUSD
        metadata: {
          assetType: "Asset",
          assetSymbol: token.symbol,
          assetAddress: contractAddress,
          tokenId: token.id,
          tokenIndex: token.tokenIndex,
          action: "claim_tokens",
          cooldownPeriod: token.cooldownPeriod,
        },
      };

      try {
        let txHash: string | undefined;

        // WEB3 WALLET TRANSACTION FLOW
        if (walletType === WalletType.WEB3) {
          // Validate contract address
          if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("Invalid contract address. TOKEN_FAUCET_ADDRESS not configured for this network.");
          }

          console.log("Executing Web3 transaction:", {
            address: contractAddress,
            functionName: "claimTokens",
            args: [token.tokenIndex],
          });

          const tx = await writeContractAsync({
            address: contractAddress as `0x${string}`,
            abi: TokenFaucetABI,
            functionName: "claimTokens",
            args: [token.tokenIndex],
          });

          txHash = tx;
          console.log("Web3 transaction hash:", txHash);
        }
        // MINIMAL WALLET (ACCOUNT ABSTRACTION) TRANSACTION FLOW
        else if (walletType === WalletType.MINIMAL) {
          // Validate Account Kit setup first
          const setupValidation = validateAccountKitSetup();
          if (!setupValidation.valid) {
            throw new Error(`Account Kit setup issues: ${setupValidation.issues.join(', ')}`);
          }

          if (!client) {
            throw new Error("Smart account client not available. Please ensure Account Kit is properly initialized.");
          }

          // Validate contract address before proceeding
          if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("Invalid contract address. TOKEN_FAUCET_ADDRESS not configured for this network.");
          }

          // Check if client has an account
          if (!client.account) {
            throw new Error("Smart account not available. Please reconnect your Account Kit wallet.");
          }

          console.log("Account Kit transaction details:", {
            smartAccountAddress: client.account.address,
            contractAddress,
            tokenIndex: token.tokenIndex,
            functionName: "claimTokens",
          });

          try {
            // Encode function data for user operation
            const iface = new ethers.Interface(TokenFaucetABI);
            const data = iface.encodeFunctionData("claimTokens", [
              token.tokenIndex,
            ]) as `0x${string}`;

            console.log("Sending user operation with encoded data:", {
              target: contractAddress,
              data,
              value: "0",
              tokenIndex: token.tokenIndex,
            });

            // Send user operation with proper error handling
            const userOpResult = await sendUserOperationAsync({
              uo: {
                target: contractAddress as `0x${string}`,
                data,
                value: 0n,
              },
            });

            console.log("User operation sent successfully:", userOpResult);

            // Enhanced transaction hash extraction
            let extractedTxHash: string | undefined;

            // Method 1: Direct hash from result
            if (userOpResult?.hash) {
              extractedTxHash = userOpResult.hash;
              console.log("Transaction hash from userOpResult:", extractedTxHash);
            }
            // Method 2: Hash from sendUserOperationResult state
            else if (sendUserOperationResult?.hash) {
              extractedTxHash = sendUserOperationResult.hash;
              console.log("Transaction hash from sendUserOperationResult:", extractedTxHash);
            }
            // Method 3: Check if result has txHash property
            else if (userOpResult && 'txHash' in userOpResult && userOpResult.txHash) {
              extractedTxHash = userOpResult.txHash as string;
              console.log("Transaction hash from txHash property:", extractedTxHash);
            }
            // Method 4: Check if result has transactionHash property
            else if (userOpResult && 'transactionHash' in userOpResult && userOpResult.transactionHash) {
              extractedTxHash = userOpResult.transactionHash as string;
              console.log("Transaction hash from transactionHash property:", extractedTxHash);
            }

            if (extractedTxHash) {
              txHash = extractedTxHash;
              console.log("Final Account Kit transaction hash:", txHash);
            } else {
              console.warn("No transaction hash found in user operation result:", userOpResult);
              throw new Error("Transaction was sent but no transaction hash was returned. The transaction may still be processing.");
            }
          } catch (accountKitError) {
            console.error("Account Kit transaction failed:", accountKitError);

            // Enhanced error handling for Account Kit specific errors
            if (accountKitError instanceof Error) {
              const errorMessage = accountKitError.message.toLowerCase();

              // Contract-specific errors (from MultiTokenFaucet)
              if (errorMessage.includes("cooldownnotelapsed") || errorMessage.includes("cooldown")) {
                throw new Error("CooldownNotElapsed: You are still in the 24-hour cooldown period.");
              } else if (errorMessage.includes("insufficientfaucetbalance")) {
                throw new Error("InsufficientFaucetBalance: The faucet doesn't have enough tokens.");
              } else if (errorMessage.includes("invalidtokenindex")) {
                throw new Error("InvalidTokenIndex: Invalid token selected.");
              } else if (errorMessage.includes("transferfailed")) {
                throw new Error("TransferFailed: Token transfer failed.");
              }

              // Account Kit specific errors
              else if (errorMessage.includes("insufficient funds") ||
                       errorMessage.includes("sender balance and deposit together is 0") ||
                       errorMessage.includes("insufficient balance") ||
                       errorMessage.includes("not enough funds")) {
                const smartAccountAddress = client?.account?.address || address;
                throw new Error(`Your Account Kit smart wallet needs ETH for gas fees. Send Base Sepolia ETH to: ${smartAccountAddress || 'your smart wallet address'} or switch to a Web3 wallet.`);
              } else if (errorMessage.includes("user rejected") ||
                         errorMessage.includes("user denied") ||
                         errorMessage.includes("user cancelled")) {
                throw new Error("user rejected: Transaction was rejected by user.");
              } else if (errorMessage.includes("missing or invalid parameters") ||
                         errorMessage.includes("invalid parameters")) {
                throw new Error("Account Kit transaction failed due to invalid parameters. Please try again or switch to a Web3 wallet.");
              } else if (errorMessage.includes("execution reverted")) {
                // Check if it's a contract revert with specific reason
                if (errorMessage.includes("cooldown")) {
                  throw new Error("execution reverted: You are still in the 24-hour cooldown period.");
                } else {
                  throw new Error("execution reverted: Transaction was rejected by the smart contract.");
                }
              } else if (errorMessage.includes("network error") ||
                         errorMessage.includes("connection failed")) {
                throw new Error("Network error occurred. Please check your connection and try again.");
              } else if (errorMessage.includes("gas estimation failed")) {
                throw new Error("Gas estimation failed. Your Account Kit wallet may need more ETH for gas fees.");
              } else if (errorMessage.includes("nonce too low") ||
                         errorMessage.includes("nonce too high")) {
                throw new Error("Transaction nonce error. Please try again in a moment.");
              } else if (errorMessage.includes("replacement transaction underpriced")) {
                throw new Error("Transaction replacement failed. Please wait and try again.");
              }
            }

            // Fallback error message
            const fallbackMessage = accountKitError instanceof Error
              ? accountKitError.message
              : 'Unknown Account Kit error occurred';
            throw new Error(`Account Kit transaction failed: ${fallbackMessage}`);
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

        throw new Error("Mint transaction failed to execute");
      } catch (err) {
        console.error("Error in mint transaction:", err);

        // Enhanced error handling for Web3 wallet errors
        if (err instanceof Error) {
          // Check for specific contract errors
          if (err.message.includes("CooldownNotElapsed")) {
            err.message = "CooldownNotElapsed: You are still in the 24-hour cooldown period.";
          } else if (err.message.includes("InsufficientFaucetBalance")) {
            err.message = "InsufficientFaucetBalance: The faucet doesn't have enough tokens.";
          } else if (err.message.includes("InvalidTokenIndex")) {
            err.message = "InvalidTokenIndex: Invalid token selected.";
          } else if (err.message.includes("TransferFailed")) {
            err.message = "TransferFailed: Token transfer failed.";
          } else if (err.message.includes("execution reverted")) {
            err.message = "execution reverted: Transaction was rejected by the smart contract.";
          } else if (err.message.includes("user rejected")) {
            err.message = "user rejected: Transaction was rejected by user.";
          }
        }

        setTransactionState({
          loading: false,
          error: err as Error,
          receipt: null,
        });
        throw err;
      }
    },
    [
      walletType,
      address,
      writeContractAsync,
      sendUserOperationAsync,
      sendUserOperationResult,
      addTransaction,
      client,
      getContractAddress,
      validateAccountKitSetup,
    ]
  );

  // Check if user can claim tokens from contract (authoritative source)
  const canClaimToken = useCallback(
    async (token: MintableToken): Promise<boolean> => {
      if (!address || !chainId) {
        return false;
      }

      try {
        const contractAddress = getContractAddress();
        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
          console.warn("Invalid contract address for cooldown check");
          return false;
        }

        // Use the contract's canClaim function as the authoritative source
        const canClaim = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: TokenFaucetABI,
          functionName: "canClaim",
          args: [address as `0x${string}`, token.tokenIndex],
        });

        return Boolean(canClaim);
      } catch (error) {
        console.error(`Error checking claim status for ${token.symbol}:`, error);
        return false; // Fail safe - don't allow claiming if we can't verify
      }
    },
    [address, chainId, getContractAddress]
  );

  // Get remaining cooldown time from contract
  const getRemainingCooldown = useCallback(
    async (token: MintableToken): Promise<number> => {
      if (!address || !chainId) {
        return 0;
      }

      try {
        const contractAddress = getContractAddress();
        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
          return 0;
        }

        // Get time until next claim from contract
        const timeUntilNextClaim = await readContract(wagmiConfig, {
          address: contractAddress as `0x${string}`,
          abi: TokenFaucetABI,
          functionName: "timeUntilNextClaim",
          args: [address as `0x${string}`, token.tokenIndex],
        });

        return Number(timeUntilNextClaim) * 1000; // Convert seconds to milliseconds
      } catch (error) {
        console.error(`Error getting cooldown time for ${token.symbol}:`, error);
        return 0;
      }
    },
    [address, chainId, getContractAddress]
  );

  // Synchronous fallback for immediate UI updates (uses cached localStorage)
  const canClaimTokenSync = useCallback(
    (token: MintableToken): boolean => {
      // This is a fallback for immediate UI updates
      // The actual claim will still be validated by the contract
      const lastClaimKey = `lastClaim_${token.symbol}_${address}`;
      const lastClaimTime = localStorage.getItem(lastClaimKey);

      if (!lastClaimTime) {
        return true; // First time claiming
      }

      const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastClaim = Date.now() - parseInt(lastClaimTime);

      return timeSinceLastClaim >= cooldownMs;
    },
    [address]
  );

  // Synchronous fallback for immediate UI updates (uses cached localStorage)
  const getRemainingCooldownSync = useCallback(
    (token: MintableToken): number => {
      const lastClaimKey = `lastClaim_${token.symbol}_${address}`;
      const lastClaimTime = localStorage.getItem(lastClaimKey);

      if (!lastClaimTime) {
        return 0; // No cooldown
      }

      const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastClaim = Date.now() - parseInt(lastClaimTime);
      const remainingTime = cooldownMs - timeSinceLastClaim;

      return Math.max(0, remainingTime);
    },
    [address]
  );

  // Claim tokens with strict contract-based cooldown enforcement
  const claimTokens = useCallback(
    async (token: MintableToken) => {
      // First check with contract (authoritative)
      const canClaim = await canClaimToken(token);
      if (!canClaim) {
        const remainingTime = await getRemainingCooldown(token);
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

        const timeString = hours > 0
          ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        throw new Error(`cooldown: Cooldown active. Time remaining: ${timeString}`);
      }

      const result = await handleMintTransaction(token);

      if (result.success) {
        // Update localStorage as cache for immediate UI feedback
        const lastClaimKey = `lastClaim_${token.symbol}_${address}`;
        localStorage.setItem(lastClaimKey, Date.now().toString());
      }

      return result;
    },
    [handleMintTransaction, canClaimToken, getRemainingCooldown, address]
  );

  // Get available tokens for minting
  // Order must match the MultiTokenFaucet contract: token0=USDX, token1=ZrUSD, token2=ZFI
  const getAvailableTokens = useCallback((): MintableToken[] => {
    const faucetAddress = getContractAddress();
    return [
      {
        id: "usdx",
        name: "USDX",
        symbol: "USDX",
        amount: 100,
        contractAddress: faucetAddress,
        tokenIndex: 0, // token0 in contract
        cooldownPeriod: "24h",
        description: "Zybra stablecoin for trading and transactions",
      },
      {
        id: "zrusd",
        name: "Zybra USD",
        symbol: "ZrUSD",
        amount: 100,
        contractAddress: faucetAddress,
        tokenIndex: 1, // token1 in contract
        cooldownPeriod: "24h",
        description: "Zybra's native stablecoin for yield generation",
      },
      {
        id: "zfi",
        name: "Zybra Finance Token",
        symbol: "ZFI",
        amount: 100,
        contractAddress: faucetAddress,
        tokenIndex: 2, // token2 in contract
        cooldownPeriod: "24h",
        description: "Governance token for Zybra Finance protocol",
      },
    ];
  }, [getContractAddress]);

  // Check claim status for all tokens (async version)
  const getClaimStatus = useCallback(async () => {
    const tokens = getAvailableTokens();
    const statusPromises = tokens.map(async (token) => ({
      ...token,
      canClaim: await canClaimToken(token),
      remainingCooldown: await getRemainingCooldown(token),
    }));
    return Promise.all(statusPromises);
  }, [getAvailableTokens, canClaimToken, getRemainingCooldown]);

  // Synchronous version for immediate UI updates
  const getClaimStatusSync = useCallback(() => {
    const tokens = getAvailableTokens();
    return tokens.map(token => ({
      ...token,
      canClaim: canClaimTokenSync(token),
      remainingCooldown: getRemainingCooldownSync(token),
    }));
  }, [getAvailableTokens, canClaimTokenSync, getRemainingCooldownSync]);

  return {
    // Transaction operations
    claimTokens,

    // Token information
    getAvailableTokens,
    getClaimStatus,
    getClaimStatusSync,

    // Contract-based cooldown checks (async - authoritative)
    canClaimToken,
    getRemainingCooldown,

    // Sync fallbacks for immediate UI updates
    canClaimTokenSync,
    getRemainingCooldownSync,

    // Transaction state
    loading: transactionState.loading || isSendingUserOperation,
    error: transactionState.error || sendUserOperationError,
    receipt: transactionState.receipt,

    // Utility
    setError: (err: Error | null) =>
      setTransactionState(prev => ({ ...prev, error: err })),
  };
}
