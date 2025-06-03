import {
  CurrencyBalance,
  Perquintill,
  Price,
  Rate,
  TokenBalance,
  type CurrencyMetadata,
} from "@centrifuge/centrifuge-js";
import Decimal from "decimal.js-light";

export const getEllipsisTxt = (str: `0x${string}`, n: number = 6): string => {
  if (str) {
    return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
  }
  return "";
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatCurrency(amount: number) {
  // Handle very large numbers to prevent scientific notation display
  if (amount > 1000000) {
    // For values over 1 million, use abbreviated format
    if (amount > 1000000000) {
      // Billions
      return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount > 1000000) {
      // Millions
      return `${(amount / 1000000).toFixed(2)}M`;
    }
  }

  // For smaller numbers, use the standard currency formatter
  return CURRENCY_FORMATTER.format(amount);
}

/**
 * Formats a number into k (thousands), m (millions), and b (billions).
 *
 * @param {number} num - The number to format.
 * @returns {string} - The formatted number.
 */
export function formatAmount(num: number) {
  const moddedNum = Math.abs(num);
  if (moddedNum >= 1_000_000_000) {
    const number = moddedNum / 1_000_000_000;
    return (Number.isInteger(number) ? number : number.toFixed(2)) + "B";
  } else if (moddedNum >= 1_000_000) {
    const number = moddedNum / 1_000_000;
    return (Number.isInteger(number) ? number : number.toFixed(2)) + "M";
  } else if (moddedNum >= 1_000) {
    const number = moddedNum / 1_000;
    return (Number.isInteger(number) ? number : number.toFixed(2)) + "K";
  } else {
    return moddedNum.toString();
  }
}

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

export function shortenText(text: string, startChars = 4, endChars = 4, separator = "...") {
  // Check if the text is too short to shorten
  if (text.length <= startChars + endChars) {
    return text;
  }
  // Return the shortened version
  return text.substring(0, startChars) + separator + text.substring(text.length - endChars);
}

export function formatPercentage(
  amount: Perquintill | Decimal | number | string,
  includeSymbol = true,
  options: Intl.NumberFormatOptions = {},
  precision?: number,
) {
  const formattedAmount = (
    amount instanceof Rate || amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
        ? amount.toNumber()
        : Number(amount)
  ).toLocaleString("en", {
    minimumFractionDigits: precision || 2,
    maximumFractionDigits: precision || 2,
    ...options,
  });
  return includeSymbol ? `${formattedAmount}%` : formattedAmount;
}

export function formatBalance(
  amount: CurrencyBalance | TokenBalance | Price | Rate | Decimal | number,
  currency?: string | CurrencyMetadata,
  precision = 0,
  minPrecision = precision,
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
  ).toLocaleString("en", {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: precision,
  });
  return currency
    ? `${formattedAmount} ${typeof currency === "string" ? currency : currency.symbol}`
    : formattedAmount;
}

export function formatBalanceAbbreviated(
  amount: CurrencyBalance | TokenBalance | Decimal | number,
  currency?: string,
  decimals = 1,
) {
  const amountNumber =
    amount instanceof TokenBalance || amount instanceof CurrencyBalance
      ? amount.toFloat()
      : amount instanceof Decimal
        ? amount.toNumber()
        : amount;
  let formattedAmount = "";
  const absAmount = Math.abs(amountNumber);

  if (absAmount >= 1e9) {
    formattedAmount = `${(amountNumber / 1e9).toFixed(decimals)}B`;
  } else if (absAmount >= 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`;
  } else if (absAmount > 999) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`;
  } else {
    formattedAmount = `${amountNumber.toFixed(decimals)}`;
  }

  return currency ? `${formattedAmount} ${currency}` : formattedAmount;
}
