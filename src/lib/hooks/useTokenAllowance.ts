import { useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";
import { useBlockContext } from "@/context/BlockContext";
import { useERC20TokenContract } from "@/hooks/useContract";

/**
 * Hook to fetch token allowance for a specific spender.
 * @param tokenAddress The address of the ERC20 token.
 * @param owner The address of the token owner.
 * @param spender The address of the spender.
 * @returns { allowance, isFetching, error }
 */
export function useTokenAllowance(
  tokenAddress: string,
  owner: string | undefined,
  spender: string | undefined,
) {
  const [allowance, setAllowance] = useState<BigNumber | undefined>(undefined);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { chainId } = useBlockContext(); // Fetch chainId from BlockContext
  const tokenContract = useERC20TokenContract(tokenAddress, true);

  useEffect(() => {
    const fetchAllowance = async () => {
      setIsFetching(true);
      setError(null);

      try {
        if (!tokenAddress || !owner || !spender || !ethers.utils.isAddress(tokenAddress)) {
          throw new Error("Invalid token address, owner, or spender address.");
        }

        if (!tokenContract) {
          throw new Error("ERC20 token contract is not connected.");
        }

        // Fetch the allowance
        const result = await tokenContract.allowance(owner, spender);
        setAllowance(BigNumber.from(result)); // Convert result to BigNumber
      } catch (err) {
        console.error("Error fetching token allowance:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsFetching(false);
      }
    };

    if (tokenAddress && owner && spender) {
      fetchAllowance();
    } else {
      setAllowance(undefined);
    }
  }, [tokenAddress, owner, spender, tokenContract]);

  return { allowance, isFetching, error };
}
