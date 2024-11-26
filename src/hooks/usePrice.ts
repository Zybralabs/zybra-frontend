import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContract } from "./useContract"; // Custom hook for connecting contracts

// Constants
const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter contract address
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eB48"; // Mainnet USDC address

/**
 * Hook to fetch the price of a token against USDC using Uniswap V3 Quoter.
 * @param tokenAddress Address of the token to fetch the price for.
 * @param tokenDecimals Number of decimals for the token.
 * @returns Token price in USDC, loading state, and error if any.
 */
export function useTokenPrice(tokenAddress: string, tokenDecimals: number) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const quoterContract = useContract(QUOTER_ADDRESS, QuoterABI, false);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!ethers.utils.isAddress(tokenAddress)) {
          throw new Error("Invalid token address");
        }

        if (!quoterContract) {
          throw new Error("Uniswap Quoter contract not connected");
        }

        // Define pool fee tier (e.g., 0.3% pool)
        const FEE_TIER = 3000;

        // 1 token equivalent in Wei
        const tokenAmountInWei = ethers.utils.parseUnits("1", tokenDecimals);

        // Get price quote from Uniswap Quoter
        const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
          tokenAddress,
          USDC_ADDRESS,
          FEE_TIER,
          tokenAmountInWei,
          0
        );

        // Convert quoted amount (in USDC's decimals)
        const priceInUSDC = ethers.utils.formatUnits(quotedAmountOut, 6);

        setPrice(parseFloat(priceInUSDC));
      } catch (err) {
        console.error("Failed to fetch token price:", err);
        setError("Failed to fetch token price.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenPrice();
  }, [tokenAddress, tokenDecimals, quoterContract]);

  return { price, loading, error };
}
