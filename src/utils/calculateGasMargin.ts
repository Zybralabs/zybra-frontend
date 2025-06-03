import { BigNumber } from "@ethersproject/bignumber";

import { useEthersProvider } from "@/hooks/useContract";

/**
 * Calculates the gas value with a margin based on real-time gas price.
 * @param gasLimit The estimated gas limit for the transaction.
 * @param marginPercentage The percentage to add as a margin (default is 20%).
 */
export function useCalculateGasMargin() {
  const provider = useEthersProvider(); // Use provider from hook

  const calculateGasMargin = async (
    gasLimit: BigNumber,
    marginPercentage: number = 20,
  ): Promise<BigNumber> => {
    if (!provider) {
      throw new Error("No provider available to fetch gas price.");
    }

    try {
      // Fetch the current gas price from the provider
      const gasPrice = (await provider.getFeeData()).gasPrice;

      // Calculate the total gas cost (gasLimit * gasPrice)
      const totalGasCost = gasLimit.mul(gasPrice ?? "0");

      // Add the margin
      const margin = totalGasCost.mul(marginPercentage).div(100);

      // Return the gas limit with margin
      return gasLimit.add(margin);
    } catch (error) {
      console.error("Error fetching gas price:", error);
      throw new Error("Failed to calculate gas margin");
    }
  };

  return calculateGasMargin;
}
