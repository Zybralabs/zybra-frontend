import { useMemo } from "react";

import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";

// eslint-disable-next-line import/order
// import { logger } from './utilities/logger'; // Replace with your logger utility

// ABIs
import { usePublicClient } from "wagmi";


import AccountAbstractionABI from "../abis/AccountAbstraction.json"; // ABI for Uniswap V3 Quoter
import CentrifugeRouterABI from "../abis/CentrifugeRouter.json";
import CentrifugeVaultABI from "../abis/CentrifugeZybraVault.json";
import ENS_PUBLIC_RESOLVER_ABI from "../abis/ens-public-resolver.json";
import ENS_ABI from "../abis/ens-registrar.json";
import EntryPointABI from "../abis/EntryPoint.json"; // ABI for Uniswap V3 Quoter
import ERC20ABI from "../abis/ERC20.json";
import ERC7540ABI from "../abis/ERC7540.json";
import InvestmentManagerABI from "../abis/InvestmentManager.json";
import MulticallABI from "../abis/multicall.json"; // ABI for Uniswap V3 Quoter
import NFTABI from "../abis/NFT.json";
import SwarmVaultBaseABI from "../abis/SwarmZybraVault.json";
import TrancheAssetABI from "../abis/TrancheAsset.json";
import QuoterABI from "../abis/UniswapV3Quoter.json"; // ABI for Uniswap V3 Quoter
import ZfiStakingABI from "../abis/ZfiStaking.json";
import ZybraConfiguratorABI from "../abis/ZybraConfigurator.json";
// Contract Addresses
import {
  ZYBRA_CONFIGURATOR_ADDRESS,
  CENTRIFUGE_ROUTER_ADDRESS,
  INVESTMENT_MANAGER_ADDRESS,
  SWARM_VAULT_ADDRESS,
  ZFI_STAKING_ADDRESS,
  ENS_REGISTRAR_ADDRESSES,
  ChainId,
  CENTRIFUGE_VAULT_ADDRESS,
  QOUTER_ADDRESS,
  MULTICALL_ADDRESS,
  ABSTRACTION_ENTRY_POINT,
} from "../constant/addresses";

// Enum for Vault Types
export enum VaultType {
  SWARM_VAULT = "SWARM_VAULT",
  CENTRIFUGE_VAULT = "CENTRIFUGE_VAULT",
}

// Hook to get Ethers.js provider
export function useEthersProvider(chainId: number): Web3Provider | null {
  const provider = usePublicClient({ chainId }); // Pass chainId to getPublicClient

  return useMemo(() => {
    if (!provider) {
      return null;
    }
    return new Web3Provider(provider as any); // Ensure compatibility with Ethers.js
  }, [provider, chainId]);
}



// Generalized useContract Hook
export function useContract<T extends Contract = Contract>(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
  chainId?: number,
): T | null {
  const provider = useEthersProvider(chainId ?? ChainId.Testnet);

  return useMemo(() => {
    if (!address || !ABI || !provider) return null;

    try {
      return new Contract(address, ABI, withSignerIfPossible ? provider.getSigner() : provider);
    } catch (error) {
      logger.warn("useContract", "Failed to initialize contract", {
        error,
        address,
      });
      return null;
    }
  }, [address, ABI, provider, withSignerIfPossible]) as T;
}

// Vault Contract Hook
export function useCentrifugeVaultContract(withSignerIfPossible = true, chainId: number) {
  return useContract(
    CENTRIFUGE_VAULT_ADDRESS[chainId ?? ChainId.Testnet],
    CentrifugeVaultABI,
    withSignerIfPossible,
    chainId,
  ); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useERC7540VaultContract(
  address: string,
  withSignerIfPossible = true,
  chainId: number,
) {
  return useContract(address, ERC7540ABI, withSignerIfPossible, chainId); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useSwarmVaultContract(withSignerIfPossible = true, chainId: number) {
  return useContract(
    SWARM_VAULT_ADDRESS[chainId ?? ChainId.Testnet],
    SwarmVaultBaseABI,
    withSignerIfPossible,
    chainId,
  );
}

// Tranche Asset Contract Hook
export function useTrancheAssetContract(
  address: string,
  withSignerIfPossible = true,
  chainId?: number,
) {
  return useContract(address, TrancheAssetABI, withSignerIfPossible, chainId);
}

// ERC20 Token Contract Hook
export function useERC20TokenContract(
  address: string,
  withSignerIfPossible = true,
  chainId?: number,
) {
  return useContract(address, ERC20ABI, withSignerIfPossible, chainId);
}

// NFT Contract Hook
export function useNFTContract(address: string, withSignerIfPossible = true, chainId?: number) {
  return useContract(address, NFTABI, withSignerIfPossible, chainId);
}

// Existing Hooks for Other Contracts
export function useZybraConfiguratorContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZYBRA_CONFIGURATOR_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    ZybraConfiguratorABI,
    withSignerIfPossible,
    chainId,
  );
}

export function useENSRegistrarContract() {
  return useContract(ENS_REGISTRAR_ADDRESSES[ChainId.Mainnet], ENS_ABI);
}

export function useENSResolverContract(address: string | undefined) {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI);
}

export function useUniswapQouter(chainId: number) {
  return useContract(QOUTER_ADDRESS[chainId ?? ChainId.Testnet], QuoterABI,true, chainId);
}

export function useCentrifugeRouterContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? CENTRIFUGE_ROUTER_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    CentrifugeRouterABI,
    withSignerIfPossible,
    chainId,
  );
}

export function useMulticall(withSignerIfPossible = true, chainId?: number): Contract | null {
  const address = chainId ? MULTICALL_ADDRESS[chainId] : undefined;

  return useContract(
    address,
    MulticallABI,
    withSignerIfPossible,
    chainId ?? ChainId.Testnet, // Default to Testnet if chainId is undefined
  );
}

export function useInvestmentManagerContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? INVESTMENT_MANAGER_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    InvestmentManagerABI,
    withSignerIfPossible,
    chainId,
  );
}

export function useZFIStakingContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZFI_STAKING_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    ZfiStakingABI,
    withSignerIfPossible,
    chainId,
  );
}



export function useAbstractEntryPointContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ABSTRACTION_ENTRY_POINT[chainId ?? ChainId.Testnet] : undefined,
    EntryPointABI,
    withSignerIfPossible,
    chainId,
  );
}

export function useAbstractionAccountContract(
  address: string,
  withSignerIfPossible = true,
  chainId?: number,
) {
  return useContract(address, AccountAbstractionABI, withSignerIfPossible, chainId);
}
