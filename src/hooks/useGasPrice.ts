import { useMemo } from "react";
import { Contract } from "ethers";
import JSBI from "jsbi";

import { useSingleCallResult } from "@/lib/hooks/multicall";

import { useContract } from "./useContract";
import useENSAddress from "./useENSAddress";
import { useAccount } from "wagmi";

const CHAIN_DATA_ABI = [
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * Returns the price of 1 gas in WEI for the currently selected network using the chainlink fast gas price oracle
 */
export default function useGasPrice(skip = false): JSBI | undefined {
  const { address } = useENSAddress("fast-gas-gwei.data.eth");
  const { chainId } = useAccount();
  const contract = useContract(address ?? undefined, CHAIN_DATA_ABI, false) as Contract | null;

  const resultStr = useSingleCallResult(
    skip ? undefined : contract,
    "latestAnswer",
    [],
  ).result?.[0]?.toString();
  return useMemo(
    () => (typeof resultStr === "string" ? JSBI.BigInt(resultStr) : undefined),
    [resultStr],
  );
}
