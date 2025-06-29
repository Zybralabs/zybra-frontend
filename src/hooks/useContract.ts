import { useMemo } from "react";

import { Contract } from "@ethersproject/contracts";


// eslint-disable-next-line import/order
// import { logger } from './utilities/logger'; // Replace with your logger utility

// ABIs
import { useAccount, useChainId, useConnectorClient, usePublicClient, useWalletClient } from "wagmi";

import AccountAbstractionABI from "../abis/AccountAbstraction.json"; // ABI for Uniswap V3 Quoter
import CentrifugeRouterABI from "../abis/CentrifugeRouter.json";
import CentrifugeVaultABI from "../abis/CentrifugeZybraVault.json";
import ENS_PUBLIC_RESOLVER_ABI from "../abis/ens-public-resolver.json";
import ERC20_BYTES32_ABI from "../abis/erc20_bytes32.json";
import ENS_ABI from "../abis/ens-registrar.json";
import EntryPointABI from "../abis/EntryPoint.json"; // ABI for Uniswap V3 Quoter
import ERC20ABI from "../abis/ERC20.json";
import ERC7540ABI from "../abis/ERC7540.json";
import InvestmentManagerABI from "../abis/InvestmentManager.json";
import MulticallABI from "../abis/multicall.json"; // ABI for Uniswap V3 Quoter
import NFTABI from "../abis/NFT.json";
import SwarmVaultBaseABI from "../abis/SwarmZybraVault.json";
import Dotcv2ABI from "../abis/Dotcv2.json";
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
  SupportedChainId,
  CENTRIFUGE_VAULT_ADDRESS,
  QOUTER_ADDRESS,
  MULTICALL_ADDRESS,
  DOTCV2_ADDRESS,
} from "../constant/addresses";
import { useWeb3React } from "@web3-react/core";
import { getContract } from "@/utils";
import { RPC_PROVIDERS } from "@/constant/constant";
import { useUserAccount } from "@/context/UserAccountContext";

// Enum for Vault Types
export enum VaultType {
  SWARM_VAULT = "SWARM_VAULT",
  CENTRIFUGE_VAULT = "CENTRIFUGE_VAULT",
}

import { BrowserProvider, FallbackProvider, JsonRpcProvider, JsonRpcSigner } from 'ethers'
import type { Account, Chain, Client, Transport } from 'viem'
import { type Config, useClient } from 'wagmi'

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  return new JsonRpcProvider(transport.url, network)
}

/** Action to convert a viem Client to an ethers.js Provider. */


/** Action to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId })
  return (client ? clientToProvider(client) : undefined)
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new BrowserProvider(transport, network)
  const signer = new JsonRpcSigner(provider, account?.address)
  return signer
}


/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  console.log({ client })
  return (client ? clientToSigner(client) : undefined)
}


// Generalized useContract Hook
export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  withSignerIfPossible = true,
): Contract | T | null {
  const chainId = useChainId();

  const { address: account } = useUserAccount();
  // const Etherprovider = useEthersProvider({ chainId });
  const provider =   RPC_PROVIDERS[(chainId ?? SupportedChainId.Testnet) as SupportedChainId];
  if (!addressOrAddressMap || !ABI || !provider || !chainId) return null;
  let address: string | undefined;
  if (typeof addressOrAddressMap === "string") address = addressOrAddressMap;
  else address = addressOrAddressMap[chainId];
    if (!address) return null;
    console.log(address,
      ABI,
      provider,
      account ? account : undefined,
      chainId)
    try {
      return getContract(
        address,
        ABI,
        //@ts-ignore
        provider,
        account ? account : undefined,
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }

}
// Vault Contract Hook
export function useCentrifugeVaultContract(withSignerIfPossible = true, chainId: number) {
  return useContract(
    CENTRIFUGE_VAULT_ADDRESS[chainId ?? SupportedChainId.Testnet],
    CentrifugeVaultABI,
    withSignerIfPossible,
  ); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useERC7540VaultContract(address: string, withSignerIfPossible = true) {
  return useContract(address, ERC7540ABI, withSignerIfPossible); // Assuming Swarm uses the same ABI as ERC7540Vault;
}

export function useSwarmVaultContract(withSignerIfPossible = true, chainId: number) {
  return useContract(
    SWARM_VAULT_ADDRESS[chainId ?? SupportedChainId.Testnet],
    SwarmVaultBaseABI,
    withSignerIfPossible,
  );
}

export function useDotVc2(withSignerIfPossible = true, chainId: number) {
  return useContract(
    DOTCV2_ADDRESS[chainId ?? SupportedChainId.Testnet],
    Dotcv2ABI,
    withSignerIfPossible,
  );
}
// Tranche Asset Contract Hook
export function useTrancheAssetContract(address: string, withSignerIfPossible = true) {
  return useContract(address, TrancheAssetABI, withSignerIfPossible);
}

// ERC20 Token Contract Hook
export function useERC20TokenContract(address: string | undefined, withSignerIfPossible = true) {
  return useContract(address, ERC20ABI, withSignerIfPossible);
}

// NFT Contract Hook
export function useNFTContract(address: string, withSignerIfPossible = true) {
  return useContract(address, NFTABI, withSignerIfPossible);
}

// Existing Hooks for Other Contracts
export function useZybraConfiguratorContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZYBRA_CONFIGURATOR_ADDRESS[chainId ?? SupportedChainId.Testnet] : undefined,
    ZybraConfiguratorABI,
    withSignerIfPossible,
  );
}

export function useENSRegistrarContract() {
  return useContract(ENS_REGISTRAR_ADDRESSES[SupportedChainId.Mainnet], ENS_ABI);
}

export function useENSResolverContract(address: string | undefined) {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI);
}

export function useUniswapQouter(chainId: number) {
  return useContract(QOUTER_ADDRESS[chainId ?? SupportedChainId.Testnet], QuoterABI, true);
}

export function useCentrifugeRouterContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? CENTRIFUGE_ROUTER_ADDRESS[chainId ?? SupportedChainId.Testnet] : undefined,
    CentrifugeRouterABI,
    withSignerIfPossible,
  );
}

export function useBytes32TokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean,
): Contract | null | undefined {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible);
}

export function useMulticall(withSignerIfPossible = true, chainId?: number) {
  const address = chainId ? MULTICALL_ADDRESS[chainId] : undefined;

  return useContract(
    address,
    MulticallABI,
    withSignerIfPossible, // Default to Testnet if chainId is undefined
  );
}

export function useInvestmentManagerContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? INVESTMENT_MANAGER_ADDRESS[chainId ?? SupportedChainId.Testnet] : undefined,
    InvestmentManagerABI,
    withSignerIfPossible,
  );
}

export function useZFIStakingContract(withSignerIfPossible = true, chainId?: number) {
  return useContract(
    chainId ? ZFI_STAKING_ADDRESS[chainId as SupportedChainId] : ZFI_STAKING_ADDRESS[SupportedChainId.Testnet],
    ZfiStakingABI,
    withSignerIfPossible,
  );
}

export function useAbstractionAccountContract(address: string, withSignerIfPossible = true) {
  return useContract(address, AccountAbstractionABI, withSignerIfPossible);
}
