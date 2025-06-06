import {
  addressToHex,
  type Collection,
  computeMultisig,
  evmToSubstrateAddress,
  type PoolRoles,
  type WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  type CombinedSubstrateAccount,
  truncateAddress,
  useCentrifugeQuery,
  useCentrifugeUtils,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { ApiRx } from '@polkadot/api'
import { isAddress as isEvmAddress } from 'ethers'
import * as React from 'react'
import { combineLatest, combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs'
import { usePool, usePoolMetadata, usePools } from './usePools'
import { useLoan } from '@/utils/useLoans'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getUserPermissions([address!]), {
    enabled: !!address,
  })
  return result
}

export function usePoolPermissions(poolId?: string) {
  const [result] = useCentrifugeQuery(['poolPermissions', poolId], (cent) => cent.pools.getPoolPermissions([poolId!]), {
    enabled: !!poolId,
  })

  return result
}

export function useUserPermissionsMulti(addresses: string[], options?: { enabled?: boolean }) {
  const [result] = useCentrifugeQuery(
    ['permissionsMulti', ...addresses],
    (cent) => cent.pools.getUserPermissions([addresses]),
    {
      enabled: !!addresses.length && options?.enabled !== false,
    }
  )
  return result
}

// Better name welcomed lol
export function usePoolsThatAnyConnectedAddressHasPermissionsFor() {
  const {
    substrate: { combinedAccounts, proxiesAreLoading },
  } = useWallet()
  const actingAddresses = [...new Set(combinedAccounts?.map((acc: { actingAddress: any }) => acc.actingAddress))] as string[];
  const permissionsResult = useUserPermissionsMulti(actingAddresses, { enabled: !proxiesAreLoading });
  const poolIds = new Set(
    permissionsResult
      ?.map((permissions) =>
        Object.entries(permissions?.pools || {}).map(([poolId, roles]) => (roles.roles.length ? poolId : []))
      )
      .flat(2)
  )

  const pools = usePools(false)
  const filtered = pools?.filter((p) => poolIds.has(p.id))

  return filtered
}

// Returns whether the connected address can borrow from a pool in principle
export function useCanBorrow(poolId: string) {
  const [account] = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['Borrow'] })
  return !!account
}

// Returns whether the connected address can borrow against a specific asset from a pool
export function useCanBorrowAsset(poolId: string, assetId: string) {
  return !!useBorrower(poolId, assetId)
}
export function useBorrower(poolId: string, assetId: string) {
  const loan = useLoan(poolId, assetId)
  const borrower = loan && 'borrower' in loan ? loan?.borrower : ''
  return useSuitableAccounts({
    poolId,
    poolRole: ['Borrower'],
    actingAddress: [borrower],
    proxyType: ['Borrow'],
  }).at(0)
}

export function usePoolAdmin(poolId: string) {
  return useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })[0]
}

type SuitableConfig = {
  actingAddress?: string[]
  poolId?: string
  poolRole?: (PoolRoles['roles'][0] | { trancheInvestor: string })[]
  proxyType?: string[] | ((accountProxyTypes: string[]) => boolean)
}



export function useSuitableAccounts(config: SuitableConfig) {
  const { actingAddress, poolId, poolRole, proxyType } = config
  const {
    isEvmOnSubstrate,
    substrate: { selectedAccount, combinedAccounts, evmChainId },
    evm: { selectedAddress },
  } = useWallet()
  const signingAddress = isEvmOnSubstrate
    ? evmToSubstrateAddress(selectedAddress!, evmChainId!)
    : selectedAccount?.address
  const permissions = usePoolPermissions(poolId)
  const accounts = (combinedAccounts ?? [])?.filter((acc: CombinedSubstrateAccount) => {
    if (acc.signingAccount.address !== signingAddress) return false
    if (actingAddress && !actingAddress.includes(acc.actingAddress)) return false
    if (
      acc.proxies &&
      !acc.proxies.every(
        (p) =>
          p.types.includes('Any') ||
          (proxyType &&
            (typeof proxyType === 'function' ? proxyType(p.types) : p.types.some((t: string) => proxyType.includes(t))))
      )
    )
      return false

    if (
      poolRole &&
      !poolRole.some((role) =>
        typeof role === 'string'
          ? permissions?.[acc.actingAddress]?.roles.includes(role)
          : !!permissions?.[acc.actingAddress]?.tranches[role.trancheInvestor]
      )
    )
      return false

    return true
  })

  return accounts
}

export function usePoolAccess(poolId: string) {
  const {
    substrate: { proxies },
  } = useWallet()
  const poolPermissions = usePoolPermissions(poolId)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const multisig = metadata?.adminMultisig && computeMultisig(metadata?.adminMultisig)
  const [admin, adminPermissions] =
    (poolPermissions &&
      Object.entries(poolPermissions).find(([, poolRoles]) => poolRoles.roles.includes('PoolAdmin'))) ||
    []
  const aoProxies = (admin && proxies?.[admin]?.filter((p: { types: string | string[] }) => p.types.includes('Any')).map((p: { delegator: any }) => p.delegator)) || []



  const [transferAllowlists] = useCentrifugeQuery(
    ['aoTransferAllowlist', aoProxies],
    (cent) => {
      const $events = cent.getEvents().pipe(
        filter(({ api, events }) => {
          const event = events.find(
            ({ event }) =>
              api.events.transferAllowList.TransferAllowanceCreated.is(event) ||
              api.events.transferAllowList.TransferAllowanceRemoved.is(event) ||
              api.events.transferAllowList.TransferAllowancePurged.is(event)
          )
          return !!event
        })
      )
      return cent.getApi().pipe(
        switchMap((api) =>
          combineLatest(
            aoProxies.map((addr: unknown) => api.query.transferAllowList.accountCurrencyTransferAllowance.entries(addr, 'All'))
          )
        ),
        combineLatestWith(cent.getBlocks().pipe(take(1))),
        map(([data, block]) => {
          return (data as [any, any][]).map(
            (entries) =>
              entries
                .map(([keyData, valueData]) => {
                  const key = (keyData.toHuman() as any)[2]
                  const value = valueData.toPrimitive() as { blockedAt: number }
                  const blockNumber = block.block.header.number.toNumber()
                  if (blockNumber > value.blockedAt) return null as never
                  if ('Local' in key) {
                    return {
                      address: addressToHex(key.Local),
                      location: 'centrifuge',
                    }
                  } else if ('Address' in key) {
                    if ('EVM' in key.Address)
                      return {
                        address: key.Address.EVM[1].toLowerCase(),
                        location: { evm: Number(key.Address.EVM[0].replace(/\D/g, '')) },
                      }
                  } else if ('Xcm' in key) {
                    if (!key.Xcm?.V3?.interior?.X2?.[1]?.AccountId32?.id) {
                      return null as never
                    }
                    return {
                      address: key.Xcm.V3.interior.X2[1].AccountId32.id,
                      location: { parachain: Number(key.Xcm.V3.interior.X2[0].Parachain.replace(/\D/g, '')) },
                    }
                  }
                  return key
                })
                .filter(Boolean) as WithdrawAddress[]
          )
        }),
        repeatWhen(() => $events)
      )
    },
    {
      enabled: !!aoProxies.length,
    }
  )

  const [delegates] = useCentrifugeQuery(
    ['proxyDelegates', [admin, ...aoProxies]],
    (cent) => {
      const addresses = [admin!, ...aoProxies]
      return cent.getApi().pipe(
        switchMap((api) => api.queryMulti(addresses.map((addr) => [api.query.proxy.proxies, addr]))),
        map((proxiesData) => {
          const values = (proxiesData as any[]).map((data) => data[0].toJSON())

          const result: { delegator: string; delegatee: string; types: string[] }[][] = []
          addresses.forEach((delegator, i) => {
            const proxiesByDelegate: Record<string, { delegator: string; delegatee: string; types: string[] }> = {}
            const delegates = values[i]
            delegates.forEach((node: any) => {
              const delegatee = addressToHex(node.delegate)
              if (delegatee === admin) return
              if (proxiesByDelegate[delegatee]) {
                proxiesByDelegate[delegatee].types.push(node.proxyType)
              } else {
                proxiesByDelegate[delegatee] = {
                  delegator,
                  delegatee,
                  types: [node.proxyType],
                }
              }
            })
            result.push(Object.values(proxiesByDelegate))
          })

          return result
        })
      )
    },
    {
      enabled: !!aoProxies.length && !!admin,
    }
  )

  const [adminDelegates, aoDelegates] = React.useMemo(() => {
    const [adminDelegates, ...aoDelegates] = delegates ?? []
    return [adminDelegates, aoDelegates]
  }, [delegates])

  const storedAdminRoles = {
    address: admin || '',
    roles: Object.fromEntries(adminPermissions?.roles.map((role) => [role, true]) || []),
  }

  const storedManagerPermissions = poolPermissions
    ? Object.entries(poolPermissions)
        .filter(
          ([addr, p]) =>
            p.roles.length &&
            (multisig?.signers
              ? multisig.signers.includes(addr)
              : adminDelegates?.find((p) => p.types.includes('Any') && p.delegatee === addr))
        )
        .map(([address, permissions]) => ({
          address,
          roles: Object.fromEntries(permissions.roles.map((role) => [role, true])),
        }))
    : []



  return {
    admin,
    multisig: React.useMemo(
      () => (metadata?.adminMultisig && computeMultisig(metadata.adminMultisig)) || null,
      [metadata?.adminMultisig]
    ),
    adminPermissions,
    adminDelegates,
    managerPermissions: storedManagerPermissions,
    assetOriginators: React.useMemo(
      () =>
        aoProxies.map((addr: string | number, i: number) => ({
          address: addr,
          permissions: poolPermissions?.[addr] || { roles: [], tranches: {} },
          delegates: aoDelegates?.[i] || [],
          transferAllowlist: transferAllowlists?.[i] || [],
        })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [ aoDelegates, poolPermissions, transferAllowlists]
    ),
  }
}
export type WithdrawKey = ReturnType<typeof getKeyForReceiver>
export function getKeyForReceiver(api: ApiRx, receiver: WithdrawAddress) {
  if (typeof receiver.location === 'string') {
    return {
      Local: addressToHex(receiver.address),
    }
  } else if ('parachain' in receiver.location) {
    return {
      XCM: {
        V3: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: receiver.location.parachain,
              },
              isEvmAddress(receiver.address)
                ? {
                    AccountKey20: {
                      network: null,
                      key: receiver.address.toLowerCase(),
                    },
                  }
                : {
                    AccountId32: {
                      id: addressToHex(receiver.address),
                    },
                  },
            ],
          },
        },
      },
    }
  } else if ('evm' in receiver.location) {
    return {
      Address: {
        EVM: [receiver.location.evm, receiver.address],
      },
    }
  }
}
