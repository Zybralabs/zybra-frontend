import { useMemo } from "react";

import {
  UseAccountReturnType as UseAccountReturnTypeWagmi,
  useAccount as useAccountWagmi,
  useChainId,
} from "wagmi";

import { WalletType } from "@/constant/account/enum";
import type { ChainId } from "@/constant/addresses";

import { useSupportedChainId } from "./useChain";

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, "chainId"> & { chainId: ChainId | undefined }
  : T extends { chainId: number | undefined }
    ? Omit<T, "chainId"> & { chainId: ChainId | undefined }
    : T;

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi> & {
  isConnected: boolean;
  walletType: WalletType | null;
};

export function useAccount(): UseAccountReturnType {
  const { chainId, ...rest } = useAccountWagmi(); // wagmi hook to get web3 wallet info
  const fallbackChainId = useChainId();
  const supportedChainId = useSupportedChainId(chainId ?? fallbackChainId);

  const isConnected = !!rest?.address; // Check if a web3 wallet is connected
  const walletType = isConnected ? WalletType.WEB3 : null;

  return useMemo(
    () => ({
      ...rest,
      chainId: supportedChainId,
      isConnected,
      walletType,
    }),
    [rest, supportedChainId, isConnected],
  );
}
