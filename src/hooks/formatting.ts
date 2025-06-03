import { CurrencyBalance, type CurrencyMetadata, Perquintill, Price, Rate, TokenBalance } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from 'ethers';

export function formatBalance(
  amount: CurrencyBalance | TokenBalance | Price | Rate | Decimal | number,
  currency?: string | CurrencyMetadata,
  precision = 0,
  minPrecision = precision
) {
  const formattedAmount = (
    amount instanceof TokenBalance ||
    amount instanceof CurrencyBalance ||
    amount instanceof Price ||
    amount instanceof Rate
      ? amount.toFloat()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  ).toLocaleString('en', {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: precision,
  })
  return currency ? `${formattedAmount} ${typeof currency === 'string' ? currency : currency.symbol}` : formattedAmount
}

export function formatBalanceAbbreviated(
  amount: CurrencyBalance | TokenBalance | Decimal | number,
  currency?: string,
  decimals = 1
) {
  const amountNumber =
    amount instanceof TokenBalance || amount instanceof CurrencyBalance
      ? amount.toFloat()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  let formattedAmount = ''
  const absAmount = Math.abs(amountNumber)

  if (absAmount >= 1e9) {
    formattedAmount = `${(amountNumber / 1e9).toFixed(decimals)}B`
  } else if (absAmount >= 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`
  } else if (absAmount > 999) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`
  } else {
    formattedAmount = `${amountNumber.toFixed(decimals)}`
  }

  return currency ? `${formattedAmount} ${currency}` : formattedAmount
}

export function formatPercentage(
  amount: Perquintill | Decimal | number | string,
  includeSymbol = true,
  options: Intl.NumberFormatOptions = {},
  precision?: number
) {
  const formattedAmount = (
    amount instanceof Rate || amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
      ? amount.toNumber()
      : Number(amount)
  ).toLocaleString('en', {
    minimumFractionDigits: precision || 2,
    maximumFractionDigits: precision || 2,
    ...options,
  })
  return includeSymbol ? `${formattedAmount}%` : formattedAmount
}

export function roundDown(float: Decimal | number, precision: number = 2) {
  return Math.floor((float instanceof Decimal ? float.toNumber() : float) * 10 ** precision) / 10 ** precision
}

export function truncateText(txt: string, len: number) {
  if (txt.length > len) {
    return `${txt.slice(0, len)}...`
  }
  return txt
}
export const toWei = (amount: number) => {
  return BigNumber.from(
    ethers.parseUnits(amount.toString(), 18).toString()
  );
 };

 export const fromWei = (weiAmount: string | number | bigint, decimal:string | number | undefined  = 18): number => {
  try {
    if (!weiAmount) return 0;

    // Handle scientific notation by converting to a regular string first
    let weiString = weiAmount.toString();

    // If the string contains scientific notation (e.g., 1.763041875e+21)
    if (weiString.includes('e')) {
      // Parse the scientific notation
      const parts = weiString.split('e');
      const base = parseFloat(parts[0]);
      const exponent = parseInt(parts[1].replace('+', ''));

      // Convert to a regular number string without scientific notation
      if (exponent >= 0) {
        // For positive exponents (large numbers)
        weiString = base.toFixed(20).replace('.', '').substring(0, exponent + 1);
        // Pad with zeros if needed
        weiString = weiString.padEnd(exponent + 1, '0');
      } else {
        // For negative exponents (small numbers) - unlikely for wei values
        weiString = '0.' + '0'.repeat(Math.abs(exponent) - 1) + base.toFixed(20).replace('.', '');
      }
    }

    // Convert to bigint after handling scientific notation
    const bigIntAmount = BigInt(weiString);

    // Format to ether (divide by 10^18)
    const etherAmount = ethers.formatUnits(bigIntAmount, decimal);

    // Parse as float
    const floatValue = parseFloat(etherAmount);

    // For very large or very small numbers that might be represented in scientific notation,
    // we want to ensure they're displayed properly
    if (Math.abs(floatValue) < 0.000001 && floatValue !== 0) {
      // For very small numbers, return with more precision
      return parseFloat(floatValue.toFixed(10));
    } else if (floatValue > 1000000) {
      // For very large numbers, limit decimal places
      return parseFloat(floatValue.toFixed(2));
    }

    // Return the parsed float value
    return floatValue;
  } catch (error) {
    console.error('Error formatting wei to ether:', error, 'Input:', weiAmount);
    return 0;
  }
};
