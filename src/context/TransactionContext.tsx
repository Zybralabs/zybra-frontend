import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserAccount } from './UserAccountContext';

interface TransactionMetadata {
  assetType: string;
  assetSymbol: string;
  assetAddress: string;
}

export interface TransactionItem {
  user: string;
  type?: "pool" | "stock" | "zybra";
  status: string;
  amount: string;
  metadata: TransactionMetadata;
  allocation?: string;
  tx_hash: string;
  created_at?: Date;
}

interface TransactionContextType {
  transactions: TransactionItem[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: React.ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const { getTransactions, token } = useUserAccount();

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchTransactions = useCallback(async () => {
    const now = Date.now();
    
    // Check if we have recent data and avoid unnecessary API calls
    if (transactions.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log("Using cached transaction data, skipping API call");
      return;
    }

    console.log("Fetching transactions from API...");

    setIsLoading(true);
    setError(null);
    
    try {
      const transactionResponse = await getTransactions();
      if (transactionResponse?.payload?.transactions && Array.isArray(transactionResponse.payload.transactions)) {
        const transactionsArray = transactionResponse.payload.transactions;

        // Process and validate transactions
        const validTransactions = transactionsArray
          .filter((tx: any) => tx && typeof tx === 'object')
          .map((tx: any) => {
            // Determine transaction type based on metadata
            let transactionType = tx.type;
            if (tx.metadata?.assetSymbol?.toLowerCase() === 'zfi' || 
                tx.metadata?.assetSymbol?.toLowerCase() === 'zybra') {
              transactionType = 'zybra';
            }

            return {
              user: tx.user || 'Unknown',
              type: transactionType || undefined,
              status: tx.status || 'Unknown',
              amount: tx.amount || '0',
              metadata: {
                assetType: tx.metadata?.assetType || 'Unknown',
                assetSymbol: tx.metadata?.assetSymbol || 'Token',
                assetAddress: tx.metadata?.assetAddress || ''
              },
              allocation: tx.allocation,
              tx_hash: tx.tx_hash || '',
              created_at: tx.created_at || new Date()
            };
          });

        // Sort by timestamp (newest first)
        validTransactions.sort((a: TransactionItem, b: TransactionItem) => {
          const dateA = new Date(a.created_at || new Date());
          const dateB = new Date(b.created_at || new Date());
          return dateB.getTime() - dateA.getTime();
        });

        setTransactions(validTransactions);
        setLastFetchTime(now);
      } else {
        console.warn("No transactions found or invalid data structure");
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transaction data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [getTransactions]); // Remove transactions.length and lastFetchTime to prevent infinite loops

  const refreshTransactions = useCallback(async () => {
    setLastFetchTime(0); // Reset cache
    await fetchTransactions();
  }, [fetchTransactions]);

  // Auto-fetch when user is authenticated (only when token changes)
  useEffect(() => {
    if (token) {
      console.log("Token detected, fetching transactions...");
      fetchTransactions();
    } else {
      console.log("No token, clearing transactions...");
      setTransactions([]);
      setLastFetchTime(0);
    }
  }, [token]); // Only depend on token, not fetchTransactions

  const value: TransactionContextType = {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    refreshTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
