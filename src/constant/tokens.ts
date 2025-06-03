import { type Currency, Ether, NativeCurrency, Token, WETH9 } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import { SupportedChainId } from './addresses'


export const NATIVE_CHAIN_ID = 'NATIVE'

// When decimals are not specified for an ERC20 token
// use default ERC20 token decimals as specified here:
// https://docs.openzeppelin.com/contracts/3.x/erc20
export const DEFAULT_ERC20_DECIMALS = 18

export const USDC_BASE_MAINNET = new Token(
  SupportedChainId.Base_Mainnet,
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  6,
  'USDC',
  'USD//C'
)

export const USDC_MAINNET = new Token(
  SupportedChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C'
)


class ExtendedEther extends Ether {


  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}


const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}

export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  const nativeCurrency: NativeCurrency | Token= ExtendedEther.onChain(chainId)

  return (cachedNativeCurrency[chainId] = nativeCurrency)
}








export const TOKEN_SHORTHANDS: { [shorthand: string]: { [chainId in SupportedChainId]?: string } } = {
  USDC: {
    [SupportedChainId.Base_Mainnet]: USDC_BASE_MAINNET.address,
    [SupportedChainId.Mainnet]: USDC_MAINNET.address
  },
}
