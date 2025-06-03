import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useUserAccount } from "@/context/UserAccountContext";
import { useChainId } from "wagmi";
import { SupportedChainId, LENDING_POOL_ADDRESS } from "@/constant/addresses";
import { useMultipleContractSingleData, useSingleContractMultipleCalls } from "@/lib/hooks/multicall";
import { Interface } from "@ethersproject/abi";
import { useContract } from "@/hooks/useContract";
import { formatUnits } from "viem";
import LendingPoolABI from "@/abis/LendingPoolABI.json";
import type { BaseContract, ContractInterface } from "ethers";

// Asset info type
export interface AssetInfo {
  id: string;
  name: string;
  symbol: string;
  description: string;
  icon: string;
  iconBg: string;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: number;
  totalBorrowed: number;
  collateralFactor: number;
  decimals: number;
  tokenAddress: `0x${string}`;
}

// Processed asset data with user-specific information
export type ProcessedAssetData = AssetInfo & {
  // Pool data from contract
  contractTotalSupply: number;
  contractTotalBorrowed: number;
  availableLiquidity: number;
  contractCollateralFactor: number;
  
  // User-specific data
  userSupplied: number;
  userBorrowed: number;
  userCanUseAsCollateral: boolean;
  
  // Calculated values
  supplyAPYCalculated: number;
  borrowAPYCalculated: number;
  utilizationRate: number;
};

// User account data with health factor
export interface UserAccountData {
  totalLiquidityBalanceUSD: number;
  totalCollateralBalanceUSD: number;
  totalBorrowBalanceUSD: number;
  healthFactor: number;
  isHealthy: boolean;
  
  // Additional metrics
  maxBorrowCapacityUSD: number;
  borrowUtilization: number; // How much of collateral is being used
}

export interface HealthFactorRisk {
  level: 'safe' | 'moderate' | 'danger' | 'liquidation';
  color: string;
  label: string;
  description: string;
}

// Pool config interface for multicall
const PoolConfigInterface = new Interface([
  {
    "inputs": [],
    "name": "getCollateralPercent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_totalBorrows", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalLiquidity", "type": "uint256"}
    ],
    "name": "calculateInterestRate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]);

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Address cache for performance
const addressCache = new Map<string, `0x${string}`>();

function getCachedLendingPoolAddress(chainId: number): `0x${string}` {
  const cacheKey = `lending-pool-${chainId}`;
  
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  const address = chainId && LENDING_POOL_ADDRESS[chainId as SupportedChainId]
    ? LENDING_POOL_ADDRESS[chainId as SupportedChainId] as `0x${string}`
    : LENDING_POOL_ADDRESS[SupportedChainId.Testnet] as `0x${string}`;

  addressCache.set(cacheKey, address);
  return address;
}

/**
 * Calculate Health Factor from collateral and borrow values
 * Health Factor = Total Collateral Value / Total Borrowed Value
 */
export function calculateHealthFactor(
  totalCollateralBalanceUSD: number,
  totalBorrowBalanceUSD: number
): number {
  if (totalBorrowBalanceUSD === 0) {
    return Infinity; // No borrows = infinite health factor
  }
  if (totalCollateralBalanceUSD === 0) {
    return 0; // No collateral but has borrows = 0 health factor
  }
  return totalCollateralBalanceUSD / totalBorrowBalanceUSD;
}

/**
 * Get Health Factor risk assessment
 */
export function getHealthFactorRisk(healthFactor: number): HealthFactorRisk {
  if (healthFactor === Infinity || healthFactor > 2.0) {
    return {
      level: 'safe',
      color: '#10B981',
      label: 'Very Safe',
      description: 'Your position is very safe from liquidation'
    };
  } else if (healthFactor >= 1.5) {
    return {
      level: 'moderate',
      color: '#F59E0B',
      label: 'Moderate Risk',
      description: 'Monitor your position carefully'
    };
  } else if (healthFactor >= 1.0) {
    return {
      level: 'danger',
      color: '#EF4444',
      label: 'Danger Zone',
      description: 'High risk of liquidation - consider reducing borrows'
    };
  } else {
    return {
      level: 'liquidation',
      color: '#DC2626',
      label: 'Liquidation Risk',
      description: 'Position may be liquidated'
    };
  }
}

/**
 * Calculate Health Factor after a potential borrow
 */
export function calculateHealthFactorAfterBorrow(
  currentCollateralUSD: number,
  currentBorrowUSD: number,
  additionalBorrowUSD: number
): number {
  const newTotalBorrows = currentBorrowUSD + additionalBorrowUSD;
  return calculateHealthFactor(currentCollateralUSD, newTotalBorrows);
}

/**
 * Main hook for lending pool data with proper decimal handling
 */
export function useLendingPoolData(initialAssets: AssetInfo[]) {
  const { address: userAddress } = useUserAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce user address to prevent rapid calls
  const debouncedUserAddress = useDebounce(userAddress, 300);

  // Cache refs for optimization
  const cachedDataRef = useRef<{
    assetData: ProcessedAssetData[] | null;
    userAccountData: UserAccountData | null;
    timestamp: number;
  }>({ assetData: null, userAccountData: null, timestamp: 0 });

  // Get lending pool contract
  const lendingPoolAddress = useMemo(() => {
    return getCachedLendingPoolAddress(chainId || SupportedChainId.Testnet);
  }, [chainId]);

  const lendingPoolContract = useContract(lendingPoolAddress, LendingPoolABI);

  // Prepare token addresses
  const tokenAddresses = useMemo<`0x${string}`[]>(() => {
    return initialAssets.map(asset => asset.tokenAddress);
  }, [initialAssets]);

  // Prepare multicall parameters
  const { getPoolParams, getUserPoolDataParams, getUserAccountParams } = useMemo(() => {
    if (!debouncedUserAddress || tokenAddresses.length === 0) {
      return { 
        getPoolParams: [], 
        getUserPoolDataParams: [], 
        getUserAccountParams: [] 
      };
    }

    const getPoolParams = tokenAddresses.map(address => [address]);
    const getUserPoolDataParams = tokenAddresses.map(address => [debouncedUserAddress, address]);
    const getUserAccountParams = [[debouncedUserAddress]];

    return { getPoolParams, getUserPoolDataParams, getUserAccountParams };
  }, [tokenAddresses, debouncedUserAddress]);

  // Execute multicalls for pool data
  const poolDataResults = useSingleContractMultipleCalls(
    lendingPoolContract as unknown as BaseContract & Omit<ContractInterface, keyof BaseContract>,
    tokenAddresses.map(() => 'getPool'),
    getPoolParams
  );

  // Execute multicalls for user pool data
  const userPoolDataResults = useSingleContractMultipleCalls(
    lendingPoolContract as unknown as BaseContract & Omit<ContractInterface, keyof BaseContract>,
    tokenAddresses.map(() => 'getUserPoolData'),
    getUserPoolDataParams
  );

  // Execute call for user account data
  const userAccountResults = useSingleContractMultipleCalls(
    lendingPoolContract as unknown as BaseContract & Omit<ContractInterface, keyof BaseContract>,
    ['getUserAccount'],
    getUserAccountParams
  );

  // Get pool config addresses for collateral factors
  const poolConfigAddresses = useMemo<`0x${string}`[]>(() => {
    if (!poolDataResults || poolDataResults.some(result => result.loading)) {
      return [];
    }

    return poolDataResults
      .map(result => result.result?.[2] as `0x${string}` || null)
      .filter(Boolean);
  }, [poolDataResults]);

  // Execute multicalls for collateral factors
  const collateralFactorResults = useMultipleContractSingleData(
    poolConfigAddresses,
    PoolConfigInterface,
    'getCollateralPercent',
    []
  );

  // Check if all data is ready
  const isDataReady = useMemo(() => {
    if (!debouncedUserAddress || !lendingPoolContract || tokenAddresses.length === 0) {
      return false;
    }

    const poolDataReady = poolDataResults?.length === tokenAddresses.length &&
      poolDataResults.every(result => !result.loading && result.result);

    const userPoolDataReady = userPoolDataResults?.length === tokenAddresses.length &&
      userPoolDataResults.every(result => !result.loading && result.result);

    const userAccountReady = userAccountResults?.length === 1 &&
      userAccountResults.every(result => !result.loading && result.result);

    const collateralDataReady = poolConfigAddresses.length === 0 || (
      collateralFactorResults?.length === poolConfigAddresses.length &&
      collateralFactorResults.every(result => !result.loading && result.result)
    );

    return poolDataReady && userPoolDataReady && userAccountReady && collateralDataReady;
  }, [
    debouncedUserAddress,
    lendingPoolContract,
    tokenAddresses.length,
    poolDataResults,
    userPoolDataResults,
    userAccountResults,
    poolConfigAddresses.length,
    collateralFactorResults
  ]);

  // Process all data
  const processedData = useMemo(() => {
    if (!isDataReady) {
      return cachedDataRef.current;
    }

    const now = Date.now();
    // Return cached data if it's fresh (less than 5 seconds old)
    if (cachedDataRef.current.assetData && (now - cachedDataRef.current.timestamp) < 5000) {
      return cachedDataRef.current;
    }

    try {
      // Process asset data
      const assetData: ProcessedAssetData[] = initialAssets.map((asset, index) => {
        // Get pool data from contract
        const poolData = poolDataResults[index]?.result;
        if (!poolData || poolData.length < 7) {
          return {
            ...asset,
            contractTotalSupply: 0,
            contractTotalBorrowed: 0,
            availableLiquidity: 0,
            contractCollateralFactor: 0,
            userSupplied: 0,
            userBorrowed: 0,
            userCanUseAsCollateral: false,
            supplyAPYCalculated: asset.supplyAPY,
            borrowAPYCalculated: asset.borrowAPY,
            utilizationRate: 0,
          };
        }

        // Extract pool data with proper types
        const [
          status,
          alTokenAddress,
          poolConfigAddress,
          totalBorrows,
          totalBorrowShares,
          totalLiquidity,
          totalAvailableLiquidity,
          lastUpdateTimestamp
        ] = poolData as [
          number, // PoolStatus enum
          string,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint
        ];

        // Get user pool data
        const userData = userPoolDataResults[index]?.result;
        if (!userData || userData.length < 3) {
          return {
            ...asset,
            contractTotalSupply: Number(formatUnits(totalLiquidity, asset.decimals)),
            contractTotalBorrowed: Number(formatUnits(totalBorrows, asset.decimals)),
            availableLiquidity: Number(formatUnits(totalAvailableLiquidity, asset.decimals)),
            contractCollateralFactor: 0,
            userSupplied: 0,
            userBorrowed: 0,
            userCanUseAsCollateral: false,
            supplyAPYCalculated: asset.supplyAPY,
            borrowAPYCalculated: asset.borrowAPY,
            utilizationRate: 0,
          };
        }

        // Extract user data
        const [
          compoundedLiquidityBalance,
          compoundedBorrowBalance,
          userUsePoolAsCollateral
        ] = userData as [bigint, bigint, boolean];

        // Get collateral factor
        let collateralFactor = 0;
        if (poolConfigAddress) {
          const collateralFactorIndex = poolConfigAddresses.findIndex(
            addr => addr.toLowerCase() === poolConfigAddress.toLowerCase()
          );
          if (collateralFactorIndex >= 0 && collateralFactorResults[collateralFactorIndex]?.result) {
            collateralFactor = Number(formatUnits(
              collateralFactorResults[collateralFactorIndex].result[0] as bigint, 
              18
            ));
          }
        }

        // Calculate utilization rate and APYs
        const totalLiquidityNum = Number(formatUnits(totalLiquidity, asset.decimals));
        const totalBorrowsNum = Number(formatUnits(totalBorrows, asset.decimals));
        const utilizationRate = totalLiquidityNum > 0 ? totalBorrowsNum / totalLiquidityNum : 0;

        // Simple APY calculation (you might want to call the contract's interest rate calculation)
        const baseRate = 2.0; // 2% base rate
        const multiplier = 10.0; // 10% slope
        const borrowAPYCalculated = baseRate + (utilizationRate * multiplier);
        const supplyAPYCalculated = borrowAPYCalculated * utilizationRate * 0.85; // 85% goes to suppliers

        return {
          ...asset,
          contractTotalSupply: totalLiquidityNum,
          contractTotalBorrowed: totalBorrowsNum,
          availableLiquidity: Number(formatUnits(totalAvailableLiquidity, asset.decimals)),
          contractCollateralFactor: collateralFactor,
          userSupplied: Number(formatUnits(compoundedLiquidityBalance, asset.decimals)),
          userBorrowed: Number(formatUnits(compoundedBorrowBalance, asset.decimals)),
          userCanUseAsCollateral: userUsePoolAsCollateral,
          supplyAPYCalculated,
          borrowAPYCalculated,
          utilizationRate,
        };
      });

      // Process user account data
      let userAccountData: UserAccountData | null = null;
      const accountResult = userAccountResults[0]?.result;
      
      if (accountResult && accountResult.length >= 3) {
        const [
          totalLiquidityBalanceBase,
          totalCollateralBalanceBase,
          totalBorrowBalanceBase
        ] = accountResult as [bigint, bigint, bigint];

        const totalLiquidityUSD = Number(formatUnits(totalLiquidityBalanceBase, 18));
        const totalCollateralUSD = Number(formatUnits(totalCollateralBalanceBase, 18));
        const totalBorrowUSD = Number(formatUnits(totalBorrowBalanceBase, 18));

        const healthFactor = calculateHealthFactor(totalCollateralUSD, totalBorrowUSD);
        const isHealthy = totalBorrowUSD <= totalCollateralUSD;
        
        // Calculate additional metrics
        const maxBorrowCapacityUSD = totalCollateralUSD;
        const borrowUtilization = totalCollateralUSD > 0 ? totalBorrowUSD / totalCollateralUSD : 0;

        userAccountData = {
          totalLiquidityBalanceUSD: totalLiquidityUSD,
          totalCollateralBalanceUSD: totalCollateralUSD,
          totalBorrowBalanceUSD: totalBorrowUSD,
          healthFactor,
          isHealthy,
          maxBorrowCapacityUSD,
          borrowUtilization,
        };
      }

      const result = {
        assetData,
        userAccountData,
        timestamp: now
      };

      cachedDataRef.current = result;
      return result;

    } catch (err) {
      console.error("Error processing lending pool data:", err);
      setError("Failed to process lending pool data");
      return cachedDataRef.current;
    }
  }, [
    isDataReady,
    initialAssets,
    poolDataResults,
    userPoolDataResults,
    userAccountResults,
    poolConfigAddresses,
    collateralFactorResults
  ]);

  // Update loading state
  useEffect(() => {
    setIsLoading(!isDataReady);
  }, [isDataReady]);

  return {
    assetData: processedData.assetData,
    userAccountData: processedData.userAccountData,
    isLoading,
    error,
    // Utility functions
    calculateHealthFactorAfterBorrow: useCallback((additionalBorrowUSD: number) => {
      if (!processedData.userAccountData) return 0;
      return calculateHealthFactorAfterBorrow(
        processedData.userAccountData.totalCollateralBalanceUSD,
        processedData.userAccountData.totalBorrowBalanceUSD,
        additionalBorrowUSD
      );
    }, [processedData.userAccountData]),
    
    getHealthFactorRisk: useCallback((healthFactor?: number) => {
      const hf = healthFactor ?? processedData.userAccountData?.healthFactor ?? Infinity;
      return getHealthFactorRisk(hf);
    }, [processedData.userAccountData]),

    // Raw data for debugging
    rawData: {
      poolDataResults,
      userPoolDataResults,
      userAccountResults,
      collateralFactorResults
    }
  };
}