import { useWeb3React } from '@web3-react/core'
import { useEffect, useRef, useState } from 'react'

import { useCloseModal } from './hooks'
import { updateChainId } from './reducer'
import { useAppDispatch } from '../hooks'
import { useSupportedChainId } from '@/hooks/useChain'
import useDebounce from '@/utils/useDebounce'
import useIsWindowVisible from '@/lib/hooks/useIsWindowVisible'
import { useAccount, useChainId } from 'wagmi'
import { RPC_PROVIDERS } from '@/constant/constant'
import type { SupportedChainId } from '@/constant/addresses'

export default function Updater(): null {
 
  const chainId = useChainId()
  const {address: account} = useAccount()
  const provider = RPC_PROVIDERS[
    chainId as SupportedChainId
    ];
  const dispatch = useAppDispatch()
  const windowVisible = useIsWindowVisible()

  const [activeChainId, setActiveChainId] = useState(chainId)

  const closeModal = useCloseModal()
  const previousAccountValue = useRef(account)
  useEffect(() => {
    if (account && account !== previousAccountValue.current) {
      previousAccountValue.current = account
      closeModal()
    }
  }, [account, closeModal])

  useEffect(() => {
    if (provider && chainId && windowVisible) {
      setActiveChainId(chainId)
    }
  }, [dispatch, chainId, provider, windowVisible])

  const debouncedChainId = useDebounce(activeChainId, 100)

  useEffect(() => {
    const chainId = debouncedChainId ? useSupportedChainId(debouncedChainId) ?? null : null
    if(chainId){

      dispatch(updateChainId({ chainId }))
    }
  }, [dispatch, debouncedChainId])

  return null
}
