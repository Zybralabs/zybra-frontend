import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { logger } from './utilities/logger'; // Replace with your logger utility

// ABIs
import ZybraConfiguratorABI from '../abis/ZybraConfigurator.json';
import CentrifugeRouterABI from '../abis/CentrifugeRouter.json';
import ERC7540ABI from '../abis/ERC7540.json';
import InvestmentManagerABI from '../abis/InvestmentManager.json';
import SwarmVaultBaseABI from '../abis/SwarmZybraVault.json';
import TrancheAssetABI from '../abis/TrancheAsset.json';
import ZfiStakingABI from '../abis/ZfiStaking.json';
import ERC20ABI from '../abis/ERC20.json';
import NFTABI from '../abis/NFT.json';
import CentrifugeVaultABI from '../abis/CentrifugeZybraVault.json';
import ENS_PUBLIC_RESOLVER_ABI from '../abis/ens-public-resolver.json';
import ENS_ABI from '../abis/ens-registrar.json';

// Contract Addresses
import {
    ZYBRA_CONFIGURATOR_ADDRESS,
    ERC7540_VAULT_ADDRESS,
    CENTRIFUGE_ROUTER_ADDRESS,
    INVESTMENT_MANAGER_ADDRESS,
    ZYBRA_VAULT_BASE_ADDRESS,
    SWARM_VAULT_ADDRESS,
    ZFI_STAKING_ADDRESS,
    ENS_REGISTRAR_ADDRESSES,
    ChainId,
} from '../constant/addresses';

// Enum for Vault Types
export enum VaultType {
    SWARM_VAULT = 'SWARM_VAULT',
    CENTRIFUGE_VAULT = 'CENTRIFUGE_VAULT',
}

// Hook to get Ethers.js provider
function useEthersProvider(chainId?: number) {
    const { library, active, chainId: activeChainId } = useWeb3React();

    return useMemo(() => {
        if (!active) return null;
        const provider = new Web3Provider(library.provider);
        if (chainId && chainId !== activeChainId) {
            // Handle chain mismatch (optional)
        }
        return provider;
    }, [library, active, chainId, activeChainId]);
}

// Generalized useContract Hook
export function useContract<T extends Contract = Contract>(
    address: string | undefined,
    ABI: any,
    withSignerIfPossible = true,
    chainId?: number,
): T | null {
    const provider = useEthersProvider(chainId);

    return useMemo(() => {
        if (!address || !ABI || !provider) return null;

        try {
            return new Contract(
                address,
                ABI,
                withSignerIfPossible ? provider.getSigner() : provider,
            );
        } catch (error) {
            logger.warn('useContract', 'Failed to initialize contract', {
                error,
                address,
            });
            return null;
        }
    }, [address, ABI, provider, withSignerIfPossible]) as T;
}

// Vault Contract Hook
export function useCentrifugeVaultContract(
    address: string,
    withSignerIfPossible = true,
    chainId: number,
) {


    return useContract(address, CentrifugeVaultABI, withSignerIfPossible, chainId); // Assuming Swarm uses the same ABI as ERC7540Vault;



}


export function useERC7540VaultContract(
    address: string,
    withSignerIfPossible = true,
    chainId: number,
) {

    return useContract(address, ERC7540ABI, withSignerIfPossible, chainId); // Assuming Swarm uses the same ABI as ERC7540Vault;



}

export function useSwarmVaultContract(
    withSignerIfPossible = true,
    chainId: number,
) {

    return useContract(SWARM_VAULT_ADDRESS[chainId], SwarmVaultBaseABI, withSignerIfPossible, chainId);

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
export function useNFTContract(
    address: string,
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(address, NFTABI, withSignerIfPossible, chainId);
}

// Existing Hooks for Other Contracts
export function useZybraConfiguratorContract(
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(
        chainId ? ZYBRA_CONFIGURATOR_ADDRESS[chainId] : undefined,
        ZybraConfiguratorABI,
        withSignerIfPossible,
        chainId,
    );
}


export function useENSRegistrarContract() {
    return useContract(ENS_REGISTRAR_ADDRESSES[ChainId.Mainnet], ENS_ABI)
}

export function useENSResolverContract(address: string | undefined) {
    return useContract(address, ENS_PUBLIC_RESOLVER_ABI)
}


export function useCentrifugeRouterContract(
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(
        chainId ? CENTRIFUGE_ROUTER_ADDRESS[chainId] : undefined,
        CentrifugeRouterABI,
        withSignerIfPossible,
        chainId,
    );
}

export function useInvestmentManagerContract(
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(
        chainId ? INVESTMENT_MANAGER_ADDRESS[chainId] : undefined,
        InvestmentManagerABI,
        withSignerIfPossible,
        chainId,
    );
}


export function useZFIStakingContract(
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(
        chainId ? ZFI_STAKING_ADDRESS[chainId] : undefined,
        ZfiStakingABI,
        withSignerIfPossible,
        chainId,
    );
}

export function useZybraVaultBaseContract(
    withSignerIfPossible = true,
    chainId?: number,
) {
    return useContract(
        chainId ? ZYBRA_VAULT_BASE_ADDRESS[chainId] : undefined,
        ZybraVaultBaseABI,
        withSignerIfPossible,
        chainId,
    );
}
