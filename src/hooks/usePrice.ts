import { useEffect, useState } from "react";

import { ethers } from "ethers";

import { SupportedChainId, USDC_ADDRESS } from "@/constant/addresses";
import { useBlockContext } from "@/context/BlockContext";

import { useUniswapQouter } from "./useContract"; // Custom hook for connecting contracts
import { useChainId } from "wagmi";

// Constants

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
  const chainId = useChainId()
  const quoterContract = useUniswapQouter(chainId?? SupportedChainId.Testnet);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!ethers.isAddress(tokenAddress)) {
          throw new Error("Invalid token address");
        }

        if (!quoterContract) {
          throw new Error("Uniswap Quoter contract not connected");
        }

        // Define pool fee tier (e.g., 0.3% pool)
        const FEE_TIER = 3000;

        // 1 token equivalent in Wei
        const tokenAmountInWei = ethers.parseUnits("1", tokenDecimals);

        // Get price quote from Uniswap Quoter
        const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
          tokenAddress,
          USDC_ADDRESS[chainId?? SupportedChainId.Testnet],
          FEE_TIER,
          tokenAmountInWei,
          0,
        );

        // Convert quoted amount (in USDC's decimals)
        const priceInUSDC = ethers.formatUnits(quotedAmountOut, 6);

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
