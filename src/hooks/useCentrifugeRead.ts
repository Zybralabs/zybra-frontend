import { useCallback, useMemo } from "react";
import { firstValueFrom } from "rxjs";
import Centrifuge, { Pool, Vault, type Query, type ShareClassId } from "@centrifuge/sdk";
import { RPC_URLS } from "@/constant/constant";

// Initialize Centrifuge SDK instance
const centrifuge = new Centrifuge({
  environment: "mainnet", // Change to 'demo' or 'dev' as needed
  rpcUrls: {
    1: RPC_URLS[1][0], // Add additional chain IDs and URLs if needed
    // 8533: RPC_URLS[][0], // Add additional chain IDs and URLs if needed
    // Add additional chain IDs and URLs if needed
  },
});

// Define filter type for reports
export type ReportFilter = {
  from: string;
  to: string;
  groupBy: "day" | "month" | "quarter" | "year";
};

// Define return types for hook methods
export interface PoolDetails {
  pool: Pool;
  metadata: Awaited<ReturnType<Pool["metadata"]>>;
  trancheIds: string[];
}

export interface UseCentrifugeHook {
  fetchPoolDetails: (poolId: string[]) => Promise<PoolDetails[]>;
  fetchVault: (poolId: string, chainId: number, trancheId: string, asset: string) => Promise<Vault>;
  fetchBalanceSheetReport: (
    poolId: string,
    filter: ReportFilter,
  ) => Promise<Awaited<ReturnType<Pool["reports"]["balanceSheet"]>>>;
  fetchProfitAndLossReport: (
    poolId: string,
    filter: ReportFilter,
  ) => Promise<Awaited<ReturnType<Pool["reports"]["profitAndLoss"]>>>;
  fetchCashflowReport: (
    poolId: string,
    filter: ReportFilter,
  ) => Promise<Awaited<ReturnType<Pool["reports"]["cashflow"]>>>;
  fetchInvestmentState: (
    vault: Vault,
    user: string,
  ) => Promise<Awaited<ReturnType<Vault["investment"]>>>;
}

/**
 * Custom hook to interact with the Centrifuge SDK.
 */
export const useCentrifuge = (): UseCentrifugeHook => {
  const cache = useMemo(() => new Map<string, any>(), []);
  
  /**
   * Fetch details of a specific pool by ID.
   * @param poolId Pool ID
   */
  const fetchPoolDetails = useCallback(async (poolIds: string[]): Promise<PoolDetails[]> => {
    const results = await Promise.allSettled(
      poolIds.map(async (poolId) => {
        // Check cache first
        if (cache.has(poolId)) {
          return cache.get(poolId) as PoolDetails;
        }

        try {
          // @ts-ignore - Centrifuge SDK type issue
          const pool = await firstValueFrom(centrifuge.pool(poolId));
          const [metadata, trancheIds] = await Promise.all([
            pool.metadata(),
            //@ts-ignore
            pool.trancheIds()
          ]);

          const result: PoolDetails = { pool, metadata, trancheIds };
          cache.set(poolId, result);
          return result;
        } catch (error) {
          console.error(`Error fetching details for pool ${poolId}:`, error);
          throw error;
        }
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<PoolDetails> => result.status === 'fulfilled')
      .map(result => result.value);
  }, [cache]);

  /**
   * Fetch a vault's data.
   * @param poolId Pool ID
   * @param chainId Chain ID
   * @param trancheId Tranche ID
   * @param asset Address of the asset
   */
  const fetchVault = useCallback(
    async (poolId: string, chainId: number, trancheId: string, asset: string): Promise<Vault> => {
      try {
        // @ts-ignore - Centrifuge SDK type issue
        const pool = await firstValueFrom(centrifuge.pool(poolId));
        console.log("pool", await pool.metadata());
        const vault = await pool.vault(chainId, trancheId as unknown as ShareClassId, asset);
        return vault;
      } catch (error) {
        console.error(`Error fetching vault for pool ${poolId}:`, error);
        throw error;
      }
    },
    [],
  );

  /**
   * Fetch a balance sheet report for a pool.
   * @param poolId Pool ID
   * @param filter Report filter
   */
  const fetchBalanceSheetReport = useCallback(async (poolId: string, filter: ReportFilter) => {
    try {
      // @ts-ignore - Centrifuge SDK type issue
      const pool = await firstValueFrom(centrifuge.pool(poolId));
      const report = await pool.reports.balanceSheet(filter);
      return report;
    } catch (error) {
      console.error(`Error fetching balance sheet report for pool ${poolId}:`, error);
      throw error;
    }
  }, []);

  /**
   * Fetch a profit and loss report for a pool.
   * @param poolId Pool ID
   * @param filter Report filter
   */
  const fetchProfitAndLossReport = useCallback(async (poolId: string, filter: ReportFilter) => {
    try {
      // @ts-ignore - Centrifuge SDK type issue
      const pool = await firstValueFrom(centrifuge.pool(poolId));
      const report = await pool.reports.profitAndLoss(filter);
      return report;
    } catch (error) {
      console.error(`Error fetching profit and loss report for pool ${poolId}:`, error);
      throw error;
    }
  }, []);

  /**
   * Fetch a cashflow report for a pool.
   * @param poolId Pool ID
   * @param filter Report filter
   */
  const fetchCashflowReport = useCallback(async (poolId: string, filter: ReportFilter) => {
    try {
      // @ts-ignore - Centrifuge SDK type issue
      const pool = await firstValueFrom(centrifuge.pool(poolId));
      const report = await pool.reports.cashflow(filter);
      return report;
    } catch (error) {
      console.error(`Error fetching cashflow report for pool ${poolId}:`, error);
      throw error;
    }
  }, []);

  /**
   * Fetch tranche snapshots report for a pool.
   * @param poolId Pool ID
   */

  /**
   * Query the state of an investment on a vault for an investor.
   * @param vault Vault object
   * @param investorAddress Address of the investor
   */
  const fetchInvestmentState = useCallback(async (vault: Vault, investorAddress: string) => {
    try {
      const investmentState = await vault.investment(investorAddress);
      return investmentState;
    } catch (error) {
      console.error(`Error fetching investment state for investor ${investorAddress}:`, error);
      throw error;
    }
  }, []);

  return {
    fetchPoolDetails,
    fetchVault,
    fetchBalanceSheetReport,
    fetchProfitAndLossReport,
    fetchCashflowReport,
    fetchInvestmentState,
  };
};

export default useCentrifuge;
