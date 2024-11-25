import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';

/**
 * Custom hook to get an Ethers.js provider from the Web3React context.
 * @returns An instance of Web3Provider from Ethers.js.
 */
export function useEthersProvider(): Web3Provider | null {
  const { library, active } = useWeb3React();

  return useMemo(() => {
    if (!active || !library) {
      return null;
    }
    return new Web3Provider(library.provider);
  }, [library, active]);
}
