import { useCallback, useMemo } from "react";

import { formatUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";

// Default locale and fiat currency constants
const DEFAULT_LOCALE = "en-US";
const DEFAULT_LOCAL_CURRENCY = "USD";

interface NumberFormatOptions extends Intl.NumberFormatOptions {}

// Example formatter options for common use cases
const TWO_DECIMALS: NumberFormatOptions = {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
};

export const THREE_DECIMALS: NumberFormatOptions = {
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
};

export const NO_DECIMALS: NumberFormatOptions = {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
};

// Utility for formatting numbers
function formatNumber(
  input: number | string | null | undefined,
  options: NumberFormatOptions = TWO_DECIMALS,
  locale: string = DEFAULT_LOCALE,
): string {
  if (input === null || input === undefined || isNaN(Number(input))) {
    return "-";
  }
  return new Intl.NumberFormat(locale, options).format(Number(input));
}

// Utility for formatting fiat currencies
function formatFiat(
  input: number | string | null | undefined,
  currency: string = DEFAULT_LOCAL_CURRENCY,
  locale: string = DEFAULT_LOCALE,
  options: NumberFormatOptions = TWO_DECIMALS,
): string {
  if (input === null || input === undefined || isNaN(Number(input))) {
    return "-";
  }
  return new Intl.NumberFormat(locale, { ...options, style: "currency", currency }).format(
    Number(input),
  );
}

// Utility for formatting percentages
function formatPercent(
  input: number | string | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  if (input === null || input === undefined || isNaN(Number(input))) {
    return "-";
  }
  return `${Number(input).toLocaleString(locale, { maximumFractionDigits: 2 })}%`;
}

// Utility for formatting Ethereum values (BigNumber)
function formatEther(
  input: BigNumber | string | number | null | undefined,
  decimals: number = 18,
): string {
  if (input === null || input === undefined) {
    return "-";
  }
  return formatUnits(input.toString(), decimals);
}

// Hook for reusable formatting functions
export function useFormatter() {
  const locale = DEFAULT_LOCALE;
  const localCurrency = DEFAULT_LOCAL_CURRENCY;

  const formatNumberWithLocale = useCallback(
    (input: number | string | null | undefined, options: NumberFormatOptions = TWO_DECIMALS) =>
      formatNumber(input, options, locale),
    [locale],
  );

  const formatFiatWithLocale = useCallback(
    (input: number | string | null | undefined, options: NumberFormatOptions = TWO_DECIMALS) =>
      formatFiat(input, localCurrency, locale, options),
    [localCurrency, locale],
  );

  const formatPercentWithLocale = useCallback(
    (input: number | string | null | undefined) => formatPercent(input, locale),
    [locale],
  );

  const formatEtherWithLocale = useCallback(
    (input: BigNumber | string | number | null | undefined, decimals: number = 18) =>
      formatEther(input, decimals),
    [],
  );

  return useMemo(
    () => ({
      formatNumber: formatNumberWithLocale,
      formatFiat: formatFiatWithLocale,
      formatPercent: formatPercentWithLocale,
      formatEther: formatEtherWithLocale,
    }),
    [formatNumberWithLocale, formatFiatWithLocale, formatPercentWithLocale, formatEtherWithLocale],
  );
}
