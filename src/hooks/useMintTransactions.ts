import { useCallback, useState } from "react";
import { useChainId, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { ethers } from "ethers";
import { useUserAccount } from "@/context/UserAccountContext";
import { WalletType } from "@/constant/account/enum";
import { SupportedChainId, TOKEN_FAUCET_ADDRESS } from "@/constant/addresses";
import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";
import TokenFaucetABI from "@/abis/TokenFaucetABI.json";
import type { TransactionData } from "@/types";
import { toWei } from "./formatting";
import { handleTransactionError } from "@/utils/gaslessErrorHandler";

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

  // Use centralized smart account client with real gas sponsorship
  const {
    client,
    isGasSponsored,
    isClientReady,
    sendUserOperationAsync,
    sendUserOperationResult,
    isSendingUserOperation,
    sendUserOperationError,
    executeTransaction,
    executeSponsoredTransaction,
    canSponsorTransaction,
  } = useSmartAccountClientSafe();

  // Get the single token faucet contract address
  const getContractAddress = useCallback((): string => {
    return TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId] || "";
  }, [chainId]);

  // Validate Account Kit setup for debugging
  const validateAccountKitSetup = useCallback(() => {
    if (walletType === WalletType.MINIMAL) {
      const issues: string[] = [];

      if (!isClientReady) {
        issues.push("Smart account client is not ready - wallet may not be connected");
      }

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
            isClientReady,
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
  }, [walletType, client, sendUserOperationAsync, isClientReady]);

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
        type: "zybra", // Backend expects 'stock' for token minting
        amount: Number(toWei(100)),
        status: `mint-${token.symbol.toLowerCase()}`, // TransactionStatus.MINT_ZRUSD
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
          // Check if client is ready first
          if (!isClientReady) {
            throw new Error("Smart account client is not ready. Please ensure your wallet is connected and try again.");
          }

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
            isGasSponsored,
            gasSponsorshipInfo: isGasSponsored ? "✅ Gas fees sponsored by Alchemy Gas Manager" : "❌ User pays gas fees",
          });

          try {
            // Encode function data for user operation
            const iface = new ethers.Interface(TokenFaucetABI);
            const data = iface.encodeFunctionData("claimTokens", [
              token.tokenIndex,
            ]) as `0x${string}`;

            console.log("Sending user operation with enhanced gas sponsorship:", {
              target: contractAddress,
              data,
              value: "0",
              tokenIndex: token.tokenIndex,
              smartAccountAddress: client.account.address,
              isGasSponsored,
            });

            // Create real transaction data for gas sponsorship
            const realTransactionData = {
              target: contractAddress as `0x${string}`,
              data,
              value: 0n,
              abi: TokenFaucetABI,
              functionName: "claimTokens",
              args: [token.tokenIndex],
            };

            // Execute with real gas sponsorship
            let userOpResult;
            if (isGasSponsored && walletType === WalletType.MINIMAL) {
              try {
                console.log("Attempting real gas sponsorship for mint...");
                userOpResult = await executeSponsoredTransaction(realTransactionData, {
                  waitForTxn: true,
                });
              } catch (sponsorError) {
                console.warn("Real gas sponsorship failed, falling back to regular transaction:", sponsorError);
                // Fallback to regular transaction
                userOpResult = await executeTransaction(realTransactionData);
              }
            } else {
              // Use regular transaction for non-gasless users
              userOpResult = await executeTransaction(realTransactionData);
            }

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
              // This is a legitimate case where we need to inform the user about the missing hash
              throw new Error("Transaction was sent but no transaction hash was returned. The transaction may still be processing.");
            }
          } catch (accountKitError) {
            console.error("Account Kit transaction failed:", accountKitError);

            // Enhanced error handling for Account Kit specific errors
            if (accountKitError instanceof Error) {
              const errorMessage = accountKitError.message.toLowerCase();

              // Contract-specific errors (from MultiTokenFaucet) - preserve original error
              if (errorMessage.includes("cooldownnotelapsed") || errorMessage.includes("cooldown")) {
                throw accountKitError; // Preserve original error message
              } else if (errorMessage.includes("insufficientfaucetbalance")) {
                throw accountKitError; // Preserve original error message
              } else if (errorMessage.includes("invalidtokenindex")) {
                throw accountKitError; // Preserve original error message
              } else if (errorMessage.includes("transferfailed")) {
                throw accountKitError; // Preserve original error message
              }

              // Check for gas-related errors first
              else if (errorMessage.includes("insufficient funds") ||
                       errorMessage.includes("sender balance and deposit together is 0") ||
                       errorMessage.includes("insufficient balance") ||
                       errorMessage.includes("not enough funds")) {
                // Use enhanced error handling for gasless transactions
                const errorHandlerResult = handleTransactionError({
                  walletType,
                  isGasSponsored,
                  smartAccountAddress: client?.account?.address || address,
                  originalError: accountKitError
                });

                // For gasless users with sponsorship, handle appropriately
                if (errorHandlerResult.shouldShowFundingHelper) {
                  throw new Error("funding_helper: Your Account Kit wallet needs ETH for gas fees. Please add funds to continue.");
                } else if (errorHandlerResult.shouldShowErrorModal) {
                  throw new Error(errorHandlerResult.errorMessage);
                } else {
                  // For gasless users with active sponsorship, this is likely a temporary gas sponsorship issue
                  // Don't throw an error that would show a modal - just log and continue
                  console.log("Gas sponsorship detected for gasless user, transaction may have failed due to temporary sponsorship issues");

                  // Check if user actually has gas sponsorship active
                  const isAbstractWalletUser = walletType === WalletType.MINIMAL;
                  if (isAbstractWalletUser && isGasSponsored) {
                    // For gasless users with active sponsorship, this shouldn't be a blocking error
                    console.log("User has active gas sponsorship, this may be a temporary network issue");
                    throw new Error("network_retry: Transaction failed due to network issues. Gas sponsorship is active. Please try again.");
                  } else {
                    // Fallback for other cases
                    throw new Error("gas_sponsored_retry: Transaction temporarily failed due to gas sponsorship issues. Please try again.");
                  }
                }
              } else if (errorMessage.includes("user rejected") ||
                         errorMessage.includes("user denied") ||
                         errorMessage.includes("user cancelled")) {
                throw accountKitError; // Preserve original user rejection message
              } else if (errorMessage.includes("missing or invalid parameters") ||
                         errorMessage.includes("invalid parameters")) {
                throw accountKitError; // Preserve original parameter error
              } else if (errorMessage.includes("execution reverted")) {
                // For execution reverted errors, preserve the original message which contains the revert reason
                throw accountKitError; // Preserve original revert message with reason
              } else if (errorMessage.includes("network error") ||
                         errorMessage.includes("connection failed")) {
                throw accountKitError; // Preserve original network error
              } else if (errorMessage.includes("gas estimation failed")) {
                throw accountKitError; // Preserve original gas estimation error
              } else if (errorMessage.includes("nonce too low") ||
                         errorMessage.includes("nonce too high")) {
                throw accountKitError; // Preserve original nonce error
              } else if (errorMessage.includes("replacement transaction underpriced")) {
                throw accountKitError; // Preserve original replacement error
              }
            }

            // Fallback - preserve the original error
            throw accountKitError;
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
        // Don't modify error messages - preserve original blockchain/contract errors
        if (err instanceof Error) {
          console.log("Preserving original error message:", err.message);
          // Keep the original error message intact - it contains valuable information from the blockchain
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
      executeTransaction,
      executeSponsoredTransaction,
      sendUserOperationResult,
      addTransaction,
      client,
      getContractAddress,
      validateAccountKitSetup,
      isGasSponsored,
      isClientReady,
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
      // Early validation for Account Kit wallets with retry mechanism
      if (walletType === WalletType.MINIMAL) {
        // Wait for client to be ready with timeout
        let retryCount = 0;
        const maxRetries = 10; // 2 seconds total wait time
        const retryDelay = 200; // 200ms between retries

        while (!isClientReady && retryCount < maxRetries) {
          console.log(`Waiting for smart account client to be ready... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryCount++;
        }

        // Final check if client is ready
        if (!isClientReady) {
          throw new Error("Smart account client is not ready after waiting. Please ensure your wallet is connected and try again.");
        }

        // Validate Account Kit setup
        const setupValidation = validateAccountKitSetup();
        if (!setupValidation.valid) {
          throw new Error(`Account Kit setup issues: ${setupValidation.issues.join(', ')}`);
        }

        // Additional client validation
        if (!client) {
          throw new Error("Smart account client not available. Please ensure Account Kit is properly initialized.");
        }

        if (!sendUserOperationAsync) {
          throw new Error("Send user operation function not available. Please try again.");
        }

        console.log("Smart account client validation passed, proceeding with transaction");
      }

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
    [handleMintTransaction, canClaimToken, getRemainingCooldown, address, walletType, isClientReady, validateAccountKitSetup, client, sendUserOperationAsync]
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
