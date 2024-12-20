import React, { createContext, useContext, useState, useCallback, useEffect, type SetStateAction, type Dispatch } from "react";

import axios from "axios";

import { WalletType } from "@/constant/account/enum";
import type { TransactionData } from "@/types";

import { useAccount } from "../hooks/useAccount";
import { useAccountAbstraction } from "../hooks/useAccountAbstraction";

interface UserAccountContextProps {
  address: string | undefined;
  walletType: WalletType | null;
  token: string | null;
  user: string | null;
  setUser:Dispatch<SetStateAction<number>>;
  loading: boolean;
  error: string | null;
  // API actions
  getUserProfile: () => Promise<any>;
  updateUserProfile: (data: {
    first_name?: string;
    last_name?: string;
    profile_details?: object;
  }) => Promise<any>;
  submitKYC: (data: {
    document_type: string;
    document_number: string;
    document_image: string;
  }) => Promise<any>;
  getKYCStatus: () => Promise<any>;
  addWallet: (walletAddress: string) => Promise<any>;
  getWallets: () => Promise<any>;
  createAbstractWallet: () => Promise<any>;
  executeTransaction: (data: {
    dest: string;
    calldata: string;
    asset: string;
    amount: number;
  }) => Promise<any>;
  addTransaction: (data: TransactionData) => Promise<any>;
  getTransactions: (walletAddress?: string) => Promise<any>;
  walletSignIn: (walletAddress: string) => Promise<void>;
  getUserAssetsAndPoolsHoldings: (walletAddress: string) => Promise<{
    assets: Array<{
      assetId: string;
      name: string;
      symbol: string;
      totalAmount: number;
      totalLzybraBorrowed: number;
    }>;
    pools: Array<{
      poolId: string;
      name: string;
      totalAmount: number;
      totalLzybraBorrowed: number;
    }>;
  }>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    walletAddress: string
  ) => Promise<void>;
  verifyCode: (email: string, code: number) => Promise<void>;

  sendVerificationEmail: (email: string) => Promise<void>;
}

const UserAccountContext = createContext<UserAccountContextProps>({
  address: "",
  walletType: null,
  token: null,
  user: null,
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
  getUserAssetsAndPoolsHoldings: async () => {
    throw new Error("UserAccountContext not initialized");
  },
  setUser: async () => {
    throw new Error("UserAccountContext not initialized");
  }
});

export const useUserAccount = () => useContext(UserAccountContext);

export const UserAccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: web3Address, isConnected } = useAccount();
  const {
    fetchMinimalAccountFromAPI,
    loading: abstractionLoading,
    error: abstractionError,
  } = useAccountAbstraction();

  const [address, setAddress] = useState<string>();
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_ZYBRA_BASE_API_URL || "";

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
    [apiClient, address],
  );

  const submitKYC = useCallback(
    async (data: any) => {
      const response = await apiClient().post("/user/kyc", { ...data, userId: address });
      return response.data;
    },
    [apiClient, address],
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
    [apiClient, address],
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
      const response = await apiClient().post("/user/transaction/execute", {
        userId: address,
        ...data,
      });
      return response.data;
    },
    [apiClient, address],
  );

  const sendVerificationEmail = useCallback(async (email: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/send-verification-email`, { email });
      return response.data;
    } catch (err) {
      console.error("Error sending verification email:", err);
      // throw new Error(err?.response?.data?.message || "Failed to send verification email");
    }
  }, []);

  const verifyCode = useCallback(async (email: string, code: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-code`, { email, code });
      return response.data;
    } catch (err) {
      console.error("Error verifying code:", err);
      // throw new Error(err.response?.data?.message || "Verification failed");
    }
  }, []);

  const walletSignIn = useCallback(
    async (walletAddress: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient().post("/wallet-sign-in", { walletAddress });

        setUser(response.data)
        setAddress(web3Address);
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
    [apiClient],
  );

  const addTransaction = useCallback(
    async (data: TransactionData) => {
      // Validate required parameters
      if (!data.type) {
        throw new Error("Transaction type is required.");
      }
      if (!data.amount || data.amount <= 0) {
        throw new Error("Transaction amount must be greater than zero.");
      }
      if (!data.asset) {
        throw new Error("Asset is required.");
      }

      // Additional validation for deposit/withdraw type transactions
      if (["deposit", "withdraw"].includes(data.type) && !data.lzybra_borrowed) {
        throw new Error("Lzybra borrowed is required for deposit or withdraw transactions.");
      }

      // Make the API request
      const response = await apiClient().post("/user/transaction", {
        userId: address, // Ensure userId is passed
        ...data,
      });

      return response.data;
    },
    [apiClient, address],
  );

  const getUserAssetsAndPoolsHoldings = useCallback(async (): Promise<{
    assets: Array<{
      assetId: string;
      name: string;
      symbol: string;
      totalAmount: number;
      totalLzybraBorrowed: number;
    }>;
    pools: Array<{
      poolId: string;
      name: string;
      totalAmount: number;
      totalLzybraBorrowed: number;
    }>;
  }> => {
    if (!address) {
      throw new Error("User address is required to fetch assets and pools.");
    }

    const response = await apiClient().get("/user/assets-pools-holdings", {
      params: { userId: address }, // Pass user ID to the backend
    });

    const { assets, pools } = response.data.payload;

    // Normalize and ensure all required fields are included
    const formattedAssets = assets.map((asset: any) => ({
      assetId: asset._id,
      name: asset.name,
      symbol: asset.symbol,
      totalAmount: asset.totalAmount,
      totalLzybraBorrowed: asset.totalLzybraBorrowed,
    }));

    const formattedPools = pools.map((pool: any) => ({
      poolId: pool._id,
      name: pool.name,
      totalAmount: pool.totalAmount,
      totalLzybraBorrowed: pool.totalLzybraBorrowed,
    }));

    return { assets: formattedAssets, pools: formattedPools };
  }, [apiClient, address]);

  const getTransactions = useCallback(
    async (walletAddress: any) => {
      const response = await apiClient().get("/user/transactions", {
        params: { userId: address, walletAddress },
      });
      return response.data;
    },
    [apiClient, address],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient().post("/sign-in", { email, password });

        const { token, user } = response.data.payload;

        setToken(token); // Save the token in state
        setUser(user)

        // Determine the wallet type if wallets exist
        if (user.wallets && user.wallets.length > 0) {
          const wallet = user.wallets[0]; // Use the first wallet (or your preferred logic)
          setWalletType(wallet.type == "web3-wallet" ? WalletType.WEB3 : WalletType.MINIMAL); // Store wallet type in state
          setAddress(wallet.address); // Store wallet address
        } else {
          setWalletType(null); // No wallet
          setAddress(undefined); // No wallet address
        }
      } catch (err: any) {
        console.error("Error signing in:", err);
        setError(err.message || "Sign-in failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const signUp = useCallback(
    async (
      email: string,
      firstName: string,
      type: "social" | "email",
      lastName?: string,
      password?: string,
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient().post("/sign-up", {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          wallet_address: web3Address,
          type
        });

        const { token, user } = response.data.payload;
        setAddress(web3Address); // Fallback to the provided wallet address
        setToken(token); // Save the token in state
        setUser(user); // Save the token in state
      } catch (err: any) {
        console.error("Error signing up:", err);
        setError(err.message || "Sign-up failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  // Fetch account logic
  const fetchAccount = useCallback(async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("authToken");
  
      if (!token) {
        console.warn("No token found in localStorage.");
        setUser(null);
        setAddress(null);
        setWalletType(null);
        return null;
      }
  
      // Fetch user info and wallet data from the API
      const response = await apiClient().get("/user-info", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      // If the API call fails
      if (!response || response.status !== 200 || !response.data.success) {
        console.error("Failed to fetch user info:", response?.statusText);
        setUser(null);
        setAddress(null);
        setWalletType(null);
        return null;
      }
  
      const { payload: userResponse } = response.data;
  
      if (!userResponse || !userResponse.wallet) {
        console.warn("Invalid response or missing wallet information.");
        setUser(null);
        setAddress(null);
        setWalletType(null);
        return null;
      }
  
      // Save user and wallet details in the state
      setUser(userResponse);
      const { wallet } = userResponse;
      setAddress(wallet.address);
      setWalletType(wallet.type === "web3-wallet" ? WalletType.WEB3 : WalletType.MINIMAL);
  
      console.log(`User and Wallet Loaded: ${userResponse.first_name} - ${wallet.type}: ${wallet.address}`);
      return userResponse;
    } catch (error) {
      console.error("Error fetching account:", error);
      setUser(null);
      setAddress(null);
      setWalletType(null);
      return null;
    }
  }, [apiClient]);
  

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
  }, [fetchAccount, token]);

  return (
    <UserAccountContext.Provider
      value={{
        address: web3Address,
        walletType,
        token,
        loading: loading || abstractionLoading,
        error: error || abstractionError,
        getUserProfile,
        updateUserProfile,
        submitKYC,
        getKYCStatus,
        addWallet,
        getWallets,
        user, setUser,
        createAbstractWallet,
        executeTransaction,
        addTransaction,
        getTransactions,
        walletSignIn,
        signIn,
        signUp,
        sendVerificationEmail,
        getUserAssetsAndPoolsHoldings,
        verifyCode,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
};
