import { useMemo } from "react";

import { createMulticall, type ListenerOptions } from "@uniswap/redux-multicall";
import { useBlockNumber, useChainId } from "wagmi";

import { SupportedChainId } from "@/constant/addresses";
import { useBlockContext } from "@/context/BlockContext";
import { getChainInfo } from "@/hooks/useChain";
import { useMulticall } from "@/hooks/useContract";
import { RPC_PROVIDERS } from "@/constant/constant";

const multicall = createMulticall();

export default multicall;

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 };

export function MulticallUpdater() {
  const { latestBlock,
    latestMainnetBlock, } = useBlockContext()
  const chainId = useChainId()
  // Resolve the current chainId

  // Resolve the latest block number (convert from Wagmi's return type to a plain number)
  const latestBlockNumber = latestBlock
    

  // Get the contract for the current chain
  const contract = useMulticall(true, chainId);

  const listenerOptions: ListenerOptions = useMemo(
    () => ({
      blocksPerFetch: chainId ? getChainInfo(chainId).blockPerMainnetEpochForChainId : 1,
    }),
    [chainId],
  );

  // Base_Mainnet-specific contract and block
  const mainnetContract = useMulticall(true, SupportedChainId.Base_Mainnet);
  const latestMainnetBlockNumber = latestMainnetBlock ? Number(latestMainnetBlock) : undefined;
   console.log({contract}, latestBlockNumber)
  return (
    <>
      {mainnetContract && latestMainnetBlockNumber !== undefined && (
        <multicall.Updater
          chainId={SupportedChainId.Base_Mainnet}
          latestBlockNumber={latestMainnetBlockNumber}
          contract={mainnetContract}
          listenerOptions={MAINNET_LISTENER_OPTIONS}
        />
      )}
      {chainId !== SupportedChainId.Base_Mainnet && contract && latestBlockNumber !== undefined && (
        <multicall.Updater
          chainId={chainId}
          latestBlockNumber={latestBlockNumber}
          contract={contract}
          listenerOptions={listenerOptions}
        />
      )}
    </>
  );
}