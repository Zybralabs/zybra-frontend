
import { Interface } from '@ethersproject/abi'
import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import ERC20ABI from '../../abis/ERC20.json'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useMulticall } from '../../hooks/useContract'
import { isAddress } from '../../utils'
import { useMultipleContractSingleData, useSingleContractMultipleData } from './multicall'
import { nativeOnChain } from '@/constant/tokens'
import { useChainId } from 'wagmi'
import { ZERO_ADDRESS } from '@/constant/constant'



/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useNativeCurrencyBalances(uncheckedAddresses?: (string | undefined)[]): {
  [address: string]: CurrencyAmount<Currency> | undefined
} {
  const  chainId  = useChainId()
  const multicallContract = useMulticall()

  const validAddressInputs: [string][] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => !!!a)
            .sort()
            .map((addr) => [addr])
        : [],
    [uncheckedAddresses]
  )
//@ts-ignore
  const results = useSingleContractMultipleData(multicallContract, 'getEthBalance', validAddressInputs)

  return useMemo(
    () =>
      validAddressInputs.reduce<{ [address: string]: CurrencyAmount<Currency> }>((memo, [address], i) => {
        const value = results?.[i]?.result?.[0]
        if (value && chainId)
          memo[address] = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), JSBI.BigInt(value.toString()))
        return memo
      }, {}),
    [validAddressInputs, chainId, results]
  )
}

const ERC20Interface = new Interface(ERC20ABI)
const tokenBalancesGasRequirement = { gasRequired: 185_000 }

export const useTokenBalancess = (
  validatedTokenAddresses: (string | undefined)[],
  address: string | undefined
) => {
  // Ensure chain consistency

  // Memoize address to prevent unnecessary re-renders
  const memoizedAddress = useMemo(() => address ?? ZERO_ADDRESS, [address]);

  // Memoize validated token addresses to prevent unnecessary re-renders
  const memoizedTokenAddresses = useMemo(() =>
    validatedTokenAddresses.filter(Boolean),
    // Using JSON.stringify for deep comparison of array contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(validatedTokenAddresses)]
  );

  // Memoize token balance call arguments
  const balanceCallArgs = useMemo(() =>
    memoizedAddress ? [memoizedAddress] : [],
    [memoizedAddress]
  );

  // Fetch multiple contract single data with memoized parameters
  const balances = useMultipleContractSingleData(
    memoizedTokenAddresses,
    ERC20Interface,
    'balanceOf',
    balanceCallArgs,
    tokenBalancesGasRequirement
  );

  // Memoize loading state
  const anyLoading = useMemo(() =>
    balances.some((callState) => callState.loading),
    [balances]
  );

  // Comprehensive memoized result processing
  return useMemo(() => {
    // Early return if no address or no tokens
    if (!memoizedAddress || memoizedTokenAddresses.length === 0) {
      return [{}, false];
    }

    // Process token balances
    const tokenBalancesMap = memoizedTokenAddresses.reduce<{
      [tokenAddress: string]: string | undefined
    }>((memo, tokenAddress, index) => {
      try {
        const value = balances?.[index]?.result?.[0];

        // Ensure valid value
        if (value) {
          const amount = JSBI.BigInt(value.toString());
          if (tokenAddress) {
            memo[tokenAddress] = amount.toString();
          }
        }
      } catch (error) {
        console.error(`Error processing balance for token ${tokenAddress}:`, error);
      }

      return memo;
    }, {});

    return [tokenBalancesMap, anyLoading];
  }, [anyLoading, balances, memoizedAddress, memoizedTokenAddresses]);
};


/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }, boolean] {
  const  chainId  = useChainId() // we cannot fetch balances cross-chain
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => !!!t?.address && t?.chainId === chainId) ?? [],
    [chainId, tokens]
  )
  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])

  const balances = useMultipleContractSingleData(
    validatedTokenAddresses,
    ERC20Interface,
    'balanceOf',
    useMemo(() => [address], [address]),
    tokenBalancesGasRequirement
  )

  const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances])

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
            }
            return memo
          }, {})
        : {},
      anyLoading,
    ],
    [address, validatedTokens, anyLoading, balances]
  )
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  const tokenBalances = useTokenBalances(
    account,
    [token]
  )
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount<Currency> | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? [],
    [currencies]
  )

  const  chainId  = useChainId()
  const tokenBalances = useTokenBalances(account, tokens)
  const containsETH: boolean = useMemo(() => currencies?.some((currency) => currency?.isNative) ?? false, [currencies])
  const ethBalance = useNativeCurrencyBalances(useMemo(() => (containsETH ? [account] : []), [containsETH, account]))

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency || currency.chainId !== chainId) return undefined
        if (currency.isToken) return tokenBalances[currency.address]
        if (currency.isNative) return ethBalance[account]
        return undefined
      }) ?? [],
    [account, chainId, currencies, ethBalance, tokenBalances]
  )
}

export default function useCurrencyBalance(
  account?: string,
  currency?: Currency
): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency])
  )[0]
}

export function useCurrencyBalanceString(account: string): string {
  return useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']?.toSignificant(3) ?? ''
}