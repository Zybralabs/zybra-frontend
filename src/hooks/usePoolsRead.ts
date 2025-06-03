import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/state/hooks';
import { useCentrifuge } from '@centrifuge/centrifuge-react';
import { useListedPools } from '@/hooks/useListedPools';
import { useMetadataMulti } from '@/hooks/useMetadata';
import { savePoolData } from '@/state/application/hooks';
import { filterPools } from '@/components/MainPane/utils';
import type { 
  PoolCardProps, 
  PoolStatusKey, 
  MetaDataById 
} from '@/components/MainPane/MainPane';
import type { Pool, PoolMetadata } from '@centrifuge/centrifuge-js';
import type { PoolMetaDataPartial } from '@/components/MainPane/MainPane';
import { getPoolValueLocked } from './getPoolValueLocked';
import { isEqual } from 'lodash';

// Memoized helper function to get metadata by ID
const getMetasById = (pools: Pool[], poolMetas: PoolMetaDataPartial[]): MetaDataById => {
  const result: MetaDataById = {};
  pools.forEach(({ id: poolId }, index) => {
    result[poolId] = poolMetas[index];
  });
  return result;
};

// Stable pool status function
const getPoolStatus = (pool: Pool): PoolStatusKey => 
  pool.tranches.at(0)?.capacity?.toFloat() ? "Open for investments" : "Closed";

// Optimized serialization function

// Export hook that loads and makes pool data available
export function usePoolData(searchParam: string = '') {
  const dispatch = useDispatch();
  const cent = useCentrifuge();
  const prevPoolsRef = useRef<any[] | null>(null);
  const prevFilteredRef = useRef<any[] | null>(null);

  // Get pools from Redux store
  const { 
    allPools, 
    filteredPools, 
    loading, 
    error 
  } = useAppSelector((state) => state.application);
  
  // Fetch pool data
  const [listedPools, poolsError] = useListedPools();
  
  // Memoized pool filtering and transformation
  const centPools = useMemo(() => 
    listedPools?.filter(({ id }) => !id.startsWith("0x")) as Pool[] || [], 
    [listedPools]
  );

  // Memoized metadata fetching
  const centPoolsMetaData: PoolMetaDataPartial[] = useMetadataMulti<PoolMetadata>(
    centPools?.map((p) => p.metadata) ?? [],
  ).map((q) => q.data);

  // Memoized metadata lookup
  const centPoolsMetaDataById = useMemo(() => 
    getMetasById(centPools, centPoolsMetaData), 
    [centPools, centPoolsMetaData]
  );

  // Memoized pool transformation function
  const poolsToPoolCardProps = useCallback((
    pools: Pool[],
    metaDataById: MetaDataById,
    cent: any,
  ): PoolCardProps[] => {
    return pools.map((pool) => {
      const metaData = typeof pool.metadata === "string" ? metaDataById[pool.id] : pool.metadata;
      
      return {
        poolId: pool.id,
        name: metaData?.pool?.name,
        assetClass: metaData?.pool?.asset.subClass,
        valueLocked: getPoolValueLocked(pool),
        currencySymbol: pool.currency.symbol,
        status: getPoolStatus(pool),
        iconUri: metaData?.pool?.icon?.uri
          ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri)
          : undefined,
        tranches: pool.tranches,
        metaData: metaData as PoolMetadata,
        createdAt: pool.createdAt ?? "",
      };
    });
  }, []);

  // Memoized pools calculation
  const [pools, filtered] = useMemo(() => {
    if (!listedPools?.length) return [[], []];
    
    const poolProps = poolsToPoolCardProps(listedPools, centPoolsMetaDataById, cent);
    
    const openInvestmentPools = poolProps
      .filter(
        (pool) =>
          pool.status === "Open for investments" &&
          !pool?.poolId?.startsWith("0x") &&
          pool?.valueLocked,
      )
      .sort((a, b) =>
        b?.valueLocked && a?.valueLocked ? 
          parseFloat(b?.valueLocked.toString()) - parseFloat(a?.valueLocked.toString()) : 0,
      );

    const upcomingPools: PoolCardProps[] = [];
    const sortedPools = [...openInvestmentPools, ...upcomingPools];
    
    return [
      poolProps,
      searchParam ? filterPools([...poolProps, ...upcomingPools], new URLSearchParams(searchParam)) : sortedPools,
    ];
  }, [listedPools, searchParam, cent, centPoolsMetaDataById, poolsToPoolCardProps]);

  // Optimized effect for saving pool data
  useEffect(() => {
    // Only proceed if there are pools or filtered pools
    if (!(pools && pools.length > 0) && !(filtered && filtered.length > 0)) {
      return;
    }

    // Check if data has actually changed to prevent unnecessary dispatches
    const poolsChanged = !isEqual(prevPoolsRef.current, pools);
    const filteredChanged = !isEqual(prevFilteredRef.current, filtered);

    if (poolsChanged || filteredChanged) {
      // Fast serialization with minimal overhead
      const serializableAllPools = (pools);
      const serializableFilteredPools = (filtered);
      
      // Dispatch only if there are changes
      dispatch(savePoolData(serializableAllPools, serializableFilteredPools));

      // Update refs with current state
      prevPoolsRef.current = pools;
      prevFilteredRef.current = filtered;
    }
  }, [pools, filtered, dispatch]);

  // Manual refresh method (placeholder)

  return {
    allPools,
    filteredPools,
    loading: loading,
    error: error || poolsError,
  };
}