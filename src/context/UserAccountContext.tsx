import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import axios from "axios";

import { WalletType } from "@/constant/account/enum";

import { useAccount } from "../hooks/useAccount";
import { useAccountAbstraction } from "../hooks/useAccountAbstraction";

interface UserAccountContextProps {
  address: string | null;
  walletType: WalletType | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  // API actions
  getUserProfile: () => Promise<any>;
  updateUserProfile: (data: { first_name?: string; last_name?: string; profile_details?: object }) => Promise<any>;
  submitKYC: (data: { document_type: string; document_number: string; document_image: string }) => Promise<any>;
  getKYCStatus: () => Promise<any>;
  addWallet: (walletAddress: string) => Promise<any>;
  getWallets: () => Promise<any>;
  createAbstractWallet: () => Promise<any>;
  executeTransaction: (data: { dest: string; calldata: string; asset: string; amount: number }) => Promise<any>;
  addTransaction: (data: { type: string; amount: number; asset: string; status?: string; metadata?: object; tx_hash?: string }) => Promise<any>;
  getTransactions: (walletAddress?: string) => Promise<any>;
  walletSignIn: (walletAddress: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
      password: string,
      firstName: string,
      lastName: string,
      walletAddress: string,
      country: string,
      state: string,
      city: string,
      address: string
    },
    wallet?: string
  ) => Promise<void>;

}

const UserAccountContext = createContext<UserAccountContextProps>({
  address: null,
  walletType: null,
  token: null,
  loading: false,
  error: null,
  getUserProfile: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  updateUserProfile: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  submitKYC: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getKYCStatus: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  addWallet: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getWallets: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  createAbstractWallet: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  executeTransaction: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  addTransaction: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  getTransactions: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  walletSignIn: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  signIn: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  signUp: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  verifyCode: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  sendVerificationEmail: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  
  
});

export const useUserAccount = () => useContext(UserAccountContext);

export const UserAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: web3Address, isConnected } = useAccount();
  const { fetchMinimalAccountFromAPI, loading: abstractionLoading, error: abstractionError } =
    useAccountAbstraction();

  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_ZYBRA_BASE_API_URL || "";

  const apiClient = useCallback(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  // API actions
  const getUserProfile = useCallback(async () => {
    const response = await apiClient().get("/user/profile");
    return response.data;
  }, [apiClient]);

  const updateUserProfile = useCallback(
    async (data: any) => {
      const response = await apiClient().put("/user/profile", { ...data, userId: address });
      return response.data;
    },
    [apiClient, address]
  );

  const submitKYC = useCallback(
    async (data: any) => {
      const response = await apiClient().post("/user/kyc", { ...data, userId: address });
      return response.data;
    },
    [apiClient, address]
  );

  const getKYCStatus = useCallback(async () => {
    const response = await apiClient().get("/user/kyc");
    return response.data;
  }, [apiClient]);

  const addWallet = useCallback(
    async (walletAddress: any) => {
      const response = await apiClient().post("/user/wallet", { userId: address, walletAddress });
      return response.data;
    },
    [apiClient, address]
  );

  const getWallets = useCallback(async () => {
    const response = await apiClient().get("/user/wallets");
    return response.data;
  }, [apiClient, address]);

  const createAbstractWallet = useCallback(async () => {
    const response = await apiClient().post("/user/wallet/abstract", { userId: address });
    return response.data;
  }, [apiClient, address]);

  const executeTransaction = useCallback(
    async (data: any) => {
      const response = await apiClient().post("/user/transaction/execute", { userId: address, ...data });
      return response.data;
    },
    [apiClient, address]
  );



    const sendVerificationEmail = useCallback(async (email:string) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/send-verification-email`, { email });
        return response.data;
      } catch (err) {
        console.error("Error sending verification email:", err);
        throw new Error(err.response?.data?.message || "Failed to send verification email");
      }
    }, []);
  
    const verifyCode = useCallback(async (email:string, code:number) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/verify-code`, { email, code });
        return response.data;
      } catch (err) {
        console.error("Error verifying code:", err);
        throw new Error(err.response?.data?.message || "Verification failed");
      }
    }, []);
 

  const walletSignIn = useCallback(
    async (walletAddress: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient().post("/wallet-sign-in", { walletAddress });

        const { token, wallet } = response.data.payload;

        setAddress(wallet.address);
        setWalletType(WalletType.WEB3);
        setToken(token); // Save the token in state
        // Optionally save the token to localStorage or another secure place
        localStorage.setItem("authToken", token);
      } catch (err: any) {
        console.error("Error signing in with wallet:", err);
        setError(err.message || "Wallet sign-in failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  const addTransaction = useCallback(
    async (data: any) => {
      const response = await apiClient().post("/user/transaction", { userId: address, ...data });
      return response.data;
    },
    [apiClient, address]
  );

  const getTransactions = useCallback(
    async (walletAddress: any) => {
      const response = await apiClient().get("/user/transactions", {
        params: { userId: address, walletAddress },
      });
      return response.data;
    },
    [apiClient, address]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
  
      try {
        const response = await apiClient().post("/sign-in", { email, password });
  
        const { token, user } = response.data.payload;
  
        setToken(token); // Save the token in state
  
        // Determine the wallet type if wallets exist
        if (user.wallets && user.wallets.length > 0) {
          const wallet = user.wallets[0]; // Use the first wallet (or your preferred logic)
          setWalletType(wallet.type == "web3-wallet" ? WalletType.WEB3: WalletType.MINIMAL); // Store wallet type in state
          setAddress(wallet.address); // Store wallet address
        } else {
          setWalletType(null); // No wallet
          setAddress(null); // No wallet address
        }
      } catch (err: any) {
        console.error("Error signing in:", err);
        setError(err.message || "Sign-in failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );
  

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      walletAddress: string,
      country: string,
      state: string,
      city: string,
      address: string
    ) => {
      setLoading(true);
      setError(null);
  
      try {
        const response = await apiClient().post("/sign-up", {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          wallet_address: walletAddress,
          profile_details: {
            country,
            state,
            city,
            address,
          },
        });
  
        const { token, user } = response.data.payload;
  
        if (user.wallets?.length > 0) {
          setAddress(user.wallets[0].address); // Assuming the first wallet is the primary one
        } else {
          setAddress(walletAddress); // Fallback to the provided wallet address
        }
  
        setToken(token); // Save the token in state
      } catch (err: any) {
        console.error("Error signing up:", err);
        setError(err.message || "Sign-up failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );
  

  // Fetch account logic
  const fetchAccount = useCallback(async () => {
    if (isConnected && web3Address) {
      setAddress(web3Address);
      setWalletType(WalletType.WEB3);
      return web3Address;
    }
    const fetchedAddress = await fetchMinimalAccountFromAPI();
    if (fetchedAddress) {
      setAddress(fetchedAddress);
      setWalletType(WalletType.MINIMAL);
    }
    return fetchedAddress;
  }, [isConnected, web3Address, fetchMinimalAccountFromAPI]);


  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);


  useEffect(() => {
    fetchAccount();
    
      if (token) {
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
      }
   
  
  }, [fetchAccount,token]);

  return (
    <UserAccountContext.Provider
      value={{
        address,
        walletType,
        setToken,
        token,
        loading: loading || abstractionLoading,
        error: error || abstractionError,
        getUserProfile,
        updateUserProfile,
        submitKYC,
        getKYCStatus,
        addWallet,
        getWallets,
        createAbstractWallet,
        executeTransaction,
        addTransaction,
        getTransactions,
        walletSignIn,
        signIn,
        signUp,
        sendVerificationEmail,
        verifyCode
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
};
