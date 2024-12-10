import { useCallback, useState } from "react";



export function useAccountAbstraction() {
  // const { provider } = useEthersProvider();

  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch Minimal Account Address from Backend API
  const fetchMinimalAccountFromAPI = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API}/fetch-minimal-account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch account");
      const { accountAddress } = await response.json();
      return accountAddress || null;
    } catch (err: any) {
      console.error("Error fetching minimal account:", err);
      setError(err.message || "Failed to fetch minimal account");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);





  // Execute a transaction via the backend

  return {
    fetchMinimalAccountFromAPI,
    loading,
    error,
  };
}
