import type { Filter } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useMemo } from 'react'

import { useAppDispatch, useAppSelector } from '../hooks'
import { addListener, removeListener } from './slice'
import { filterToKey, isHistoricalLog, type Log } from './utils'
import { useBlockNumber, useChainId } from 'wagmi'

enum LogsState {
  // The filter is invalid
  INVALID,
  // The logs are being loaded
  LOADING,
  // Logs are from a previous block number
  SYNCING,
  // Tried to fetch logs but received an error
  ERROR,
  // Logs have been fetched as of the latest block number
  SYNCED,
}

interface UseLogsResult {
  logs: Log[] | undefined
  state: LogsState
}

/**
 * Returns the logs for the given filter as of the latest block, re-fetching from the library every block.
 * @param filter The logs filter, with `fromBlock` or `toBlock` optionally specified.
 * The filter parameter should _always_ be memoized, or else will trigger constant refetching
 */
export function useLogs(filter: Filter | undefined): UseLogsResult {
  const  chainId  = useChainId()
  const blockNumber = useBlockNumber()

  const logs = useAppSelector((state) => state.logs)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!filter || !chainId) return

    dispatch(addListener({ chainId, filter }))
    return () => {
      dispatch(removeListener({ chainId, filter }))
    }
  }, [chainId, dispatch, filter])

  return useMemo(() => {
    if (!chainId || !filter || !blockNumber)
      return {
        logs: undefined,
        state: LogsState.INVALID,
      }

    const state = logs[chainId]?.[filterToKey(filter)]
    const result = state?.results

    if (!result) {
      return {
        state: LogsState.LOADING,
        logs: undefined,
      }
    }

    if (result.error) {
      return {
        state: LogsState.ERROR,
        logs: undefined,
      }
    }

    return {
      // if we're only fetching logs until a block that has already elapsed, we're synced regardless of result.blockNumber
      state: isHistoricalLog(filter, Number(blockNumber))
        ? LogsState.SYNCED
        : result.blockNumber >= Number(blockNumber)
        ? LogsState.SYNCED
        : LogsState.SYNCING,
      logs: result.logs,
    }
  }, [blockNumber, chainId, filter, logs])
}
