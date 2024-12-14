import { useMemo } from "react";


import { useCentrifugeVaultContract, useERC20TokenContract, VaultType } from "@/hooks/useContract";

import { useMultipleContractSingleData } from "./multicall";

/**
 * Hook to fetch tranche details (name, symbol, price) for Centrifuge vaults.
 * @param vaultAddress The address of the Centrifuge vault.
 * @returns Tranche details including name, symbol, and price.
 */
export function useCentrifugeTrancheDetails(vaultAddress: string) {
  //@ts-expect-error
  const vaultContract = useCentrifugeVaultContract(vaultAddress, true);
  //@ts-expect-error

  const { data: trancheData } = useMultipleContractSingleData(
    [
      { contract: vaultContract, methodName: "poolId", callInputs: [] },
      { contract: vaultContract, methodName: "trancheId", callInputs: [] },
      { contract: vaultContract, methodName: "asset", callInputs: [] },
    ],
    vaultContract?.address,
  );

  const trancheAssetAddress = trancheData?.[2]?.result || null;

  const trancheTokenContract = useERC20TokenContract(trancheAssetAddress, true);
  //@ts-expect-error

  const { data: trancheTokenData } = useMultipleContractSingleData(
    [
      { contract: trancheTokenContract, methodName: "name", callInputs: [] },
      { contract: trancheTokenContract, methodName: "symbol", callInputs: [] },
    ],
    trancheTokenContract?.address,
  );

  return useMemo(() => {
    if (!trancheData || !trancheTokenData) return null;

    return {
      poolId: trancheData[0]?.result || "",
      trancheId: trancheData[1]?.result || "",
      asset: trancheAssetAddress || "",
      name: trancheTokenData[0]?.result || "",
      symbol: trancheTokenData[1]?.result || "",
    };
  }, [trancheData, trancheTokenData, trancheAssetAddress]);
}

/**
 * Hook to fetch token details (name, symbol, balance) for Swarm vaults.
 * @param tokenAddress The address of the ERC20 token.
 * @param account The user's account address.
 * @returns Token details including name, symbol, and balance.
 */
export function useSwarmTokenDetails(tokenAddress: string, account: string) {
  const tokenContract = useERC20TokenContract(tokenAddress, true);
  //@ts-expect-error

  const { data: tokenData } = useMultipleContractSingleData(
    [
      { contract: tokenContract, methodName: "name", callInputs: [] },
      { contract: tokenContract, methodName: "symbol", callInputs: [] },
      { contract: tokenContract, methodName: "balanceOf", callInputs: [account] },
    ],
    tokenContract?.address,
  );

  return useMemo(() => {
    if (!tokenData) return null;

    return {
      name: tokenData[0]?.result || "",
      symbol: tokenData[1]?.result || "",
      balance: tokenData[2]?.result || "0",
    };
  }, [tokenData]);
}

/**
 * Unified hook to fetch data for vaults.
 * @param vaultType The type of the vault (Centrifuge or Swarm).
 * @param address The address of the vault or token.
 * @param account The user's account address (required for Swarm).
 * @returns Relevant data based on the vault type.
 */
export function useVaultData(vaultType: VaultType, address: string, account?: string) {
  const data = useMemo(() => {
    if (vaultType === VaultType.CENTRIFUGE_VAULT) {
      return useCentrifugeTrancheDetails(address);
    } else if (vaultType === VaultType.SWARM_VAULT && account) {
      return useSwarmTokenDetails(address, account);
    }
    return null;
  }, [vaultType, address, account]);

  return data;
}
