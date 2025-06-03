import type { StatusEnum } from "@/app/stockDashboard/_components/tabs/offers";
import type { TakingOfferTypeEnum } from "@/components/MainOffer/types/trading";
import type { BigNumber } from "@ethersproject/bignumber";

export interface TransactionData {
  type: string;        // The transaction type/action (supply, borrow, repay, withdraw)
  amount: number;      // Transaction amount
  status?: string; // Transaction status
  metadata?: Record<string, unknown>;
  tx_hash?: string;    // Transaction hash
  ZRUSD_borrowed?: number; // For deposit/withdraw transactions only
}

export interface ExecuteTransactionData {
  dest: string;
  calldata: string;
  asset: string;
  amount: number;
}

export interface UserProfileUpdateData {
  first_name?: string;
  last_name?: string;
  profile_details?: Record<string, unknown>;
}

export interface KYCSubmissionData {
  document_type: string;
  document_number: string;
  document_image: string;
}

export interface Call {
  address: string;
  callData: string;
  gasRequired?: number;
}

export interface CallStateResult extends ReadonlyArray<any> {
  readonly [key: string]: any;
}

export interface CallState {
  readonly valid: boolean;
  // the result, or undefined if loading or errored/no data
  readonly result: CallStateResult | undefined;
  // true if the result has never been fetched
  readonly loading: boolean;
  // true if the result is not for the latest block
  readonly syncing: boolean;
  // true if the call was made and is synced, but the return data is invalid
  readonly error: boolean;
}

export interface CallResult {
  map(arg0: (result: CallResult | undefined) => CallState): CallState[];
  readonly valid: boolean;
  readonly data: string | undefined;
  readonly blockNumber: number | undefined;
}

export interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  // For transaction modals
  txHash?: string;
  // For error modals
  errorCode?: string;
  // For loading modals
  loadingText?: string;
  chainId?: number;
}

export interface MulticallState {
  callListeners?: {
    // on a per-chain basis
    [chainId: number]: {
      // stores for each call key the listeners' preferences
      [callKey: string]: {
        // stores how many listeners there are per each blocks per fetch preference
        [blocksPerFetch: number]: number;
      };
    };
  };

  callResults: {
    [chainId: number]: {
      [callKey: string]: {
        data?: string | null;
        blockNumber?: number;
        fetchingBlockNumber?: number;
      };
    };
  };

  listenerOptions?: {
    [chainId: number]: ListenerOptions;
  };
}

export interface WithMulticallState {
  [path: string]: MulticallState;
}

export interface ListenerOptions {
  // how often this data should be fetched, by default 1
  readonly blocksPerFetch: number;
}

export interface ListenerOptionsWithGas extends ListenerOptions {
  readonly gasRequired?: number;
}

export interface MulticallListenerPayload {
  chainId: number;
  calls: Call[];
  options: ListenerOptions;
}
export enum SubgraphErrorPolicy {
  ALLOW = "ALLOW",
  DENY = "DENY",
}

export enum AUTH_TYPE {
  GOOGLE = "google",
  APPLE = "apple",
}
export interface MulticallFetchingPayload {
  chainId: number;
  calls: Call[];
  fetchingBlockNumber: number;
}

export interface MulticallResultsPayload {
  chainId: number;
  blockNumber: number;
  results: {
    [callKey: string]: string | null;
  };
}

export interface MulticallListenerOptionsPayload {
  chainId: number;
  listenerOptions: ListenerOptions;
}

export const ProfitType = {
  INC: "inc",
  DEC: "dec",
} as const;

export type ProfitTypeValues = (typeof ProfitType)[keyof typeof ProfitType];

export interface AbstractTransactionResponse {
  hash: string;
  confirmations: number;
  from: string;
  to?: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  raw?: string;
}

export type PoolStatus = "open" | "upcoming" | "hidden";
export type PoolCountry = "us" | "non-us";
export type NonSolicitationNotice = "all" | "non-us" | "none";

export type LoanTemplateAttribute = {
  label: string;
  type: {
    primitive: "string" | "number";
    statistics: "categorical" | "continuous" | "ordinal" | "descrete";
    constructor: "String" | "Date" | "Number";
  };
  input: (
    | {
        type: "text" | "textarea";
        maxLength?: number;
      }
    | {
        type: "single-select";
        options: string[] | { value: string; label: string }[];
      }
    | {
        type: "date" | "time" | "datetime-local" | "month" | "week";
        min?: string;
        max?: string;
      }
    | {
        type: "currency";
        symbol: string;
        min?: number;
        max?: number;
        decimals?: number; // when defined, number will be stored as an integer with its value multiplied by 10 ^ decimals
      }
    | {
        type: "number";
        min?: number;
        max?: number;
        unit?: string;
        decimals?: number; // when defined, number will be stored as an integer with its value multiplied by 10 ^ decimals
      }
  ) & { placeholder?: string };
  output: object | null;
  public: boolean;
};

export type LoanTemplateSection = {
  name: string;
  attributes: string[];
};

export type LoanTemplate = {
  name?: string;
  options: {
    assetClasses?: string[];
    description: boolean;
    image: boolean;
  };
  attributes: Record<string, LoanTemplateAttribute>;
  sections: LoanTemplateSection[];
  keyAttributes?: string[];
};

export type InvestorTypes = "individual" | "entity";

export type UltimateBeneficialOwner = {
  name: string;
  dateOfBirth: string;
  countryOfCitizenship: string;
  countryOfResidency: string;
};

type PoolOnboardingSteps = {
  [poolId: string]: {
    [trancheId: string]: {
      signAgreement: {
        completed: boolean;
        timeStamp: string | null;
        transactionInfo: {
          txHash: string | null;
          blockNumber: string | null;
        };
      };
      status: {
        status: "pending" | "approved" | "rejected" | null;
        timeStamp: string | null;
      };
    };
  };
};

type IndividualUserSteps = {
  verifyAccreditation: {
    completed: boolean | null;
    timeStamp: string | null;
  };
  verifyIdentity: {
    completed: boolean;
    timeStamp: string | null;
  };
  verifyEmail: {
    completed: boolean;
    timeStamp: string | null;
  };
};

export interface EntityOnboardingSteps extends IndividualUserSteps {
  verifyBusiness: {
    completed: boolean;
    timeStamp: string;
  };
  confirmOwners: {
    completed: boolean;
    timeStamp: string | null;
  };
}

export type EntityUser = {
  address: string | null;
  investorType: "entity";
  walletAddress: string;
  businessName: string;
  email: string;
  jurisdictionCode: string;
  registrationNumber: string;
  ultimateBeneficialOwners: UltimateBeneficialOwner[];
  name: string | null;
  dateOfBirth: string | null;
  countryOfCitizenship: string | null;
  countryOfResidency: string | null;
  globalSteps: EntityOnboardingSteps;
  poolSteps: PoolOnboardingSteps;
  kycReference: string;
  manualKybReference: string | null;
  manualKybStatus?:
    | "review.pending"
    | "verification.accepted"
    | "verification.declined"
    | "request.pending";
  taxDocument?: string | null;
};

type IndividualUser = {
  address: string | null;
  investorType: "individual";
  walletAddress: string;
  name: string;
  email: string;
  dateOfBirth: string;
  countryOfCitizenship: string;
  countryOfResidency: string;
  globalSteps: IndividualUserSteps;
  poolSteps: PoolOnboardingSteps;
  kycReference: string;
  taxDocument?: string | null;
};

export type OnboardingUser = IndividualUser | EntityUser;

//Swarm Type DOTC

/**
 * Asset Types Enum
 */
export enum AssetType {
  NoType,
  ERC20,
  ERC721,
  ERC1155,
}

/**
 * Offer Pricing Types Enum
 */
export enum OfferPricingType {
  NoType,
  FixedPricing,
  DynamicPricing,
}

/**
 * Taking Offer Types Enum
 */
export enum TakingOfferType {
  NoType,
  PartialOffer,
  BlockOffer,
}

/**
 * Percentage Types Enum
 */
export enum PercentageType {
  NoType,
  Plus,
  Minus,
}

/**
 * Offer Fill Types Enum
 */
export enum OfferFillType {
  NotTaken,
  Cancelled,
  PartiallyTaken,
  FullyTaken,
}

/**
 * Escrow Offer Status Types Enum
 */
export enum EscrowOfferStatusType {
  NoType,
  OfferDeposited,
  OfferFullyWithdrawn,
  OfferPartiallyWithdrawn,
  OfferCancelled,
}

/**
 * Asset Price Interface
 */
export interface AssetPrice {
  priceFeedAddress: string;
  offerMaximumPrice: number;
  offerMinimumPrice: number;
}

/**
 * Offer Price Interface
 */
export interface OfferPrice {
  offerPricingType: OfferPricingType;
  unitPrice: string;
  percentage: string;
  percentageType: PercentageType;
}

/**
 * Asset Interface
 */
export interface Asset {
  assetType: AssetType;
  assetAddress: string;
  amount: BigNumber;
  tokenId: number;
  assetPrice: AssetPrice;
}

/**
 * Offer Structure Interface
 */
export interface OfferStruct {
  takingOfferType: TakingOfferType;
  offerPrice: OfferPrice;
  specialAddresses: string[];
  authorizationAddresses: string[];
  expiryTimestamp: string;
  timelockPeriod: string;
  terms: string;
  commsLink: string;
}

/**
 * DOTC Offer Interface
 */
export interface DotcOffer {
  maker: string;
  offerFillType: OfferFillType;
  depositAsset: Asset;
  withdrawalAsset: Asset;
  offer: OfferStruct;
}

/**
 * Escrow Deposit Interface
 */
export interface EscrowDeposit {
  escrowOfferStatusType: EscrowOfferStatusType;
  depositAsset: Asset;
}
