import type { CallResult, CallState, ListenerOptions } from '@/types'
import { Percent } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { SupportedChainId } from './addresses'
import ms from 'ms'
import { isPlain } from '@reduxjs/toolkit'
import { deepCopy } from '@ethersproject/properties'

export const DEFAULT_BLOCKS_PER_FETCH = 1
export const DEFAULT_CALL_GAS_REQUIRED = 1_000_000
export const DEFAULT_CHUNK_GAS_REQUIRED = 200_000
export const CHUNK_GAS_LIMIT = 100_000_000
export const CONSERVATIVE_BLOCK_GAS_LIMIT = 10_000_000 // conservative, hard-coded estimate of the current block gas limit

// Consts for hooks
export const INVALID_RESULT: CallResult = {
  valid: false, blockNumber: undefined, data: undefined,
  map: function (arg0: (result: CallResult | undefined) => CallState): CallState[] {
    throw new Error('Function not implemented.')
  }
}
export const NEVER_RELOAD: ListenerOptions = {
  blocksPerFetch: Infinity,
}

export const INVALID_CALL_STATE: CallState = {
  valid: false,
  result: undefined,
  loading: false,
  syncing: false,
  error: false,
}
export const LOADING_CALL_STATE: CallState = {
  valid: true,
  result: undefined,
  loading: true,
  syncing: true,
  error: false,
}


export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// TODO(WEB-1984): Convert the deadline to minutes and remove unecessary conversions from
// seconds to minutes in the codebase.
// 10 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 10
export const L2_DEADLINE_FROM_NOW = 60 * 5

// transaction popup dismissal amounts
export const DEFAULT_TXN_DISMISS_MS = 10000
export const L2_TXN_DISMISS_MS = 5000

export const BIG_INT_ZERO = JSBI.BigInt(0)

export const BIPS_BASE = 10_000

// one basis JSBI.BigInt
export const ONE_BIPS = new Percent(JSBI.BigInt(1), BIPS_BASE)

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(1, 100) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(3, 100) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(5, 100) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(10, 100) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(15, 100) // 15%

export const ZERO_PERCENT = new Percent(0)
export const ONE_HUNDRED_PERCENT = new Percent(1)


export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.Base_Mainnet]: 'Base mainnet',
  [SupportedChainId.Testnet]: 'Base testnet',
  [SupportedChainId.Mainnet]: 'Mainnet',
  [SupportedChainId.Polygon_Mainnet]: 'Polygon mainnet',
  
}
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

export const RPC_URLS = {
  [SupportedChainId.Base_Mainnet]: [
    `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ],
  [SupportedChainId.Mainnet]: [
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ],
  [SupportedChainId.Polygon_Mainnet]: [
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ],
  [SupportedChainId.Testnet]: [
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ]
} as const

export const AVERAGE_L1_BLOCK_TIME = ms("12s")

class AppJsonRpcProvider extends StaticJsonRpcProvider {
  private _blockCache = new Map<string, Promise<any>>()
  get blockCache() {
    // If the blockCache has not yet been initialized this block, do so by
    // setting a listener to clear it on the next block.
    if (!this._blockCache.size) {
      this.once('block', () => this._blockCache.clear())
    }
    return this._blockCache
  }

  constructor(chainId: SupportedChainId) {
    // Including networkish allows ethers to skip the initial detectNetwork call.
    super(RPC_URLS[chainId][0], /* networkish= */ { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers (eg AppJsonRpcProvider) need to update less frequently to be considered responsive.
    this.pollingInterval = AVERAGE_L1_BLOCK_TIME
  }

  send(method: string, params: Array<any>): Promise<any> {
    // Only cache eth_call's.
    if (method !== 'eth_call') return super.send(method, params)

    // Only cache if params are serializable.
    if (!isPlain(params)) return super.send(method, params)

    const key = `call:${JSON.stringify(params)}`
    const cached = this.blockCache.get(key)
    if (cached) {
      this.emit('debug', {
        action: 'request',
        request: deepCopy({ method, params, id: 'cache' }),
        provider: this,
      })
      return cached
    }

    const result = super.send(method, params)
    this.blockCache.set(key, result)
    return result
  }
}


export const RPC_PROVIDERS: { [key in SupportedChainId]: StaticJsonRpcProvider } = {
  [SupportedChainId.Base_Mainnet]: new AppJsonRpcProvider(SupportedChainId.Base_Mainnet),
  [SupportedChainId.Mainnet]: new AppJsonRpcProvider(SupportedChainId.Mainnet),
  [SupportedChainId.Polygon_Mainnet]: new AppJsonRpcProvider(SupportedChainId.Polygon_Mainnet),
  [SupportedChainId.Testnet]: new AppJsonRpcProvider(SupportedChainId.Testnet),
}