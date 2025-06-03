import { arrayify } from "@ethersproject/bytes";
import { parseBytes32String } from "@ethersproject/strings";
import { type Currency, Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";

import { isAddress } from "../../utils";
import { useSupportedChainId } from "@/hooks/useChain";
import { DEFAULT_ERC20_DECIMALS, TOKEN_SHORTHANDS } from "@/constant/tokens";
import { NEVER_RELOAD, useSingleCallResult } from "./multicall";
import { useBytes32TokenContract, useERC20TokenContract } from "@/hooks/useContract";
import { useChainId } from "wagmi";

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;

function parseStringOrBytes32(
  str: string | undefined,
  bytes32: string | undefined,
  defaultValue: string,
): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
      bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
      ? parseBytes32String(bytes32)
      : defaultValue;
}

export const UNKNOWN_TOKEN_SYMBOL = "UNKNOWN";
const UNKNOWN_TOKEN_NAME = "Unknown Token";

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromActiveNetwork(
  tokenAddress: string | undefined,
): Token | undefined {
  const chainId = useChainId();

  const formattedAddress = isAddress(tokenAddress);
  const tokenContract = useERC20TokenContract(formattedAddress ?? '', false);
  const tokenContractBytes32 = useBytes32TokenContract(formattedAddress ?? '', false);
  
  // Then check conditionally
  const activeTokenContract = formattedAddress ? tokenContract : null;
  const activeTokenContractBytes32 = formattedAddress ? tokenContractBytes32 : null;

  // TODO: Fix redux-multicall so that these values do not reload.
  //@ts-ignore
  const tokenName = useSingleCallResult(activeTokenContractBytes32, "name", undefined, NEVER_RELOAD);
  //@ts-ignore
  const tokenNameBytes32 = useSingleCallResult(
  //@ts-ignore

    activeTokenContractBytes32,
    "name",
    undefined,
    NEVER_RELOAD,
  );
  //@ts-ignore

  const symbol = useSingleCallResult(activeTokenContractBytes32, "symbol", undefined, NEVER_RELOAD);
  //@ts-ignore

  const symbolBytes32 = useSingleCallResult(
  //@ts-ignore
    activeTokenContractBytes32,
    "symbol",
    undefined,
    NEVER_RELOAD,
  );
  //@ts-ignore

  const decimals = useSingleCallResult(activeTokenContractBytes32, "decimals", undefined, NEVER_RELOAD);

  const isLoading = useMemo(
    () => decimals.loading || symbol.loading || tokenName.loading,
    [decimals.loading, symbol.loading, tokenName.loading],
  );
  const parsedDecimals = useMemo(
    () => decimals?.result?.[0] ?? DEFAULT_ERC20_DECIMALS,
    [decimals.result],
  );

  const parsedSymbol = useMemo(
    () => parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], UNKNOWN_TOKEN_SYMBOL),
    [symbol.result, symbolBytes32.result],
  );
  const parsedName = useMemo(
    () =>
      parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], UNKNOWN_TOKEN_NAME),
    [tokenName.result, tokenNameBytes32.result],
  );

  return useMemo(() => {
    // If the token is on another chain, we cannot fetch it on-chain, and it is invalid.
    if (typeof tokenAddress !== "string" || !useSupportedChainId(chainId) || !formattedAddress)
      return undefined;
    if (isLoading || !chainId) return undefined;

    return new Token(chainId, formattedAddress, parsedDecimals, parsedSymbol, parsedName);
  }, [
    chainId,
    tokenAddress,
    formattedAddress,
    isLoading,
    parsedDecimals,
    parsedSymbol,
    parsedName,
  ]);
}

type TokenMap = { [address: string]: Token };

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromMapOrNetwork(
  tokens: TokenMap,
  tokenAddress?: string | null,
): Token | null | undefined {
  const address = isAddress(tokenAddress);
  const token: Token | undefined = address ? tokens[address] : undefined;
  const tokenFromNetwork = useTokenFromActiveNetwork(
    token ? undefined : address ? address : undefined,
  );

  return tokenFromNetwork ?? token;
}

/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
export function useCurrencyFromMap(
  tokens: TokenMap,
  currencyId?: string | null,
): Currency | null | undefined {
  const chainId = useChainId();
  const shorthandMatchAddress = useMemo(() => {
    const chain = useSupportedChainId(chainId);
    return chain && currencyId ? TOKEN_SHORTHANDS[currencyId.toUpperCase()]?.[chain] : undefined;
  }, [chainId, currencyId]);

  const token = useTokenFromMapOrNetwork(tokens, shorthandMatchAddress ?? currencyId);

  if (currencyId === null || currencyId === undefined || !useSupportedChainId(chainId)) return null;

  // this case so we use our builtin wrapped token instead of wrapped tokens on token lists

  return token;
}
