/**
 * Wrapped Transaction Hooks for All Components
 * Automatic gas sponsorship for swap, stake, lending, take, make offer, etc.
 */

import { useCallback } from 'react';
import { useUniversalTransaction } from '@/context/UniversalTransactionContext';
import { useUserAccount } from '@/context/UserAccountContext';
import { WalletType } from '@/constant/account/enum';

// Common gas multipliers for different transaction types
const GAS_MULTIPLIERS = {
  MINT: {
    callGasLimit: 1.2,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.1,
    maxPriorityFeePerGas: 1.05,
  },
  SWAP: {
    callGasLimit: 1.3,
    verificationGasLimit: 1.15,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.2,
    maxPriorityFeePerGas: 1.1,
  },
  LENDING: {
    callGasLimit: 1.25,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.15,
    maxPriorityFeePerGas: 1.05,
  },
  STAKING: {
    callGasLimit: 1.2,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.1,
    maxPriorityFeePerGas: 1.05,
  },
  VAULT: {
    callGasLimit: 1.3,
    verificationGasLimit: 1.15,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.2,
    maxPriorityFeePerGas: 1.1,
  },
  OFFER: {
    callGasLimit: 1.25,
    verificationGasLimit: 1.1,
    preVerificationGas: 1.1,
    maxFeePerGas: 1.15,
    maxPriorityFeePerGas: 1.05,
  },
};

/**
 * Universal Mint Transaction Hook with Gas Sponsorship
 */
export function useWrappedMintTransactions(contractAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const claimTokens = useCallback(async (tokenIndex: number) => {
    return await executeTransaction({
      contractAddress,
      abi,
      functionName: 'claimTokens',
      args: [tokenIndex],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.MINT,
        retryOnFailure: true,
        maxRetries: 3,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, contractAddress, abi, walletType]);

  return {
    claimTokens,
    shouldUseSponsorship,
    walletType,
  };
}

/**
 * Universal Swap Transaction Hook with Gas Sponsorship
 */
export function useWrappedSwapTransactions(routerAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const swapExactTokensForTokens = useCallback(async (
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number
  ) => {
    return await executeTransaction({
      contractAddress: routerAddress,
      abi,
      functionName: 'swapExactTokensForTokens',
      args: [amountIn, amountOutMin, path, to, deadline],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.SWAP,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, routerAddress, abi, walletType]);

  const swapExactETHForTokens = useCallback(async (
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number,
    value: bigint
  ) => {
    return await executeTransaction({
      contractAddress: routerAddress,
      abi,
      functionName: 'swapExactETHForTokens',
      args: [amountOutMin, path, to, deadline],
      options: {
        value,
        gasMultipliers: GAS_MULTIPLIERS.SWAP,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, routerAddress, abi, walletType]);

  return {
    swapExactTokensForTokens,
    swapExactETHForTokens,
    shouldUseSponsorship,
    walletType,
  };
}

/**
 * Universal Lending Transaction Hook with Gas Sponsorship
 */
export function useWrappedLendingTransactions(lendingPoolAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const supply = useCallback(async (asset: string, amount: string, onBehalfOf: string) => {
    return await executeTransaction({
      contractAddress: lendingPoolAddress,
      abi,
      functionName: 'supply',
      args: [asset, amount, onBehalfOf],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.LENDING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, lendingPoolAddress, abi, walletType]);

  const borrow = useCallback(async (
    asset: string,
    amount: string,
    interestRateMode: number,
    onBehalfOf: string
  ) => {
    return await executeTransaction({
      contractAddress: lendingPoolAddress,
      abi,
      functionName: 'borrow',
      args: [asset, amount, interestRateMode, onBehalfOf],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.LENDING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, lendingPoolAddress, abi, walletType]);

  const repay = useCallback(async (asset: string, amount: string, onBehalfOf: string) => {
    return await executeTransaction({
      contractAddress: lendingPoolAddress,
      abi,
      functionName: 'repay',
      args: [asset, amount, onBehalfOf],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.LENDING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, lendingPoolAddress, abi, walletType]);

  const withdraw = useCallback(async (asset: string, amount: string, to: string) => {
    return await executeTransaction({
      contractAddress: lendingPoolAddress,
      abi,
      functionName: 'withdraw',
      args: [asset, amount, to],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.LENDING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, lendingPoolAddress, abi, walletType]);

  return {
    supply,
    borrow,
    repay,
    withdraw,
    shouldUseSponsorship,
    walletType,
  };
}

/**
 * Universal Staking Transaction Hook with Gas Sponsorship
 */
export function useWrappedStakingTransactions(stakingAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const stake = useCallback(async (amount: string) => {
    return await executeTransaction({
      contractAddress: stakingAddress,
      abi,
      functionName: 'stake',
      args: [amount],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.STAKING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, stakingAddress, abi, walletType]);

  const unstake = useCallback(async (amount: string) => {
    return await executeTransaction({
      contractAddress: stakingAddress,
      abi,
      functionName: 'unstake',
      args: [amount],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.STAKING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, stakingAddress, abi, walletType]);

  const claimRewards = useCallback(async () => {
    return await executeTransaction({
      contractAddress: stakingAddress,
      abi,
      functionName: 'claimRewards',
      args: [],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.STAKING,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, stakingAddress, abi, walletType]);

  return {
    stake,
    unstake,
    claimRewards,
    shouldUseSponsorship,
    walletType,
  };
}

/**
 * Universal Vault Transaction Hook with Gas Sponsorship
 */
export function useWrappedVaultTransactions(vaultAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const deposit = useCallback(async (assets: string, receiver: string) => {
    return await executeTransaction({
      contractAddress: vaultAddress,
      abi,
      functionName: 'deposit',
      args: [assets, receiver],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.VAULT,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, vaultAddress, abi, walletType]);

  const withdraw = useCallback(async (assets: string, receiver: string, owner: string) => {
    return await executeTransaction({
      contractAddress: vaultAddress,
      abi,
      functionName: 'withdraw',
      args: [assets, receiver, owner],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.VAULT,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, vaultAddress, abi, walletType]);

  const redeem = useCallback(async (shares: string, receiver: string, owner: string) => {
    return await executeTransaction({
      contractAddress: vaultAddress,
      abi,
      functionName: 'redeem',
      args: [shares, receiver, owner],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.VAULT,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, vaultAddress, abi, walletType]);

  return {
    deposit,
    withdraw,
    redeem,
    shouldUseSponsorship,
    walletType,
  };
}

/**
 * Universal Offer Transaction Hook with Gas Sponsorship
 */
export function useWrappedOfferTransactions(marketplaceAddress: string, abi: any[]) {
  const { executeTransaction, shouldUseSponsorship } = useUniversalTransaction();
  const { walletType } = useUserAccount();

  const makeOffer = useCallback(async (
    tokenId: string,
    price: string,
    duration: number
  ) => {
    return await executeTransaction({
      contractAddress: marketplaceAddress,
      abi,
      functionName: 'makeOffer',
      args: [tokenId, price, duration],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.OFFER,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, marketplaceAddress, abi, walletType]);

  const takeOffer = useCallback(async (offerId: string) => {
    return await executeTransaction({
      contractAddress: marketplaceAddress,
      abi,
      functionName: 'takeOffer',
      args: [offerId],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.OFFER,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, marketplaceAddress, abi, walletType]);

  const cancelOffer = useCallback(async (offerId: string) => {
    return await executeTransaction({
      contractAddress: marketplaceAddress,
      abi,
      functionName: 'cancelOffer',
      args: [offerId],
      options: {
        gasMultipliers: GAS_MULTIPLIERS.OFFER,
        retryOnFailure: true,
        maxRetries: 2,
        skipSponsorship: walletType !== WalletType.MINIMAL,
      },
    });
  }, [executeTransaction, marketplaceAddress, abi, walletType]);

  return {
    makeOffer,
    takeOffer,
    cancelOffer,
    shouldUseSponsorship,
    walletType,
  };
}
