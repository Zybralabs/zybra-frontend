"use client";

import { useState, useEffect, type FC, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserAccount } from "@/context/UserAccountContext";
import { useChainId } from "wagmi";
import { SupportedChainId, TOKEN_FAUCET_ADDRESS } from "@/constant/addresses";
import { useRouter } from "next/navigation";
import { readContract } from '@wagmi/core';
import { ErrorModal, SuccessModal } from "@/components/Modal";
import { SOCIAL_LINKS } from "@/constant/social";
import { Button } from "@/components/ui/button";
import TokenFaucetABI from "@/abis/TokenFaucetABI.json"; // Create this ABI file based on the contract code
import { wagmiConfig } from "@/wagmi";
import FaucetButtons from "@/components/FaucetButtons";
import { useMintTransactions, type MintableToken } from "@/hooks/useMintTransactions";
import FundingHelper from "@/components/AccountKit/FundingHelper";

// Define TypeScript interfaces
interface TokenInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  amount: number;
  cooldown: number; // hours
  symbol?: string;
  decimals?: number;
}

interface ClaimHistory {
  [tokenId: string]: number; // timestamp of last claim
}

// Token data with enhanced information
const tokens: TokenInfo[] = [
  {
    id: "usdx",
    name: "USDX",
    description: "Zybra stablecoin for trading, borrowing and everyday transactions",
    icon: "UX",
    iconBg: "bg-green-600",
    amount: 100,
    cooldown: 24,
    symbol: "USDX",
    decimals: 18,
  },


  {
    id: "zrusd",
    name: "ZrUSD",
    description: "ZrUSD for yield generation and liquidity provision",
    icon: "ZR",
    iconBg: "bg-purple-600",
    amount: 100,
    cooldown: 24,
    symbol: "ZrUSD",
    decimals: 18,
  },
  {
    id: "zfi",
    name: "ZFI",
    description: "Zybra Finance native governance token with staking rewards",
    icon: "ZF",
    iconBg: "bg-blue-600",
    amount: 100,
    cooldown: 24,
    symbol: "ZFI",
    decimals: 18,
  },
];

// Component for individual token card
const TokenCard: FC<{
  token: TokenInfo;
  isOnCooldown: (tokenId: string) => boolean;
  getCooldownRemaining: (tokenId: string) => string | null;
  handleClaimToken: (tokenId: string) => Promise<void>;
  claimingToken: string | null;
  loadingTokens: Record<string, boolean>;
  index: number;
}> = ({
  token,
  isOnCooldown,
  getCooldownRemaining,
  handleClaimToken,
  // claimingToken is used in the component
  loadingTokens,
  index
}) => {
    return (
      <motion.div
        key={token.id}
        className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)] hover:shadow-[0_0_35px_rgba(0,100,160,0.25)] transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${token.iconBg} flex items-center justify-center text-xs font-bold shadow-lg`}>
              {token.icon}
            </div>
            <span className="font-semibold text-md">{token.name}</span>
          </div>
          <div className="text-sm px-2.5 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="font-medium text-xs">Testnet</span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-gray-400 text-sm mb-4 h-12 line-clamp-2">
            {token.description}
          </p>

          <div className="bg-gradient-to-r from-[#00233A] to-[#001E30] rounded-lg p-3.5 border border-[#003354]/60 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 z-0"></div>
            <div className="relative ">
              <div className="text-gray-400 text-xs mb-1">Amount</div>
              <div className="text-xl font-medium flex items-center gap-1.5">
                {token.amount.toLocaleString()} <span className="text-blue-300">{token.name}</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isOnCooldown(token.id) ? (
              <motion.div
                key={`cooldown-${token.id}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#001A26] rounded-lg p-3.5 border border-[#003354]/60 mb-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-gray-400 text-xs">Cooldown</div>
                </div>
                <div className="text-sm font-medium text-orange-400 font-mono">{getCooldownRemaining(token.id)}</div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className={`w-full py-3.5 font-medium text-white rounded-lg ${isOnCooldown(token.id)
                ? "bg-gray-700/50 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-[#4BB6EE] to-[#65C7F7] hover:from-[#5BC0F5] hover:to-[#75D1FF] shadow-[0_0_15px_rgba(75,182,238,0.3)]"
                }`}
              onClick={() => handleClaimToken(token.id)}
              disabled={isOnCooldown(token.id) || loadingTokens[token.id]}
            >
              {isOnCooldown(token.id)
                ? "On Cooldown"
                : loadingTokens[token.id]
                  ? "Claiming..."
                  : "Claim Tokens"
              }
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  };

const TokenFaucet: FC = () => {
  const [claimingToken, setClaimingToken] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory>({});
  const [loadingTokens, setLoadingTokens] = useState<Record<string, boolean>>({});
  const { address: userAddress } = useUserAccount();
  const chainId = useChainId();
  const router = useRouter();

  // Use the new mint transactions hook
  const {
    claimTokens,
    getAvailableTokens,
    getClaimStatus,
    canClaimToken: hookCanClaimToken,
    getRemainingCooldown: hookGetRemainingCooldown,
    loading: mintLoading,
    error: mintError,
    receipt,
    setError: setMintError,
  } = useMintTransactions();

  // We'll load claim history in the main useEffect below
  // This separate useEffect is removed to prevent duplicate loading

  // Save claim history to localStorage
  const updateClaimHistory = (tokenId: string): void => {
    const updatedHistory = {
      ...claimHistory,
      [tokenId]: Date.now()
    };

    setClaimHistory(updatedHistory);

    if (typeof window !== 'undefined' && userAddress) {
      localStorage.setItem(
        `claim_history_${userAddress}`,
        JSON.stringify(updatedHistory)
      );
    }
  };

  // Create a cache for token lookups to avoid repeated find() calls
  const tokenCache = useMemo(() => {
    const cache: Record<string, TokenInfo> = {};
    tokens.forEach(token => {
      cache[token.id] = token;
    });
    return cache;
  }, []);

  // Enhanced cooldown check with multiple validation layers
  const isOnCooldown = useCallback((tokenId: string): boolean => {
    // Layer 1: Check localStorage claim history
    const localStorageCheck = () => {
      if (!claimHistory[tokenId]) return false;
      const lastClaim = claimHistory[tokenId];
      const token = tokenCache[tokenId];
      if (!token) return false;

      // Enforce exactly 24 hours (86400000 ms) - no shortcuts
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      return Date.now() < lastClaim + TWENTY_FOUR_HOURS_MS;
    };

    // Layer 2: Additional validation - check if timestamp is reasonable
    const validateTimestamp = () => {
      if (!claimHistory[tokenId]) return false;
      const lastClaim = claimHistory[tokenId];
      const now = Date.now();

      // Prevent future timestamps (clock manipulation attempts)
      if (lastClaim > now) {
        console.warn(`Invalid future timestamp detected for ${tokenId}. Resetting claim history.`);
        // Reset the invalid timestamp
        const updatedHistory = { ...claimHistory };
        delete updatedHistory[tokenId];
        setClaimHistory(updatedHistory);
        if (typeof window !== 'undefined' && userAddress) {
          localStorage.setItem(`claim_history_${userAddress}`, JSON.stringify(updatedHistory));
        }
        return false;
      }

      // Prevent timestamps older than 30 days (data corruption protection)
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (lastClaim < now - THIRTY_DAYS_MS) {
        console.warn(`Very old timestamp detected for ${tokenId}. Allowing claim.`);
        return false;
      }

      return true;
    };

    // Execute both validation layers
    return validateTimestamp() && localStorageCheck();
  }, [claimHistory, tokenCache, userAddress]); // Added userAddress dependency

  // Enhanced cooldown remaining calculation with validation
  const getCooldownRemaining = useCallback((tokenId: string): string | null => {
    // Check if we need to read the hidden refresh trigger to force updates
    document.getElementById('cooldown-refresh-trigger')?.dataset.timestamp;

    // Early return if no claim history for this token
    if (!claimHistory[tokenId]) return null;

    const lastClaim = claimHistory[tokenId];
    const now = Date.now();

    // Validate timestamp integrity
    if (lastClaim > now) {
      console.warn(`Future timestamp detected in getCooldownRemaining for ${tokenId}`);
      return null;
    }

    // Use cached token instead of find() for better performance
    const token = tokenCache[tokenId];
    if (!token) return null;

    // Enforce exactly 24 hours - no shortcuts or manipulation
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const remaining = (lastClaim + TWENTY_FOUR_HOURS_MS) - now;

    if (remaining <= 0) return null;

    // Additional security: Ensure remaining time doesn't exceed 24 hours
    if (remaining > TWENTY_FOUR_HOURS_MS) {
      console.warn(`Invalid remaining time calculated for ${tokenId}: ${remaining}ms`);
      return null;
    }

    // Format as HH:MM:SS with precise calculations
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    // Ensure values are within expected ranges
    if (hours > 24 || minutes > 59 || seconds > 59) {
      console.warn(`Invalid time components calculated for ${tokenId}`);
      return null;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [claimHistory, tokenCache]);

  // Simulate claiming tokens
  // Add these to your state variables
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    message: string;
    txHash?: string;
  } | null>(null);
  const [showFundingHelper, setShowFundingHelper] = useState(false);


  // Convert TokenInfo to MintableToken for the hook
  const convertToMintableToken = useCallback((tokenInfo: TokenInfo): MintableToken => ({
    id: tokenInfo.id,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol || tokenInfo.name,
    amount: tokenInfo.amount,
    contractAddress: "", // Will be determined by the hook based on symbol
    tokenIndex: tokens.findIndex(t => t.id === tokenInfo.id),
    cooldownPeriod: "24h",
    description: tokenInfo.description,
  }), []);

  // Simplified token claiming function using the new hook
  const handleClaimToken = async (tokenId: string): Promise<void> => {
    if (!userAddress) {
      router.push("/signup");
      return;
    }

    // Client-side cooldown check
    if (isOnCooldown(tokenId)) {
      const remainingTime = getCooldownRemaining(tokenId);
      setError({
        title: "Cooldown Active",
        message: remainingTime
          ? `This token is on cooldown. Time remaining: ${remainingTime}`
          : `This token is on cooldown. Please wait for the 24-hour period to complete.`
      });
      return;
    }

    setClaimingToken(tokenId);
    setLoadingTokens(prev => ({ ...prev, [tokenId]: true }));

    const token = tokens.find(t => t.id === tokenId);
    if (!token) {
      setError({
        title: "Invalid Token",
        message: "Invalid token selected."
      });
      setLoadingTokens(prev => ({ ...prev, [tokenId]: false }));
      setClaimingToken(null);
      return;
    }

    try {
      const mintableToken = convertToMintableToken(token);
      const result = await claimTokens(mintableToken);

      if (result.success) {
        // Update local claim history
        updateClaimHistory(tokenId);

        setSuccess({
          title: "Tokens Claimed",
          message: `Successfully claimed ${token.amount.toLocaleString()} ${token.name}! Next claim available in 24 hours.`,
          txHash: result.txHash
        });
      }
    } catch (err) {
      console.error("Error claiming tokens:", err);

      let errorTitle = "Claim Failed";
      let errorMessage = "Failed to claim tokens. Please try again later.";
      let showFunding = false;

      if (err instanceof Error) {
        // Handle specific contract errors
        if (err.message.includes("CooldownNotElapsed") || err.message.includes("cooldown")) {
          // This is a cooldown error - show timer
          const remainingTime = getCooldownRemaining(tokenId);
          errorTitle = "Cooldown Active";
          errorMessage = remainingTime
            ? `You are still in the 24-hour cooldown period. Time remaining: ${remainingTime}`
            : "You are still in the 24-hour cooldown period. Please wait before claiming again.";
        } else if (err.message.includes("InsufficientFaucetBalance")) {
          errorTitle = "Faucet Empty";
          errorMessage = "The faucet doesn't have enough tokens. Please try again later or contact support.";
        } else if (err.message.includes("InvalidTokenIndex")) {
          errorTitle = "Invalid Token";
          errorMessage = "Invalid token selected. Please refresh the page and try again.";
        } else if (err.message.includes("TransferFailed")) {
          errorTitle = "Transfer Failed";
          errorMessage = "Token transfer failed. This might be a temporary issue. Please try again.";
        } else if (err.message.includes("execution reverted")) {
          // Generic contract revert - could be cooldown or other issue
          const remainingTime = getCooldownRemaining(tokenId);
          if (remainingTime) {
            errorTitle = "Cooldown Active";
            errorMessage = `Transaction rejected by contract. You may still be in cooldown. Time remaining: ${remainingTime}`;
          } else {
            errorTitle = "Transaction Rejected";
            errorMessage = "Transaction was rejected by the smart contract. Please try again.";
          }
        } else if (err.message.includes("insufficient") ||
                   err.message.includes("needs ETH for gas fees") ||
                   err.message.includes("Send Base Sepolia ETH to:")) {
          // Show funding helper for Account Kit gas issues
          showFunding = true;
          errorMessage = err.message;
        } else if (err.message.includes("user rejected")) {
          errorTitle = "Transaction Cancelled";
          errorMessage = "Transaction was cancelled by user.";
        } else {
          // Use the original error message for unknown errors
          errorMessage = err.message;
        }
      }

      if (showFunding) {
        setShowFundingHelper(true);
      } else {
        setError({
          title: errorTitle,
          message: errorMessage
        });
      }
    } finally {
      setLoadingTokens(prev => ({ ...prev, [tokenId]: false }));
      setClaimingToken(null);
    }
  };

  // Add these handler functions
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccess(null);
  }, []);

  // Use refs to store the current claim history and checking status
  const claimHistoryRef = useRef(claimHistory);
  const isCheckingClaimTimesRef = useRef(false);

  // Update the ref whenever the state changes
  useEffect(() => {
    claimHistoryRef.current = claimHistory;
  }, [claimHistory]);

  const checkContractClaimTimes = useCallback(async () => {
    // Prevent execution if no user address or contract address
    if (!userAddress || !TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId]) return;

    // Use a ref to track if we're already checking claim times
    // This prevents issues with concurrent calls
    if (isCheckingClaimTimesRef.current) return;
    isCheckingClaimTimesRef.current = true;

    try {
      const contractAddress = TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId] as `0x${string}`;

      // Use the enhanced getUserClaimStatus function for better efficiency
      const claimStatus = await readContract(wagmiConfig, {
        address: contractAddress,
        abi: TokenFaucetABI,
        functionName: "getUserClaimStatus",
        args: [userAddress],
      });

      // Extract the claim status data
      const [canClaim0, canClaim1, canClaim2, timeUntil0, timeUntil1, timeUntil2] = claimStatus as [boolean, boolean, boolean, bigint, bigint, bigint];

      // Use the ref instead of the state directly to avoid dependency cycles
      const currentHistory = { ...claimHistoryRef.current };
      let updated = false;

      // Update claim history based on contract data
      // Order matches MultiTokenFaucet contract: token0=USDX, token1=ZrUSD, token2=ZFI
      const tokenIds = ['usdx', 'zrusd', 'zfi'];
      const canClaimArray = [canClaim0, canClaim1, canClaim2];
      const timeUntilArray = [timeUntil0, timeUntil1, timeUntil2];

      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const canClaim = canClaimArray[i];
        const timeUntil = Number(timeUntilArray[i]);

        // If user cannot claim and there's time remaining, calculate last claim time
        if (!canClaim && timeUntil > 0) {
          const lastClaimTime = Date.now() - (24 * 60 * 60 * 1000 - timeUntil * 1000);

          // Update if different from current history
          if (!currentHistory[tokenId] || Math.abs(currentHistory[tokenId] - lastClaimTime) > 5000) {
            currentHistory[tokenId] = lastClaimTime;
            updated = true;
          }
        } else if (canClaim && currentHistory[tokenId]) {
          // If user can claim but we have a claim history, check if cooldown has passed
          const timeSinceLastClaim = Date.now() - currentHistory[tokenId];
          if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
            // Contract says can claim but our history says shouldn't be able to
            // Trust the contract and clear the history
            delete currentHistory[tokenId];
            updated = true;
          }
        }
      }

      // Update state only if changes were made
      if (updated) {
        setClaimHistory(currentHistory);
        // Save to localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem(`claim_history_${userAddress}`, JSON.stringify(currentHistory));
        }
      }
    } catch (err) {
      console.error("Error reading claim status from contract:", err);

      // Fallback to individual calls if getUserClaimStatus fails
      try {
        const currentHistory = { ...claimHistoryRef.current };
        let updated = false;

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const tokenIndex = tokens.findIndex(t => t.id === token.id);

          if (tokenIndex === -1) continue;

          const result = await readContract(wagmiConfig, {
            address: TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId] as `0x${string}`,
            abi: TokenFaucetABI,
            functionName: "lastClaimTime",
            args: [userAddress, tokenIndex],
          });

          if (result && Number(result) > 0) {
            const contractTime = Number(result) * 1000;
            if (!currentHistory[token.id] || currentHistory[token.id] !== contractTime) {
              currentHistory[token.id] = contractTime;
              updated = true;
            }
          }
        }

        if (updated) {
          setClaimHistory(currentHistory);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`claim_history_${userAddress}`, JSON.stringify(currentHistory));
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback claim time check also failed:", fallbackErr);
      }
    } finally {
      // Clear the flag when done
      isCheckingClaimTimesRef.current = false;
    }
  }, [userAddress, chainId]); // Remove claimHistory dependency
  // Refresh cooldown display every second
  // Split the effect into two separate effects to reduce dependencies and re-renders

  // First effect: Load data from localStorage and check contract once on mount or when userAddress changes
  useEffect(() => {
    // Create refs to track if the component is mounted
    const isMounted = { current: true };
    let timerId: NodeJS.Timeout | null = null;

    // First try to load from localStorage for testing or fallback
    const loadFromLocalStorage = () => {
      if (typeof window !== 'undefined' && userAddress) {
        const storedHistory = localStorage.getItem(`claim_history_${userAddress}`);
        if (storedHistory) {
          try {
            // Only update state if component is still mounted
            if (isMounted.current) {
              setClaimHistory(JSON.parse(storedHistory));
            }
          } catch (error) {
            console.error("Error parsing stored claim history:", error);
            localStorage.removeItem(`claim_history_${userAddress}`);
          }
        }
      }
    };

    // Load initial data
    loadFromLocalStorage();

    // Then check contract for actual claim times if contract is deployed
    // Use a timeout to prevent immediate execution which can cause render loops
    if (userAddress) {
      timerId = setTimeout(() => {
        if (isMounted.current) {
          checkContractClaimTimes();
        }
      }, 500);
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [userAddress, checkContractClaimTimes]);

  // Second effect: Set up the refresh interval for the cooldown display
  // This is separated to avoid re-creating the interval on every userAddress change
  useEffect(() => {
    // Create a separate mounted ref for this effect
    const isMounted = { current: true };

    // Use requestAnimationFrame for smoother updates with less overhead
    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;

    const updateCooldownDisplay = (timestamp: number) => {
      if (!isMounted.current) return;

      // Only update every 1000ms (1 second) to reduce overhead
      if (timestamp - lastUpdateTime >= 1000) {
        const forceUpdateElement = document.getElementById('cooldown-refresh-trigger');
        if (forceUpdateElement) {
          forceUpdateElement.dataset.timestamp = Date.now().toString();
        }
        lastUpdateTime = timestamp;
      }

      // Schedule the next update
      animationFrameId = requestAnimationFrame(updateCooldownDisplay);
    };

    // Start the animation frame loop
    animationFrameId = requestAnimationFrame(updateCooldownDisplay);

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []); // Empty dependency array means this only runs once on mount

  // Enhanced contract synchronization to prevent cooldown bypass attempts
  useEffect(() => {
    if (!userAddress || !chainId) return;

    const syncWithContract = async () => {
      try {
        const contractAddress = TOKEN_FAUCET_ADDRESS[chainId as SupportedChainId] as `0x${string}`;

        // Verify contract cooldown period is exactly 24 hours
        const contractCooldown = await readContract(wagmiConfig, {
          address: contractAddress,
          abi: TokenFaucetABI,
          functionName: "COOLDOWN_PERIOD",
        });

        const expectedCooldown = 24 * 60 * 60; // 24 hours in seconds
        if (Number(contractCooldown) !== expectedCooldown) {
          console.error(`SECURITY ALERT: Contract cooldown period is ${contractCooldown} seconds, expected ${expectedCooldown} seconds`);
        }

        // Check each token's last claim time from contract and sync with local storage
        for (let i = 0; i < tokens.length; i++) {
          const tokenId = tokens[i].id;

          try {
            const contractLastClaim = await readContract(wagmiConfig, {
              address: contractAddress,
              abi: TokenFaucetABI,
              functionName: "lastClaimTime",
              args: [userAddress, i],
            });

            const contractTime = Number(contractLastClaim) * 1000; // Convert to JS timestamp
            const localTime = claimHistory[tokenId];

            // If contract has a more recent claim time, update local storage
            if (contractTime > 0 && (!localTime || Math.abs(contractTime - localTime) > 5000)) {
              console.log(`Syncing ${tokenId} claim time from contract: ${new Date(contractTime).toISOString()}`);
              setClaimHistory(prev => {
                const updated = { ...prev, [tokenId]: contractTime };
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`claim_history_${userAddress}`, JSON.stringify(updated));
                }
                return updated;
              });
            }

            // Additional security: Verify user cannot claim if they're in cooldown
            if (contractTime > 0) {
              const timeSinceLastClaim = Date.now() - contractTime;
              const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

              if (timeSinceLastClaim < cooldownMs) {
                const canClaimFromContract = await readContract(wagmiConfig, {
                  address: contractAddress,
                  abi: TokenFaucetABI,
                  functionName: "canClaim",
                  args: [userAddress, i],
                });

                if (canClaimFromContract) {
                  console.warn(`SECURITY WARNING: Contract says user can claim ${tokenId} but should be in cooldown`);
                }
              }
            }
          } catch (tokenError) {
            console.error(`Error syncing token ${tokenId}:`, tokenError);
          }
        }
      } catch (error) {
        console.error("Error syncing with contract:", error);
      }
    };

    // Sync immediately and then every 60 seconds for security monitoring
    syncWithContract();
    const interval = setInterval(syncWithContract, 60000);

    return () => clearInterval(interval);
  }, [userAddress, chainId, claimHistory]);

  return (
    <div className="flex-1 text-white flex flex-col items-center justify-center py-12 min-h-screen bg-gradient-to-b from-[#001525] to-[#001A20]">
      {/* Hidden element for cooldown refresh trigger */}
      <div id="cooldown-refresh-trigger" className="hidden" data-timestamp={Date.now()}></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full space-y-10 px-4 relative ">
        {/* Header with subtle animation */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Testnet Token Faucet
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-base">
            Follow the steps below to get test tokens and start using Zybra Finance on the testnet.
          </p>
        </motion.div>

        {/* Network Badge */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-r from-[#00233A] to-[#00314F] rounded-full py-2 px-6 shadow-[0_0_20px_rgba(0,80,140,0.3)] flex items-center gap-3"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse relative"><div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
            </div>
            <span className="font-medium">Base Sepolia Testnet</span>
          </motion.div>
        </div>

        {/* Get Sepolia ETH Section */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-1">
                1
              </div>
              <span className="font-medium">Get Sepolia ETH</span>
            </div>
            <div className="text-sm px-2.5 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
              <span className="font-medium text-xs">Required for Testing</span>
            </div>
          </div>

          <div className="p-5">
            <div className="bg-gradient-to-r from-[#00233A]/50 to-[#001E30]/50 rounded-lg p-4 border border-[#003354]/60 mb-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-200 mb-1">What is Sepolia ETH?</h3>
                  <p className="text-sm text-gray-400">
                    Sepolia ETH is the test version of ETH used on the Ethereum Sepolia testnet. You need it to pay for gas fees (transaction costs) when testing Zybra Finance. It has no real value and is only for testing purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-lg font-medium text-white mb-2">Step-by-Step Guide for Beginners:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm pl-1">
                <li>Choose one of the faucets below (Nebulum is recommended as it requires no ETH balance)</li>
                <li>Enter your wallet address on the faucet website</li>
                <li>Request Sepolia ETH (it&apos;s free!)</li>
                <li>Wait for the ETH to appear in your wallet (usually takes seconds)</li>
              </ol>

              {/* Bridge Box in Step 1 */}
              <div className="mt-3 mb-3 p-3 bg-[#0A1721]/80 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  <h4 className="font-medium text-blue-300">Bridge Your ETH to Base Sepolia</h4>
                </div>
                <p className="text-sm text-gray-300 mb-2 pl-7">
                  Before proceeding, you must bridge your Sepolia ETH to Base Sepolia network.
                </p>
                <a
                  href="https://superbridge.app/base-sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between mt-2 p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors mx-2"
                >
                  <span className="text-sm font-medium text-blue-400">Go to Superbridge</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <div className="text-gray-300 text-sm pl-1">
                After bridging, continue to Step 2 below to claim Zybra test tokens
              </div>
            </div>

            <FaucetButtons
              buttons={[
                {
                  id: "nebulum",
                  name: "Nebulum Sepolia Faucet",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ),
                  url: "https://app.nebulum.one/sepolia_faucet",
                  description: "No minimal balance or account required. Get 0.001 Sepolia ETH (up to 0.01) every 8 hours.",
                  tags: ["No ETH Required", "No Registration", "1 Claim / 8h"],
                  bgColor: "#3B82F6",
                  recommended: true
                },
                {
                  id: "google",
                  name: "Google Cloud Web3 Faucet",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" fill="#EA4335" />
                      <path d="M16.9 13.5C16.3 12.8 15 12.3 13.5 12.1C13 12 12.5 12 12 12C11.5 12 11 12 10.5 12.1C9 12.3 7.7 12.8 7.1 13.5C6.4 14.2 6 15.1 6 16V21H18V16C18 15.1 17.6 14.2 16.9 13.5Z" fill="#4285F4" />
                      <path d="M6 16V21H18V16C18 15.1 17.6 14.2 16.9 13.5C16.3 12.8 15 12.3 13.5 12.1C13 12 12.5 12 12 12C11.5 12 11 12 10.5 12.1C9 12.3 7.7 12.8 7.1 13.5C6.4 14.2 6 15.1 6 16Z" fill="#34A853" />
                      <path d="M6 21H18V16C18 15.1 17.6 14.2 16.9 13.5C16.3 12.8 15 12.3 13.5 12.1C13 12 12.5 12 12 12C11.5 12 11 12 10.5 12.1C9 12.3 7.7 12.8 7.1 13.5C6.4 14.2 6 15.1 6 16V21Z" fill="#FBBC05" />
                    </svg>
                  ),
                  url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
                  description: "Google Cloud's Web3 faucet provides 0.03-0.05 Sepolia ETH daily. Only requires a Google account.",
                  tags: ["No ETH Required", "Google Login", "1 Claim / 24h"],
                  bgColor: "#4285F4"
                },
                {
                  id: "automata",
                  name: "Automata Sepolia Faucet",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  url: "https://www.sepoliafaucet.io/",
                  description: "No account sign-ups, no social verification, no tasklist. Uses hardware attestation instead of wallet balance requirements.",
                  tags: ["No ETH Required", "No Registration", "1 Claim / 24h"],
                  bgColor: "#10B981"
                },
                {
                  id: "sepolia-pow",
                  name: "Sepolia PoW Faucet",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  url: "https://sepolia-faucet.pk910.de/",
                  description: "Mine testnet funds through your browser. Requires a Gitcoin Passport with a score of at least 2.",
                  tags: ["No ETH Required", "Browser Mining", "Unlimited"],
                  bgColor: "#F59E0B"
                }
              ]}
            />

            <div className="mt-5 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-200 mb-1">Pro Tips for Beginners:</h3>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>You only need a small amount of Sepolia ETH to get started (0.001 ETH is enough)</li>
                    <li>All faucets above require NO existing ETH balance - perfect for new wallets</li>
                    <li>If one faucet doesn&apos;t work, try another one from the list</li>
                    <li>Having trouble? Join our <a href="https://discord.gg/zybra" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Discord</a> for help</li>
                  </ul>

                  {/* Bridge Information Box */}
                  <div className="mt-4 p-3 bg-[#0A1721]/80 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-medium text-blue-300">Important: Bridge Your ETH</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      You must bridge your Sepolia ETH to Base Sepolia before using Zybra Finance.
                    </p>
                    <a
                      href="https://superbridge.app/base-sepolia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between mt-2 p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-400">Bridge using Superbridge</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p className="text-xs text-gray-400 mt-2">
                      The bridge process is simple: connect wallet, select amount, and click &quot;Bridge&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Token Cards Section */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-1">
                2
              </div>
              <span className="font-medium">Claim Zybra Test Tokens</span>
            </div>
            <div className="text-sm px-2.5 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="font-medium text-xs">After Getting ETH</span>
            </div>
          </div>

          <div className="p-5">
            <div className="bg-gradient-to-r from-[#00233A]/50 to-[#001E30]/50 rounded-lg p-4 border border-[#003354]/60 mb-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-200 mb-1">How to Claim Test Tokens</h3>
                  <p className="text-sm text-gray-400">
                    Once you have Sepolia ETH from Step 1, you can claim these test tokens to interact with Zybra Finance features. Each token has a {tokens[0].cooldown}-hour cooldown period between claims.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tokens.map((token, index) => (
                <TokenCard
                  key={token.id}
                  token={token}
                  isOnCooldown={isOnCooldown}
                  getCooldownRemaining={getCooldownRemaining}
                  handleClaimToken={handleClaimToken}
                  claimingToken={claimingToken}
                  loadingTokens={loadingTokens}
                  index={index}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Connection Status */}
        {!userAddress && (
          <motion.div
            className="mt-6 text-center p-6 bg-[#001C29]/70 rounded-xl border border-[#003354]/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-100">Connect your wallet</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                You need to connect your wallet to claim test tokens and interact with the Zybra Finance ecosystem
              </p>
            </div>

            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="bg-gradient-to-r from-[#4BB6EE] to-[#65C7F7] px-8 py-2.5 rounded-lg shadow-[0_0_15px_rgba(75,182,238,0.3)] font-medium"
                onClick={() => router.push("/signup")}
              >
                Connect Wallet
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          className="bg-gradient-to-r from-[#00233A]/50 to-[#001A26]/50 rounded-lg p-5 border border-[#003354]/40 text-sm text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Complete Testing Flow</h3>
              <ol className="list-decimal list-inside space-y-2 mb-3">
                <li className="text-blue-400 font-medium">Get Sepolia ETH from one of the faucets above</li>
                <li className="text-blue-400 font-medium">Bridge your Sepolia ETH to Base Sepolia using <a href="https://superbridge.app/base-sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Superbridge</a></li>
                <li className="text-blue-400 font-medium">Claim Zybra test tokens to use in the app</li>
                <li className="text-gray-300">Start testing Zybra Finance features like staking and lending</li>
              </ol>
              <p className="mb-2">
                These tokens are for testing purposes only and have no real value.
                Use them to explore Zybra Finance features on the testnet before
                interacting with the mainnet version.
              </p>
              <p>
                If you encounter any issues with the faucet, please contact our support
                team on <a href={SOCIAL_LINKS.DISCORD} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline cursor-pointer">Discord</a>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Testnet Networks */}
        <motion.div
          className="bg-[#001C29] rounded-xl overflow-hidden border border-[#003354]/40 shadow-[0_0_30px_rgba(0,70,120,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div className="bg-gradient-to-r from-[#00233A]/80 to-[#00182A] py-3.5 px-4 border-b border-[#003354]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold mr-1">
                3
              </div>
              <span className="font-medium">Choose a Testnet</span>
            </div>
            <div className="text-sm px-2.5 py-0.5 bg-[#001A26] rounded-full border border-[#003354]/60 flex items-center gap-1.5">
              <span className="font-medium text-xs">Network Selection</span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#6F4FF2] flex items-center justify-center text-xs font-bold shadow-lg">
                BS SE
              </div>
              <div>
                <div className="font-medium">Base Sepolia</div>
                <div className="text-xs text-gray-400">Recommended</div>
              </div>
              <div className="ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                Active
              </div>
            </div>

            <div className="bg-[#00233A] rounded-lg p-4 border border-[#003354]/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-xs font-bold shadow-lg">
                SE
              </div>
              <div>
                <div className="font-medium"> Sepolia Testnet </div>
                <div className="text-xs text-gray-400">Alternative testnet</div>
              </div>
              <div className="ml-auto bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                Coming Soon
              </div>
            </div>
          </div>
        </motion.div>



        {/* Footer */}
        <div className="text-center text-gray-500 text-xs pt-4 pb-8">
          © {new Date().getFullYear()} Zybra Finance. All testnet tokens are for testing purposes only.
        </div>
      </div>

      {/* Add these modal components at the end of your return statement */}
      <ErrorModal
        isOpen={!!error}
        onClose={handleErrorClose}
        title={error?.title || "Error"}
        message={error?.message || "Something went wrong"}
      />

      <SuccessModal
        isOpen={success != null && success.txHash != null}
        onClose={handleSuccessClose}
        title={success?.title || "Success"}
        message={success?.message || "Operation completed successfully"}
        txHash={success?.txHash}
        chainId={chainId}
      />

      <FundingHelper
        isOpen={showFundingHelper}
        onClose={() => setShowFundingHelper(false)}
      />
    </div>
  );
};

export default TokenFaucet;