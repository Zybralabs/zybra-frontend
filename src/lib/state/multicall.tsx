import { useMemo } from "react";

import { createMulticall, type ListenerOptions } from "@uniswap/redux-multicall";
import { useBlockNumber } from "wagmi";

import { ChainId } from "@/constant/addresses";
import { useBlockContext } from "@/context/BlockContext";
import { getChainInfo } from "@/hooks/useChain";
import { useMulticall } from "@/hooks/useContract";

const multicall = createMulticall();

export default multicall;

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 };

export function MulticallUpdater() {
  const { chainId: blockContextChainId, latestMainnetBlock } = useBlockContext();
  const wagmiBlockNumber = useBlockNumber();

  // Resolve the current chainId
  const chainId = blockContextChainId ?? ChainId.Testnet;

  // Resolve the latest block number (convert from Wagmi's return type to a plain number)
  const latestBlockNumber = wagmiBlockNumber.data ? Number(wagmiBlockNumber.data) : undefined;

  // Get the contract for the current chain
  const contract = useMulticall(true, chainId);

  const listenerOptions: ListenerOptions = useMemo(
    () => ({
      blocksPerFetch: chainId ? getChainInfo(chainId).blockPerMainnetEpochForChainId : 1,
    }),
    [chainId],
  );

  // Mainnet-specific contract and block
  const mainnetContract = useMulticall(true, ChainId.Mainnet);
  const latestMainnetBlockNumber = latestMainnetBlock ? Number(latestMainnetBlock) : undefined;

  return (
    <>
      {mainnetContract && latestMainnetBlockNumber !== undefined && (
        <multicall.Updater
          chainId={ChainId.Mainnet}
          latestBlockNumber={latestMainnetBlockNumber}
          contract={mainnetContract}
          listenerOptions={MAINNET_LISTENER_OPTIONS}
        />
      )}
      {chainId !== ChainId.Mainnet && contract && latestBlockNumber !== undefined && (
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
