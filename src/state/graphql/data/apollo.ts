import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from '@apollo/client'

import { SupportedChainId } from '@/constant/addresses'
import type { AppState } from '@/state'
import {  relayStylePagination } from '@apollo/client/utilities'
import store from '@/state'

const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.Base_Mainnet]: 'https://gateway.thegraph.com/api/ad26662628fef14a31d422fc9f0bba50/subgraphs/id/5YiQCycVo1c1ppo3g35GBecTxEtsT5Roj3uHEvgcUb4f',
  [SupportedChainId.Polygon_Mainnet]: 'https://gateway.thegraph.com/api/ad26662628fef14a31d422fc9f0bba50/subgraphs/id/5jyKcTX7beneokj6HnkMQXjJMcSooW8ZmE8evUYfQvsz',
  [SupportedChainId.Mainnet]: 'https://gateway.thegraph.com/api/ad26662628fef14a31d422fc9f0bba50/subgraphs/id/5YiQCycVo1c1ppo3g35GBecTxEtsT5Roj3uHEvgcUb4f',
  [SupportedChainId.Testnet]: 'https://gateway.thegraph.com/api/ad26662628fef14a31d422fc9f0bba50/subgraphs/id/5YiQCycVo1c1ppo3g35GBecTxEtsT5Roj3uHEvgcUb4f',

}

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[SupportedChainId.Base_Mainnet] })

// This middleware will allow us to dynamically update the uri for the requests based off chainId
// For more information: https://www.apollographql.com/docs/react/networking/advanced-http-networking/
const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const chainId = (store.getState() as AppState).application.chainId
  console.log('chainId', chainId)
  operation.setContext(() => ({
    uri:
      chainId && CHAIN_SUBGRAPH_URL[chainId]
        ? CHAIN_SUBGRAPH_URL[chainId]
        : CHAIN_SUBGRAPH_URL[SupportedChainId.Base_Mainnet],
  }))

  return forward(operation)
})

export const apolloClient = new ApolloClient({
   cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            assets: relayStylePagination(),
            assetPrices: relayStylePagination(),
            offers: relayStylePagination(),
            transactions: relayStylePagination(),
            users: relayStylePagination(),
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  link: concat(authMiddleware, httpLink),
})
