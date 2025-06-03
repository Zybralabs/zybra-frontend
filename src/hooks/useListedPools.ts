import { CurrencyBalance, type PoolMetadata } from "@centrifuge/centrifuge-js";
import BN from "bn.js";
import Decimal from "decimal.js-light";
import * as React from "react";
import { useMemo } from "react";
import { Dec } from "./Decimal";
import { formatBalanceAbbreviated } from "./formatting";
import { getPoolTVL } from "./getPoolTVL";
import { useSubquery } from "./useSubquery";
import { usePools } from "./usePools";
import { useMetadataMulti } from "./useMetadata";

type FlattenedDataItem = {
  netAssetValue: string;
  decimals: number;
};

type Pool = {
  sumBorrowedAmount: CurrencyBalance;
  currency: {
    decimals: number;
  };
};

const sign = (n: BN) => (n.isZero() ? 0 : n.isNeg() ? -1 : 1);

export function useListedPools() {
  const pools = usePools();
  const poolMetas = useMetadataMulti<PoolMetadata>(pools?.map((p) => p.metadata) ?? []);

  const [listedPools, listedTokens] = React.useMemo(
    () => {
      const listedPools = pools?.filter((_, i) => poolMetas[i]?.data?.pool?.listed ?? []);
      const listedTokens = listedPools?.flatMap((p) => p.tranches);

      return [
        listedPools?.sort((a, b) => getPoolTVL(b) - getPoolTVL(a)),
        listedTokens?.sort((a, b) => sign(b.capacity.sub(a.capacity))),
      ];
    },
    [pools, poolMetas]
  );

  const isLoading = poolMetas.some((q) => q.isLoading);

  return [listedPools, listedTokens, isLoading] as const;
}

export function useYearOverYearGrowth() {
  const [listedPools] = useListedPools();

  const { oneDayAgoFromOneYearAgo, nextDay } = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(
      Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate(), 0, 0, 0),
    );

    const addOneDay = (date: Date): Date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 1);
      return newDate;
    };

    return {
      oneDayAgoFromOneYearAgo: oneYearAgo,
      nextDay: addOneDay(oneYearAgo),
    };
  }, []);

  const { data, isLoading } = useSubquery(
    `query ($oneDayAgoFromOneYearAgo: Datetime!, $nextDay: Datetime!) {
      pools {
        nodes {
          currency {
            decimals
          }
          poolSnapshots(
            filter: {
              timestamp: {
                greaterThan: $oneDayAgoFromOneYearAgo,
                lessThan: $nextDay
              }
            },
          ) {
            nodes {
              netAssetValue
              timestamp
            }
          }
        }
      }
    }`,
    {
      oneDayAgoFromOneYearAgo,
      nextDay,
    },
    {
      enabled: !!oneDayAgoFromOneYearAgo,
    },
  );

  const flattenedData =
    data?.pools?.nodes.flatMap((pool: any) =>
      pool.poolSnapshots.nodes.map((snapshot: any) => ({
        netAssetValue: snapshot.netAssetValue,
        decimals: pool.currency.decimals,
      })),
    ) || [];

  const aggregatedNetAssetValue = flattenedData.reduce(
    (accumulator: Decimal, item: FlattenedDataItem) => {
      const netAssetValue = new CurrencyBalance(item.netAssetValue, item.decimals);
      return accumulator.add(netAssetValue.toDecimal());
    },
    Dec(0),
  );

  const aggregatedListedPoolsNav = listedPools?.reduce((accumulator, pool) => {
    const decimal = pool.currency?.decimals ?? 0;
    const navTotal = new CurrencyBalance(pool.nav.total, decimal);
    return accumulator.add(navTotal.toDecimal());
  }, Dec(0));

  const lastYearNAV = aggregatedNetAssetValue.toNumber();
  const currentYearNAV = aggregatedListedPoolsNav?.toNumber();

  const totalYoyGrowth =
    lastYearNAV && currentYearNAV ? ((currentYearNAV - lastYearNAV) / lastYearNAV) * 100 : 0;

  return { totalYoyGrowth, isLoading };
}

export function useTotalAssetsFinanced() {
  const { data, isLoading } = useSubquery(
    `query {
      pools {
        nodes {
         sumBorrowedAmount
         currency {
          decimals
         }
        }
      }
    }`,
  );

  const pools = data?.pools?.nodes;

  const sumBorrowedAmount = pools?.reduce((accumulator: Decimal, pool: Pool) => {
    const total = new CurrencyBalance(pool.sumBorrowedAmount || 0, pool.currency.decimals);
    return accumulator.add(total.toDecimal());
  }, Dec(0));

  return { sumBorrowedAmount: formatBalanceAbbreviated(sumBorrowedAmount || 0), isLoading };
}