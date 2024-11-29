import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccountAbstraction } from '../hooks/useAccountAbstraction'; // Hook for minimal account abstraction
import { useAccount } from '../hooks/useAccount'; // Hook for web3 wallet
import { WalletType } from '@/constant/account/enum';

interface UserAccountContextProps {
  address: string | null;
  walletType: WalletType | null;
  fetchAccount: () => Promise<string | null>;
  createAccount: () => Promise<string>;
  loading: boolean;
  error: string | null;
}

const UserAccountContext = createContext<UserAccountContextProps>({
  address: null,
  walletType: null,
  fetchAccount: async () => {
    throw new Error('UserAccountContext not initialized');
  },
  createAccount: async () => {
    throw new Error('UserAccountContext not initialized');
  },
  loading: false,
  error: null,
});

export const useUserAccount = () => useContext(UserAccountContext);

export const UserAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: web3Address, isConnected } = useAccount(); // Hook to detect web3 wallet
  const { fetchMinimalAccountFromAPI, createMinimalAccount, loading, error } =
    useAccountAbstraction();

  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);

  // Function to fetch the user's account
  const fetchAccount = useCallback(async () => {
    try {
      if (isConnected && web3Address) {
        // Use web3 wallet if connected
        setAddress(web3Address);
        setWalletType(WalletType.WEB3);
        return web3Address;
      } else {
        // Fetch minimal account from API
        const fetchedAddress = await fetchMinimalAccountFromAPI();
        if (fetchedAddress) {
          setAddress(fetchedAddress);
          setWalletType(WalletType.MINIMAL);
        }
        return fetchedAddress;
      }
    } catch (err) {
      console.error('Error fetching account:', err);
      throw err;
    }
  }, [isConnected, web3Address, fetchMinimalAccountFromAPI]);

  // Function to create a minimal wallet account
  const createAccount = useCallback(async () => {
    try {
      const minimalAddress = await createMinimalAccount();
      setAddress(minimalAddress);
      setWalletType(WalletType.MINIMAL);
      return minimalAddress;
    } catch (err) {
      console.error('Error creating account:', err);
      throw err;
    }
  }, [createMinimalAccount]);

  // Automatically fetch the account on load
  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return (
    <UserAccountContext.Provider
      value={{
        address,
        walletType,
        fetchAccount,
        createAccount,
        loading,
        error,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
};
