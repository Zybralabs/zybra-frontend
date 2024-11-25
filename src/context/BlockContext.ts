import React, { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { useEthersProvider } from '../useEthersProvider' // Custom hook for provider

interface BlockContextProps {
  chainId: number | null
  latestBlock: number | null
  latestMainnetBlock: number | null
}

const BlockContext = createContext<BlockContextProps>({
  chainId: null,
  latestBlock: null,
  latestMainnetBlock: null,
})

export const useBlockContext = () => {
  return useContext(BlockContext)
}

export const BlockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const provider = useEthersProvider()
  const mainnetProvider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID') // Replace with your RPC

  const [chainId, setChainId] = useState<number | null>(null)
  const [latestBlock, setLatestBlock] = useState<number | null>(null)
  const [latestMainnetBlock, setLatestMainnetBlock] = useState<number | null>(null)

  useEffect(() => {
    if (!provider) return

    // Fetch initial chain ID
    provider.getNetwork().then((network) => {
      setChainId(network.chainId)
    })

    // Subscribe to block updates
    const onBlock = (blockNumber: number) => {
      setLatestBlock(blockNumber)
    }

    provider.on('block', onBlock)

    return () => {
      provider.off('block', onBlock)
    }
  }, [provider])

  useEffect(() => {
    if (!mainnetProvider) return

    // Subscribe to Mainnet block updates
    const onMainnetBlock = (blockNumber: number) => {
      setLatestMainnetBlock(blockNumber)
    }

    mainnetProvider.on('block', onMainnetBlock)

    return () => {
      mainnetProvider.off('block', onMainnetBlock)
    }
  }, [mainnetProvider])

  return (
    <BlockContext.Provider
      value={{
        chainId,
        latestBlock,
        latestMainnetBlock,
      }}
    >
      {children}
    </BlockContext.Provider>
  )
}
