import { gql, useQuery, } from '@apollo/client';
// Queries Definitions

export const AssetPriceQuery = gql`
  query AssetPrice($id: ID!) {
    assetPrice(id: $id, subgraphError: allow) {
      id
      offerMaximumPrice
      offerMinimumPrice
      priceFeedAddress
    }
  }
`

export const AssetPricesQuery = gql`
  query AssetPrices($first: Int, $orderBy: String, $orderDirection: String) {
    assetPrices(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      priceFeedAddress
      offerMinimumPrice
      offerMaximumPrice
      id
      asset
    }
  }
`

export const AssetQuery = gql`
  query Asset($id: ID!) {
    asset(id: $id, subgraphError: allow) {
      id
      address
      assetType
      decimals
      name
      symbol
      tokenId
      tradedVolume
    }
  }
`

export const AssetsQuery = gql`
  query Assets($first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
    assets(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      subgraphError: allow
    ) {
      tradedVolume
      tokenId
      symbol
      name
      id
      decimals
      assetType
      address
    }
  }
`

export const OfferQuery = gql`
    query Offer($id: ID!) {
      offer(id: $id) {
        amountIn
        amountOut
        authorizationAddresses
        availableAmount
        cancelledAt
        commsLink
        createdAt
        expiryTimestamp
        id
        isAuth
        isPrivate
        maker
        offerFillType
        offerPrice {
          Offer {
            amountIn
            amountOut
            authorizationAddresses
            availableAmount
            cancelledAt
            commsLink
            createdAt
            expiryTimestamp
            id
            isAuth
            isPrivate
            maker
            offerFillType
          }
        }
      }
    }
  `
  
  export const OfferPricesQuery = gql`
    query OfferPrices {
      offerPrices {
        unitPrice
        pricingType
        percentageType
        percentage
        id
        depositAssetPrice {
          priceFeedAddress
          offerMinimumPrice
          offerMaximumPrice
          id
        }
      }
    }
  `
  



export const UsersQuery = gql`
  query Users($first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
    users(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      transactions(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
        type
        timestamp
        id
        gasUsed
        gasPrice
        block
      }
    }
  }
`

export const TransactionsQuery = gql`
  query Transactions($first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
    transactions(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      type
      timestamp
      id
      gasUsed
      gasPrice
      block
    }
  }
`



export const OffersQuery = gql`
  query Offers(
    $orderBy: String
    $orderDirection: String
    $skip: Int
    $first: Int
  ) {
    offers(
      orderBy: $orderBy
      orderDirection: $orderDirection
      skip: $skip
      first: $first
    ) {
      amountIn
      amountOut
      authorizationAddresses
      availableAmount
      cancelledAt
      commsLink
      expiryTimestamp
      id
      isAuth
      isPrivate
      maker
      offerFillType
      timelockPeriod
      terms
      takingOfferType
      specialAddresses
      orders(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
        affiliate
        amountPaid
        amountToReceive
        createdAt
        orderedBy
        isTakerAffiliate
        id
        Offer {
          amountIn
          amountOut
          authorizationAddresses
          availableAmount
          cancelledAt
          commsLink
          createdAt
          timelockPeriod
          terms
          takingOfferType
          specialAddresses
          offerFillType
          maker
          isPrivate
          isAuth
          id
          expiryTimestamp
          depositAsset {
            address
            assetType
            decimals
            id
            name
            symbol
          }
        }
      }
      offerPrice {
        id
        percentage
        percentageType
        pricingType
        unitPrice
        Offer {
          amountIn
          amountOut
          availableAmount
          authorizationAddresses
          cancelledAt
          commsLink
          createdAt
          expiryTimestamp
          id
          isAuth
          isPrivate
          maker
          offerFillType
          specialAddresses
          terms
          takingOfferType
          timelockPeriod
        }
        withdrawalAssetPrice {
          offerMinimumPrice
          offerMaximumPrice
          id
          asset {
            address
            assetType
            decimals
            id
            name
            symbol
          }
        }
        depositAssetPrice {
          offerMaximumPrice
          id
          offerMinimumPrice
          priceFeedAddress
        }
      }
      withdrawalAsset {
        address
        assetType
        decimals
        id
        name
        symbol
        tokenId
        tradedVolume
      }
      createdAt
      depositAsset {
        address
        assetType
        decimals
        name
        id
        symbol
        tokenId
        tradedVolume
      }
    }
  }
`


// Add remaining queries similarly...

// Query Functions

export type QueryFunctionArgs<T> = {
  vars?: T;
};

export type QueryOffersArgs = {
    client: any;
    vars?: {
      block?: { number?: number; number_gte?: number; hash?: string };
      orderBy?: string;
      orderDirection?: string;
      subgraphError?: 'allow' | 'deny';
      skip?: number;
      first: number;
    };
  };
  
// Query Function Implementations

export async function queryAssetPrice({ vars }: QueryFunctionArgs<{ id: string }>) {
  return useQuery(AssetPriceQuery,{
    variables: vars
  });
}

export async function queryAssetPrices({

  vars = { first: 10, orderBy: 'id', orderDirection: 'asc' },
}: QueryFunctionArgs<{ first?: number; orderBy?: string; orderDirection?: string }>) {
  return useQuery(AssetPricesQuery,{
    variables: vars
  });
}

export async function queryAsset({ vars }: QueryFunctionArgs<{ id: string }>) {
  return useQuery(AssetQuery,{
    variables: vars
  });
}

export async function useAssetsQuery({

  vars = { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' },
}: QueryFunctionArgs<{ first?: number; skip?: number; orderBy?: string; orderDirection?: string }>) {
  return useQuery(AssetsQuery,{
    variables: vars
  });
}

export async function useOfferPricesQuery({

  vars = { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' },
}: QueryFunctionArgs<{ first?: number; skip?: number; orderBy?: string; orderDirection?: string }>) {
  return useQuery(OffersQuery,{
    variables: vars
  });
}

export async function useQueryOffer({ vars }: QueryFunctionArgs<{ id: string }>) {
  return useQuery(OfferQuery,{
    variables: vars
  });
}

export async function queryOfferPrice({ vars }: QueryFunctionArgs<{ id: string }>) {
  return useQuery(OfferPricesQuery,{
    variables: vars
  });
}

export async function queryOfferPrices({ }: QueryFunctionArgs<undefined>) {
  return useQuery(OfferPricesQuery);
}

export async function queryUsers({

  vars = { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' },
}: QueryFunctionArgs<{ first?: number; skip?: number; orderBy?: string; orderDirection?: string }>) {
  return useQuery(UsersQuery,{
    variables: vars
  });
}


export async function useTransactionsQuery({

  vars = { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' },
}: QueryFunctionArgs<{ first?: number; skip?: number; orderBy?: string; orderDirection?: string }>) {
  return useQuery(TransactionsQuery,{
    variables: vars
  });
}

export async function useOffersQuery({
  
  vars = { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' }
  }: any) {
    return useQuery(OffersQuery,{
      variables: vars
    });
  }
// Add remaining query functions...
