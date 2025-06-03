import Centrifuge from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifuge, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import type { JsonRpcProvider } from '@ethersproject/providers'
import { getDefaultProvider } from 'ethers'

export function useDomainRouters(suspense?: boolean) {
  const [data] = useCentrifugeQuery(['domainRouters'], (cent) => cent.liquidityPools.getDomainRouters(), { suspense })

  return data
}

export type Domain = (ReturnType<Centrifuge['liquidityPools']['getPool']> extends Promise<infer T> ? T : never) & {
  chainId: number
  managerAddress: string
  hasDeployedLp: boolean
}

export function useActiveDomains(poolId?: string, suspense?: boolean) {
 
  const cent = useCentrifuge()
  const routers = useDomainRouters(suspense)
  const query = useQuery(
    ['activeDomains', poolId, routers?.length],
    async () => {
      const results = await Promise.allSettled(
        routers!
          // remove all goerli networks since providers don't support goerli anymore
          .filter((r) => r.chainId !== 5 && r.chainId !== 84531)
          .map((r) => {
            async function getManager() {
              const rpcProvider = getDefaultProvider(r.chainId) as unknown as JsonRpcProvider | undefined
              const manager = await cent.liquidityPools.getManagerFromRouter([r.router], {
                rpcProvider,
              })
              const pool = await cent.liquidityPools.getPool([r.chainId, manager, poolId!], { rpcProvider })
              return [manager, pool] as const
            }
            return withTimeout(getManager(), 15000)
          })
      )
      return results
        .map((result, i) => {
          if (result.status === 'rejected') {
            console.error(result.reason)
            return null as never
          }
          const [manager, pool] = result.value
          const router = routers![i]
          const domain: Domain = {
            ...pool,
            chainId: router.chainId,
            managerAddress: manager,
            hasDeployedLp:
              pool.liquidityPools &&
              typeof pool.liquidityPools === 'object' &&
              Object.values(pool.liquidityPools as Record<string, unknown>).some((tranche) => typeof tranche === 'object' && !!Object.values(tranche as Record<string, unknown>).some((p) => !!p)),
          }
          return domain
        })
        .filter(Boolean)
    },
    {
      enabled: !!routers?.length && !!poolId && !poolId.startsWith('0x'),
      staleTime: Infinity,
      suspense,
    }
  )

  return query
}

export function useLiquidityPools(poolId: string, trancheId: string, chainIdOverride?: number) {
  const {
    evm: { chainId: connectedChainId },
  } = useWallet()
  const chainId = chainIdOverride ?? connectedChainId
  const cent = useCentrifuge()
  const { data: domains } = useActiveDomains(poolId)
  const managerAddress = domains?.find((d) => d.chainId === chainId)?.managerAddress

  const query = useQuery(
    ['lps', poolId, trancheId, chainId],
    () =>
      cent.liquidityPools.getLiquidityPools([managerAddress!, poolId, trancheId, chainId!], {
        rpcProvider: getDefaultProvider(chainId!) as unknown as JsonRpcProvider | undefined,
      }),
    {
      enabled: !!managerAddress,
      staleTime: Infinity,
    }
  )

  return query
}

export function useLiquidityPoolInvestment(poolId: string, trancheId: string, lpIndex?: number) {
  const {
    evm: { chainId },
  } = useWallet()
  const address = useAddress('evm')
  const cent = useCentrifuge()

  const { data: lps } = useLiquidityPools(poolId, trancheId)
  const lp = lps?.[lpIndex ?? 0]

  const query = useQuery(
    ['lpInvestment', chainId, lp?.lpAddress, address],
    async () => ({
      ...(await cent.liquidityPools.getLiquidityPoolInvestment([address!, lp!], {
        rpcProvider: getDefaultProvider(chainId!) as unknown as JsonRpcProvider | undefined,
      })),
      ...lp!,
    }),
    {
      enabled: !!lp && !!address,
    }
  )

  return query
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
}
function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([promise, timeout(ms)])
}
