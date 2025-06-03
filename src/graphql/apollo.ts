import { ApolloClient, InMemoryCache } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

const GRAPHQL_URL = 'https://gateway.thegraph.com/api/ad26662628fef14a31d422fc9f0bba50/subgraphs/id/5YiQCycVo1c1ppo3g35GBecTxEtsT5Roj3uHEvgcUb4f'; // Replace with your GraphQL URL

if (!GRAPHQL_URL) {
  throw new Error('GraphQL URL is missing');
}

export const apolloClient = new ApolloClient({
  uri: GRAPHQL_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      nextFetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
});
