import { useSmartAccountClientSafe } from "@/context/SmartAccountClientContext";

/**
 * @deprecated Use useSmartAccountClientContext instead
 * Legacy hook for backward compatibility
 */
export function useGasSponsoredClient() {
  const context = useSmartAccountClientSafe();

  return {
    client: context.client,
    isGasSponsored: context.isGasSponsored,
    policyId: context.policyId,
    chainId: context.chainId,
  };
}

/**
 * @deprecated Use useSmartAccountTransactions from SmartAccountClientContext instead
 * Hook specifically for gas-sponsored transactions
 * Provides enhanced error handling and fallback options
 */
export function useGasSponsoredTransactions() {
  const context = useSmartAccountClientSafe();
  const { client, isGasSponsored, policyId } = context;

  const executeTransaction = async (
    transactionData: {
      target: string;
      data: string;
      value?: bigint;
    },
    options?: {
      fallbackToUserPaid?: boolean;
    }
  ) => {
    if (!client) {
      throw new Error("Smart account client not available");
    }

    try {
      console.log("Executing transaction with gas sponsorship:", {
        isGasSponsored,
        policyId,
        target: transactionData.target,
      });

      // Send user operation with gas sponsorship (if enabled)
      if (!client?.account) {
        throw new Error('Smart account client does not have an account configured');
      }

      // Use the proper sendUserOperation method with account parameter
      const result = await client.sendUserOperation({
        account: client.account,
        uo: {
          target: transactionData.target as `0x${string}`,
          data: transactionData.data as `0x${string}`,
          value: transactionData.value || 0n,
        },
      });

      console.log("Gas-sponsored transaction successful:", result);
      return result;
    } catch (error) {
      console.error("Gas-sponsored transaction failed:", error);

      // If gas sponsorship fails and fallback is enabled, try without sponsorship
      if (options?.fallbackToUserPaid && isGasSponsored) {
        console.log("Attempting fallback to user-paid transaction...");
        
        try {
          // Create a new client without gas sponsorship for fallback
          // This would require additional implementation based on your needs
          throw new Error("Fallback to user-paid transactions not implemented yet");
        } catch (fallbackError) {
          console.error("Fallback transaction also failed:", fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  };

  return {
    client,
    executeTransaction,
    isGasSponsored,
    policyId,
  };
}
