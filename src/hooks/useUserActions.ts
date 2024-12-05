import { useCallback } from "react";
import axios from "axios";
import { useBlockContext } from "../context/BlockContext"; // BlockContext
import { useUserAccount } from "../context/UserAccountContext"; // UserAccountContext

// Define the base API URL
const API_BASE_URL = process.env.REACT_APP_ZYBRA_BASE_API_URL || "";

interface UseUserActions {
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
}

export function useUserActions(): UseUserActions {
  const { latestBlock } = useBlockContext(); // Blockchain context data
  const {address,walletType } = useUserAccount(); // User context data

  const apiClient = useCallback(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`, // Use token from UserAccountContext
      },
    });
  }, [token]);

  const getUserProfile = useCallback(async () => {
    const response = await apiClient().get("/user/profile", {
      params: { userId: user?.id },
    });
    return response.data;
  }, [apiClient, user]);

  const updateUserProfile = useCallback(
    async (data) => {
      const response = await apiClient().put("/user/profile", {
        ...data,
        userId: user?.id,
      });
      return response.data;
    },
    [apiClient, user]
  );

  const submitKYC = useCallback(
    async (data) => {
      const response = await apiClient().post("/user/kyc", {
        ...data,
        userId: user?.id,
      });
      return response.data;
    },
    [apiClient, user]
  );

  const getKYCStatus = useCallback(async () => {
    const response = await apiClient().get("/user/kyc", {
      params: { userId: user?.id },
    });
    return response.data;
  }, [apiClient, user]);

  const addWallet = useCallback(
    async (walletAddress) => {
      const response = await apiClient().post("/user/wallet", {
        userId: user?.id,
        walletAddress,
      });
      return response.data;
    },
    [apiClient, user]
  );

  const getWallets = useCallback(async () => {
    const response = await apiClient().get("/user/wallets", {
      params: { userId: user?.id },
    });
    return response.data;
  }, [apiClient, user]);

  const createAbstractWallet = useCallback(async () => {
    const response = await apiClient().post("/user/wallet/abstract", {
      userId: user?.id,
    });
    return response.data;
  }, [apiClient, user]);

  const executeTransaction = useCallback(
    async (data) => {
      const response = await apiClient().post("/user/transaction/execute", {
        userId: user?.id,
        ...data,
      });
      return response.data;
    },
    [apiClient, user]
  );

  const addTransaction = useCallback(
    async (data) => {
      const response = await apiClient().post("/user/transaction", {
        userId: user?.id,
        ...data,
      });
      return response.data;
    },
    [apiClient, user]
  );

  const getTransactions = useCallback(
    async (walletAddress) => {
      const response = await apiClient().get("/user/transactions", {
        params: { userId: user?.id, walletAddress },
      });
      return response.data;
    },
    [apiClient, user]
  );

  return {
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
  };
}
