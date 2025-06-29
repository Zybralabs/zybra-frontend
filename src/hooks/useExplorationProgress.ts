'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { useTransactionContext } from '@/context/TransactionContext';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';

export type ExplorationStep = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link?: string;
  action?: string;
  completed: boolean;
  requiredSteps?: string[];
};

// Map of paths to step IDs for automatic completion tracking
const PATH_TO_STEP_MAP: Record<string, string> = {
  '/lending': 'lending',
  '/dashboard': 'dashboard',
  '/swap': 'deposit',
  '/pools': 'pools',
  '/markets': 'markets',
  '/mint': 'mint',
  '/kyc': 'kyc'
};

export const useExplorationProgress = () => {
  const { address, isConnected } = useAccount();
  const pathname = usePathname();
  const {
    user,
    zrusdBorrowed,
    getUserAssetsAndPoolsHoldings,
    trackFeatureUsage
  } = useUserAccount();

  // Use shared transaction context instead of direct API calls
  const { transactions: transactionsFromContext } = useTransactionContext();

  // State for tracking completed steps
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Define types for transactions and holdings
  type Transaction = {
    id: string;
    type: string;
    asset?: string;
    amount?: string;
    status?: string;
    timestamp?: string;
    metadata?: {
      action?: string;
      txHash?: string;
      network?: string;
      pool?: string;
    };
  };

  type Holdings = {
    assets: Array<{
      assetId: string;
      name: string;
      symbol: string;
      totalAmount: number;
      totalZRUSDBorrowed: number;
    }>;
    pools: Array<{
      poolId: string;
      name: string;
      totalAmount: number;
      totalZRUSDBorrowed: number;
    }>;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [holdings, setHoldings] = useState<Holdings>({ assets: [], pools: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Refs to prevent excessive tracking calls
  const hasTrackedInitialSteps = useRef(false);
  const trackedPaths = useRef<Set<string>>(new Set());

  // Load completed steps from localStorage on initial render or when address changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Use the same storage key logic as getStorageKey
        let storageKey = 'zybra-completed-steps-guest';

        // Use wallet address as the primary identifier
        if (address) {
          storageKey = `zybra-completed-steps-wallet-${address.toLowerCase()}`;
        }
        // Fallback to auth token if no address is available
        else {
          const authToken = localStorage.getItem('authToken');
          if (authToken) {
            storageKey = `zybra-completed-steps-${authToken.substring(0, 10)}`;
          }
        }

        const savedSteps = localStorage.getItem(storageKey);
        if (savedSteps) {
          setCompletedSteps(new Set(JSON.parse(savedSteps)));
        } else {
          // If no saved steps for this wallet, reset to empty set
          setCompletedSteps(new Set());
        }
      } catch (error) {
        console.error('Error loading completed steps from localStorage:', error);
      }
    }
  }, [address]);

  // Helper function to get the storage key based on wallet address
  const getStorageKey = useCallback(() => {
    if (typeof window === 'undefined') return 'zybra-completed-steps-guest';

    // Use wallet address as the primary identifier for exploration progress
    // This ensures each wallet has its own progress tracking
    if (address) {
      return `zybra-completed-steps-wallet-${address.toLowerCase()}`;
    }

    // Fallback to auth token if no address is available
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      return `zybra-completed-steps-${authToken.substring(0, 10)}`;
    }

    // When not authenticated, we don't want to show any progress
    // Return a key that won't be used for actual storage
    return 'zybra-completed-steps-guest';
  }, [address]);

  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && completedSteps.size > 0) {
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(Array.from(completedSteps)));
      } catch (error) {
        console.error('Error saving completed steps to localStorage:', error);
      }
    }
  }, [completedSteps, getStorageKey]);

  // Track page visits for automatic step completion
  useEffect(() => {
    if (!pathname || !isConnected || !address) return;

    // Find if current path matches any step
    const matchingPath = Object.keys(PATH_TO_STEP_MAP).find(path =>
      pathname.startsWith(path)
    );

    if (matchingPath && !trackedPaths.current.has(matchingPath)) {
      const stepId = PATH_TO_STEP_MAP[matchingPath];

      // Mark the step as completed
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(stepId);
        return newSet;
      });

      // Track the feature usage
      trackFeatureUsage(`visit_${stepId}`).catch(console.error);

      // Remember that we've tracked this path
      trackedPaths.current.add(matchingPath);

      // Also save to localStorage immediately
      if (typeof window !== 'undefined') {
        try {
          const storageKey = getStorageKey();
          const savedSteps = localStorage.getItem(storageKey);
          const existingSteps = savedSteps ? new Set(JSON.parse(savedSteps)) : new Set();
          existingSteps.add(stepId);
          localStorage.setItem(storageKey, JSON.stringify(Array.from(existingSteps)));
        } catch (error) {
          console.error('Error saving step completion to localStorage:', error);
        }
      }
    }
  }, [pathname, isConnected, address, trackFeatureUsage, getStorageKey]);

  // Load user transactions and holdings
  useEffect(() => {
    const loadUserData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Use transactions from context instead of direct API call
        console.log("Using transactions from context for exploration progress");
        const mappedTransactions = (transactionsFromContext || []).map(tx => ({
          id: tx.tx_hash || `tx-${Date.now()}`,
          type: tx.type || 'unknown',
          asset: tx.metadata?.assetSymbol,
          amount: tx.amount,
          status: tx.status
        }));
        setTransactions(mappedTransactions);

        // Load holdings
        const holdingsResponse = await getUserAssetsAndPoolsHoldings();
        if (holdingsResponse &&
            typeof holdingsResponse === 'object' &&
            (holdingsResponse.assets || holdingsResponse.pools)) {
          // Ensure we have the expected structure
          const formattedHoldings = {
            assets: Array.isArray(holdingsResponse.assets) ? holdingsResponse.assets : [],
            pools: Array.isArray(holdingsResponse.pools) ? holdingsResponse.pools : []
          };
          setHoldings(formattedHoldings);
        } else {
          // Set empty holdings if no valid response
          setHoldings({ assets: [], pools: [] });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [address, transactionsFromContext, getUserAssetsAndPoolsHoldings]);

  // Check completion status of steps
  useEffect(() => {
    // Don't proceed with any completion checks if no address
    if (!address) return;

    const newCompletedSteps = new Set<string>();

    // Check wallet connection - always mark as completed if address exists
    if (address) {
      newCompletedSteps.add('wallet');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('wallet_connection').catch(console.error);
      }
    }

    // Check KYC verification
    if (user?.kyc_status === 'approved') {
      newCompletedSteps.add('kyc');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('kyc_verification').catch(console.error);
      }
    }

    // Check ZrUSD minting
    if (zrusdBorrowed !== null && zrusdBorrowed > 0) {
      newCompletedSteps.add('mint');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('mint_zrusd').catch(console.error);
      }
    }

    // Check deposits/withdrawals
    if (Array.isArray(transactions) && transactions.length > 0) {
      newCompletedSteps.add('deposit');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('deposit_withdraw').catch(console.error);
      }
    }

    // Check pool investments
    if (holdings && holdings.pools && Array.isArray(holdings.pools) && holdings.pools.length > 0) {
      newCompletedSteps.add('pools');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('pool_investment').catch(console.error);
      }
    }

    // Check lending activity
    const hasLendingActivity = Array.isArray(transactions) && transactions.length > 0 && transactions.some(tx =>
      tx?.type === 'lend' || tx?.type === 'borrow' ||
      tx?.metadata?.action === 'lend' || tx?.metadata?.action === 'borrow'
    );

    if (hasLendingActivity) {
      newCompletedSteps.add('lending');

      // Only track feature usage once
      if (!hasTrackedInitialSteps.current) {
        trackFeatureUsage('lending_borrowing').catch(console.error);
      }
    }

    // Check markets exploration - we'll consider this completed if they've viewed markets
    // or if they've completed wallet and KYC steps
    if (newCompletedSteps.has('wallet') && newCompletedSteps.has('kyc')) {
      newCompletedSteps.add('markets');
    }

    // Check dashboard viewing - consider this completed if they've connected their wallet
    if (newCompletedSteps.has('wallet')) {
      newCompletedSteps.add('dashboard');
    }

    // Update completed steps
    setCompletedSteps(prevSteps => {
      const combinedSteps = new Set([...prevSteps, ...newCompletedSteps]);
      return combinedSteps;
    });

    // Mark that we've tracked initial steps
    hasTrackedInitialSteps.current = true;
  }, [
    address,
    user,
    zrusdBorrowed,
    transactions,
    holdings,
    trackFeatureUsage
  ]);

  // Mark a step as completed manually
  const markStepCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(stepId);
      return newSet;
    });

    // Track feature usage
    trackFeatureUsage(`complete_${stepId}`).catch(console.error);

    // Also save to localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getStorageKey();
        const savedSteps = localStorage.getItem(storageKey);
        const existingSteps = savedSteps ? new Set(JSON.parse(savedSteps)) : new Set();
        existingSteps.add(stepId);
        localStorage.setItem(storageKey, JSON.stringify(Array.from(existingSteps)));
      } catch (error) {
        console.error('Error saving step completion to localStorage:', error);
      }
    }
  }, [trackFeatureUsage, getStorageKey]);

  // Check if a step is completed
  const isStepCompleted = useCallback((stepId: string) => {
    // Only show completed steps if the user has a wallet address
    // This ensures each wallet has its own progress tracking
    if (!address) {
      return false;
    }

    // Otherwise, check if the step is completed
    return completedSteps.has(stepId);
  }, [completedSteps, address]);

  // Check if a step is available based on its requirements
  const isStepAvailable = useCallback((step: ExplorationStep) => {
    // If no wallet address, only the wallet connection step is available
    if (!address) {
      return step.id === 'wallet'; // Only wallet connection step is available when not connected
    }

    // For connected wallets, check requirements
    if (!step.requiredSteps) return true;
    return step.requiredSteps.every(reqStep => completedSteps.has(reqStep));
  }, [completedSteps, address]);

  // Calculate progress percentage
  const calculateProgress = useCallback((totalSteps: number) => {
    // If no wallet address, show 0% progress
    if (!address) {
      return 0;
    }

    // Otherwise, calculate progress normally
    return Math.round((completedSteps.size / totalSteps) * 100);
  }, [completedSteps, address]);

  // Reset progress for the current wallet
  const resetProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    }
    setCompletedSteps(new Set());
    hasTrackedInitialSteps.current = false;
    trackedPaths.current.clear();
  }, [getStorageKey]);

  // Clear all exploration progress for all wallets (admin function)
  const clearAllProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Find all exploration progress keys in localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zybra-completed-steps-')) {
          keys.push(key);
        }
      }

      // Remove all exploration progress keys
      keys.forEach(key => localStorage.removeItem(key));

      // Reset current state
      setCompletedSteps(new Set());
      hasTrackedInitialSteps.current = false;
      trackedPaths.current.clear();

      console.log(`Cleared all exploration progress (${keys.length} entries)`);
    }
  }, []);

  return {
    completedSteps,
    isStepCompleted,
    isStepAvailable,
    markStepCompleted,
    calculateProgress,
    isLoading,
    resetProgress,
    clearAllProgress
  };
};
