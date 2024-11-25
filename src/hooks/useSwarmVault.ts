import { useCallback } from 'react';
import { useSwarmVaultContract } from './useContract'; // Import the contract hook

/**
 * Hook to interact with the Swarm Vault contract.
 */
export function useSwarmVault(chainId: number) {
  const swarmVaultContract = useSwarmVaultContract(true, chainId);

  const handleCall = useCallback(
    async (methodName: string, ...args: any[]) => {
      if (!swarmVaultContract) {
        console.error('SwarmVault contract is not connected.');
        return null;
      }
      try {
        const result = await swarmVaultContract[methodName](...args);
        return result;
      } catch (error) {
        console.error(`Error calling ${methodName}:`, error);
        return null;
      }
    },
    [swarmVaultContract],
  );

  const handleTransaction = useCallback(
    async (methodName: string, args: any[] = [], overrides: any = {}) => {
      if (!swarmVaultContract) {
        console.error('SwarmVault contract is not connected.');
        return null;
      }

      try {
        const tx = await swarmVaultContract[methodName](...args, overrides);
        console.log(`Transaction ${methodName} sent:`, tx.hash);

        const receipt = await tx.wait();
        console.log(`Transaction ${methodName} confirmed:`, receipt);
        return receipt;
      } catch (error) {
        console.error(`Error sending transaction ${methodName}:`, error);
        return null;
      }
    },
    [swarmVaultContract],
  );

  // State-changing Functions (Deposit Variants)
  const depositWithAsset = useCallback(
    async (assetAmount: number, withdrawalAsset: any, offer: any) =>
      handleTransaction('deposit', [assetAmount, withdrawalAsset, offer]),
    [handleTransaction],
  );

  const depositWithOfferId = useCallback(
    async (
      assetAmount: number,
      offerId: number,
      mintAmount: number,
      isDynamic: boolean,
      maxRate: number,
    ) =>
      handleTransaction('deposit', [
        assetAmount,
        offerId,
        mintAmount,
        isDynamic,
        maxRate,
      ]),
    [handleTransaction],
  );

  // State-changing Functions (Withdraw Variants)
  const withdraw = useCallback(
    async (
      offerId: number,
      assetAmount: number,
      maxRate: number,
      isDynamic: boolean,
      affiliate?: string,
    ) =>
      handleTransaction('withdraw', [
        offerId,
        assetAmount,
        maxRate,
        isDynamic,
        affiliate,
      ]),
    [handleTransaction],
  );

  const withdrawWithSpecificLogic = useCallback(
    async (assetAmount: number, specificLogic: boolean) =>
      handleTransaction('withdrawWithSpecificLogic', [assetAmount, specificLogic]),
    [handleTransaction],
  );

  // State-changing Functions (Other)
  const liquidation = useCallback(
    async (
      provider: string,
      onBehalfOf: string,
      assetAmount: number,
      asset: any,
      priceUpdate: string[],
    ) =>
      handleTransaction('liquidation', [
        provider,
        onBehalfOf,
        assetAmount,
        asset,
        priceUpdate,
      ]),
    [handleTransaction],
  );

  const repayingDebt = useCallback(
    async (
      provider: string,
      asset: string,
      lzybraAmount: number,
      priceUpdate: string[],
    ) =>
      handleTransaction('repayingDebt', [
        provider,
        asset,
        lzybraAmount,
        priceUpdate,
      ]),
    [handleTransaction],
  );

  const claimOffer = useCallback(
    async (offerId: number) => handleTransaction('claimOffer', [offerId]),
    [handleTransaction],
  );

  const addPriceFeed = useCallback(
    async (asset: string, pythPriceId: string, chainlinkAggregator: string) =>
      handleTransaction('addPriceFeed', [asset, pythPriceId, chainlinkAggregator]),
    [handleTransaction],
  );

  // View Functions
  const getBorrowed = useCallback(
    async (user: string, asset: string) => handleCall('getBorrowed', user, asset),
    [handleCall],
  );

  const getPoolTotalCirculation = useCallback(
    async () => handleCall('getPoolTotalCirculation'),
    [handleCall],
  );

  const getCollateralRatioAndLiquidationInfo = useCallback(
    async (user: string, asset: string, priceUpdate: string[]) =>
      handleCall('getCollateralRatioAndLiquidationInfo', user, asset, priceUpdate),
    [handleCall],
  );

  const getAssetPrice = useCallback(
    async (depositAsset: any, withdrawalAsset: any, offerPrice: any) =>
      handleCall('getAssetPrice', depositAsset, withdrawalAsset, offerPrice),
    [handleCall],
  );

  const getAssetPriceOracle = useCallback(
    async (asset: string, priceUpdate: string[]) =>
      handleCall('getAssetPriceOracle', asset, priceUpdate),
    [handleCall],
  );

  return {
    depositWithAsset,
    depositWithOfferId,
    withdraw,
    withdrawWithSpecificLogic,
    liquidation,
    repayingDebt,
    claimOffer,
    addPriceFeed,
    getBorrowed,
    getPoolTotalCirculation,
    getCollateralRatioAndLiquidationInfo,
    getAssetPrice,
    getAssetPriceOracle,
  };
}
