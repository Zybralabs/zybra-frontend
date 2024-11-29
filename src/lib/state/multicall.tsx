import { ChainId } from '@/constant/addresses'
import { getChainInfo } from '@/hooks/useChain'
import { useMulticall } from '@/hooks/useContract'
import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { useAccount } from 'hooks/useAccount'
import { useAtomValue } from 'jotai/utils'
import useBlockNumber, { multicallUpdaterSwapChainIdAtom, useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'

const multicall = createMulticall()

export default multicall

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 }

export function MulticallUpdater() {
  const account = useAccount()
  const multicallUpdaterSwapChainId = useAtomValue(multicallUpdaterSwapChainIdAtom)
  const chainId = multicallUpdaterSwapChainId ?? account.chainId
  const latestBlockNumber = useBlockNumber()
  const contract = useMulticall(chainId)
  const listenerOptions: ListenerOptions = useMemo(
    () => ({ blocksPerFetch: chainId ? getChainInfo(chainId).blockPerMainnetEpochForChainId : 1 }),
    [chainId],
  )

  const latestMainnetBlockNumber = useMainnetBlockNumber()
  const mainnetContract = useMulticall(chainId)

  return (
    <>
      <multicall.Updater
        chainId={ChainId.Mainnet}
        latestBlockNumber={latestMainnetBlockNumber}
        contract={mainnetContract}
        listenerOptions={MAINNET_LISTENER_OPTIONS}
      />
      {chainId !== ChainId.Mainnet && (
        <multicall.Updater
          chainId={chainId}
          latestBlockNumber={latestBlockNumber}
          contract={contract}
          listenerOptions={listenerOptions}
        />
      )}
    </>
  )
}