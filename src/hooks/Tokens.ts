// import { type Currency, Token } from '@uniswap/sdk-core'
// import { useWeb3React } from '@web3-react/core'
// import { useCurrencyFromMap, useTokenFromMapOrNetwork } from '@/lib/hooks/useCurrency'
// import { useMemo } from 'react'

// import {  useCombinedActiveList } from '../state/lists/hooks'
// import type { TokenAddressMap } from './../state/lists/hooks'

// // reduce token map into standard address <-> Token mapping, optionally include user added tokens
// function useTokensFromMap(tokenMap: TokenAddressMap): { [address: string]: Token } {
//   const  chainId  = useChainId()
//   return useMemo(() => {
//     if (!chainId) return {}

//     // reduce to just tokens
//     return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>((newMap, address) => {
//       newMap[address] = tokenMap[chainId][address].token
//       return newMap
//     }, {})
//   }, [chainId, tokenMap])
// }

// export function useAllTokens(): { [address: string]: Token } {
//   const allTokens = useCombinedActiveList(); // Retrieve the active token list
//   const tokensFromMap = useTokensFromMap(allTokens); // Map tokens from the list

//   // Return tokens directly from the map, no user-added tokens included
//   return useMemo(() => {
//     return { ...tokensFromMap }; // Simply copy tokensFromMap
//   }, [tokensFromMap]);
// }







// // undefined if invalid or does not exist
// // null if loading or null was passed
// // otherwise returns the token
// export function useToken(tokenAddress?: string | null): Token | null | undefined {
//   const tokens = useAllTokens()
//   return useTokenFromMapOrNetwork(tokens, tokenAddress)
// }

// export function useCurrency(currencyId?: string | null): Currency | null | undefined {
//   const tokens = useAllTokens()
//   return useCurrencyFromMap(tokens, currencyId)
// }
