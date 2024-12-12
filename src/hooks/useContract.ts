import { useMemo } from "react";

import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";

// eslint-disable-next-line import/order
// import { logger } from './utilities/logger'; // Replace with your logger utility

// ABIs
import { usePublicClient, useWalletClient } from "wagmi";


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



export function useEthersProvider(): Web3Provider | null {
  const walletClient = useWalletClient(); // Wallet client (contains signer details)
  const publicClient = usePublicClient(); // Public client for read-only access

  return useMemo(() => {
    // Prefer walletClient if available
    if (walletClient?.data) {
      const ethereumProvider = walletClient.data as any; // Cast to Ethereum provider compatible with Web3Provider
      return new Web3Provider(ethereumProvider);
    }

    // Fallback to publicClient
    if (publicClient) {
      const ethereumProvider = publicClient as any; // Cast to Ethereum provider compatible with Web3Provider
      return new Web3Provider(ethereumProvider);
    }

    return null; // Return null if neither wallet nor public client is available
  }, [walletClient?.data, publicClient]);
}



// Generalized useContract Hook
export function useContract<T extends Contract = Contract>(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true
): T | null {
  const provider = useEthersProvider();

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
    withSignerIfPossible
  ); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useERC7540VaultContract(
  address: string,
  withSignerIfPossible = true
) {
  return useContract(address, ERC7540ABI, withSignerIfPossible); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useSwarmVaultContract(withSignerIfPossible = true, chainId: number) {
  return useContract(
    SWARM_VAULT_ADDRESS[chainId ?? ChainId.Testnet],
    SwarmVaultBaseABI,
    withSignerIfPossible,
    
  );
}

// Tranche Asset Contract Hook
export function useTrancheAssetContract(
  address: string,
  withSignerIfPossible = true
) {
  return useContract(address, TrancheAssetABI, withSignerIfPossible);
}

// ERC20 Token Contract Hook
export function useERC20TokenContract(
  address: string,
  withSignerIfPossible = true
) {
  return useContract(address, ERC20ABI, withSignerIfPossible);
}

// NFT Contract Hook
export function useNFTContract(address: string, withSignerIfPossible = true, chainId?: number) {
  return useContract(address, NFTABI, withSignerIfPossible);
}

// Existing Hooks for Other Contracts
export function useZybraConfiguratorContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZYBRA_CONFIGURATOR_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    ZybraConfiguratorABI,
    withSignerIfPossible,
    
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
    
  );
}

export function useMulticall(withSignerIfPossible = true, chainId?: number): Contract | null {
  const address = chainId ? MULTICALL_ADDRESS[chainId] : undefined;

  return useContract(
    address,
    MulticallABI,
    withSignerIfPossible, // Default to Testnet if chainId is undefined
  );
}

export function useInvestmentManagerContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? INVESTMENT_MANAGER_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    InvestmentManagerABI,
    withSignerIfPossible,
    
  );
}

export function useZFIStakingContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZFI_STAKING_ADDRESS[chainId ?? ChainId.Testnet] : undefined,
    ZfiStakingABI,
    withSignerIfPossible,
    
  );
}



export function useAbstractEntryPointContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ABSTRACTION_ENTRY_POINT[chainId ?? ChainId.Testnet] : undefined,
    EntryPointABI,
    withSignerIfPossible,
    
  );
}

export function useAbstractionAccountContract(
  address: string,
  withSignerIfPossible = true
) {
  return useContract(address, AccountAbstractionABI, withSignerIfPossible);
}
