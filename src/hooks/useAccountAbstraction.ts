import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useEthersProvider } from './useEthersProvider';

export interface Transaction {
  id: string;
  accountAddress: string;
  destination: string;
  value: ethers.BigNumberish;
  functionData: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

export function useAccountAbstraction() {
  const { provider } = useEthersProvider();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch Minimal Account Address from Backend API
  const fetchMinimalAccountFromAPI = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API}/fetch-minimal-account`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch account');
      const { accountAddress } = await response.json();
      return accountAddress || null;
    } catch (err: any) {
      console.error('Error fetching minimal account:', err);
      setError(err.message || 'Failed to fetch minimal account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Minimal Account Contract
  const createMinimalAccount = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API}/create-minimal-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to create minimal account');
      const { accountAddress } = await response.json();
      return accountAddress;
    } catch (err: any) {
      console.error('Error creating minimal account:', err);
      setError(err.message || 'Failed to create minimal account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a transaction to the local state
  const addTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactions((prev) => [...prev, transaction]);
    },
    [setTransactions]
  );

  // Execute a transaction via the backend
  const executeTransaction = useCallback(
    async (
      accountAddress: string,
      destination: string,
      value: ethers.BigNumberish,
      functionData: string
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      const transactionId = ethers.utils.hexlify(ethers.utils.randomBytes(16)); // Generate a random ID
      addTransaction({
        id: transactionId,
        accountAddress,
        destination,
        value,
        functionData,
        status: 'pending',
      });

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API}/execute-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountAddress, destination, value, functionData }),
        });

        if (!response.ok) throw new Error('Transaction execution failed');
        const { txHash } = await response.json();

        // Update transaction status
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId ? { ...tx, status: 'completed', txHash } : tx
          )
        );

        return txHash;
      } catch (err: any) {
        console.error('Error executing transaction:', err);

        // Update transaction status to failed
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId ? { ...tx, status: 'failed' } : tx
          )
        );

        setError(err.message || 'Failed to execute transaction');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addTransaction]
  );

  return {
    fetchMinimalAccountFromAPI,
    createMinimalAccount,
    executeTransaction,
    transactions,
    loading,
    error,
  };
}
