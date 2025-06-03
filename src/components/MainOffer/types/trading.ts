import type { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";

export enum TakingOfferTypeEnum {
  PartialOffer = "PartialOffer", // green
  BlockOffer = "BlockOffer", // blue
  // "Partially Filled" = "Partially Filled", // blue
  // "Not Filled" = "Not Filled", // text
  // Cancelled = "Cancelled", // red
}
export interface TradingPair {
  filled?: number;
  id: string;
  sellAmount: number;
  sellCurrency: string;
  buyAmount: number;
  buyCurrency: string;
  rate: number;
  status: StatusEnum;
  type: "all" | "my" | "private";
  maker: string;
  expiryTimestamp: number;
  depositAsset?: {
    address: string;
    assetType: string;
    decimals: number;
    id: string;
    name: string;
    symbol: string;
    tokenId: string | null;
    tradedVolume: number;
  };
  withdrawalAsset?: {
    address: string;
    assetType: string;
    decimals: number;
    id: string;
    name: string;
    symbol: string;
    tokenId: string | null;
    tradedVolume: number;
  };
  depositAssetAddress?: string;
  withdrawalAssetAddress?: string;
  specialAddresses: string[];
  authorizationAddresses: string[];
  availableAmount: number;
  takingOfferType?: TakingOfferTypeEnum;
  orders?: {
    affiliate: string;
    amountPaid: number;
    amountToReceive: number;
    createdAt: number;
    id: string;
  }[];
  cancelled: boolean
}
