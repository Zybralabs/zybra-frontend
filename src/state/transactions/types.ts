import type { Asset, OfferStruct } from '@/types'
import { TradeType } from '@uniswap/sdk-core'


export interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values is persisted in state and if you change the value it will cause errors
 */
export enum TransactionType {
  APPROVAL = 0,
  DEPOSIT_STAKING,
  WITHDRAW_STAKING,
  COLLECT_FEES_STAKING,
  DEPOSIT,
  REQUEST_DEPOSIT,
  WITHDRAW,
  REQUEST_WITHDRAW,
  CANCEL_WITHDRAW_REQUEST,
  CANCEL_DEPOSIT_REQUEST,
  CLAIM_WITHDRAW,
  REPAY_DEBT,
  LIQUIDATION,
  MAKE_OFFER,
  TAKE_OFFER,
  WITHDRAW_OFFER,
  CLAIM_OFFER,
  CANCEL_OFFER,
  MINT_ZRUSD,
  COLLECT_FEES,
}

interface BaseTransactionInfo {
  type: TransactionType
}


export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVAL
  tokenAddress: string
  spender: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MAKE_OFFER
  tradeType: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
}



export interface DepositLiquidStakingTransactionInfo {
  type: TransactionType.DEPOSIT_STAKING
  amount: number 
}

export interface WithdrawLiquidStakingTransactionInfo {
  type: TransactionType.WITHDRAW_STAKING
  amount: number 

}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVAL;
  tokenAddress: string;
  spender: string;
}

/**
 * Deposit transaction to add collateral to a vault.
 */
export interface DepositTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.DEPOSIT;
  vaultAddress: string;
  amount: number;
  currencyId: string;
}

/**
 * Request to deposit funds in a delayed or time-locked manner.
 */
export interface RequestDepositTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.REQUEST_DEPOSIT;
  vaultAddress: string;
  amount: number;
  currencyId: string;
}

/**
 * Withdrawal transaction to retrieve collateral from a vault.
 */
export interface WithdrawTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.WITHDRAW;
  vaultAddress: string;
  amount: number;
}

/**
 * Request to withdraw collateral in a delayed or queued manner.
 */
export interface RequestWithdrawTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.REQUEST_WITHDRAW;
  vaultAddress: string;
  amount: number;
}

/**
 * Cancel a queued withdraw request.
 */
export interface CancelWithdrawRequestTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CANCEL_WITHDRAW_REQUEST;
  vaultAddress: string;
}

/**
 * Cancel a queued deposit request.
 */
export interface CancelDepositRequestTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CANCEL_DEPOSIT_REQUEST;
  vaultAddress: string;
}

/**
 * Claim a previously canceled withdraw request.
 */
export interface ClaimWithdrawTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CLAIM_WITHDRAW;
  vaultAddress: string;
}

/**
 * Repay debt using the custom token (ZrUSD).
 */
export interface RepayDebtTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.REPAY_DEBT;
  vaultAddress: string;
  amount: number;
}

/**
 * Liquidation of an under-collateralized position.
 */
export interface LiquidationTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.LIQUIDATION;
  vaultAddress: string;
  userAddress: string;
  amount: number;
  keeperReward?: string;
}

/**
 * Mint new ZrUSD tokens against collateral.
 */
export interface MintZRUSDTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MINT_ZRUSD;
  vaultAddress: string;
  amount: number;
}

/**
 * Governance proposal execution.
 */


/**
 * Swap offer creation for DOTC functionality.
 */
export interface MakeOfferTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MAKE_OFFER;
  amount: number;
  zrusdDebt: number;
  withdrawalAsset: Asset;
  offer: OfferStruct;
}

export interface TakeOfferTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.TAKE_OFFER;
  amount: number;
  offerId: number;
  mintAmount: number;
  isDynamic: boolean;
  maximumRate: number;
}

export interface WithdrawOfferTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.WITHDRAW_OFFER;
  amount: number;
  offerId: number;
  mintAmount: number;
  isDynamic: boolean;
  maximumRate: number;
}

export interface ClaimOfferTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CLAIM_OFFER;
  offerId: number;
  zrusdDebt: number;
}
export interface CancelfferTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.CANCEL_OFFER;
  offerId: number;
  zrusdDebt: number;
}



/**
 * Collect accrued fees from a vault or system operation.
 */
export interface CollectFeesTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.COLLECT_FEES;
  vaultAddress: string;
  currencyId0: string;
  feesCollected0: string;
}

export interface CollectFeesStakingTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.COLLECT_FEES_STAKING;
  amount: number;

}

/**
 * Defines the possible transaction info types.
 */
export type TransactionInfo =
  | ApproveTransactionInfo
  | DepositTransactionInfo
  | RequestDepositTransactionInfo
  | WithdrawTransactionInfo
  | RequestWithdrawTransactionInfo
  | CancelWithdrawRequestTransactionInfo
  | CancelDepositRequestTransactionInfo
  | ClaimWithdrawTransactionInfo
  | RepayDebtTransactionInfo
  | LiquidationTransactionInfo
  | MintZRUSDTransactionInfo
  | MakeOfferTransactionInfo
  | ClaimOfferTransactionInfo
  | CancelfferTransactionInfo
  | TakeOfferTransactionInfo
  | DepositLiquidStakingTransactionInfo
  | WithdrawLiquidStakingTransactionInfo
  | CollectFeesStakingTransactionInfo
  | WithdrawOfferTransactionInfo
  | CollectFeesTransactionInfo;

export interface TransactionDetails {
  hash: string
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  info: TransactionInfo
}
