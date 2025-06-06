
// interface FormatLocaleNumberArgs {
//   number: number;
//   locale?: string | null;
//   options?: Intl.NumberFormatOptions;
//   sigFigs?: number;
//   fixedDecimals?: number;
// }

// export default function formatLocaleNumber({
//   number,
//   locale,
//   sigFigs,
//   fixedDecimals,
//   options = {},
// }: FormatLocaleNumberArgs): string {
//   let localeArg: string | string[];
//   const isSupportedLocale = locale && Object.values(Locale).includes(locale as Locale);
//   if (!isSupportedLocale) {
//     localeArg = DEFAULT_LOCALE;
//   } else {
//     localeArg = [locale, DEFAULT_LOCAL];
//   }
//   options.minimumFractionDigits = options.minimumFractionDigits || fixedDecimals;
//   options.maximumFractionDigits = options.maximumFractionDigits || fixedDecimals;

//   // Fixed decimals should override significant figures.
//   options.maximumSignificantDigits =
//     options.maximumSignificantDigits || fixedDecimals ? undefined : sigFigs;

//   const numberString = fixedDecimals ? parseFloat(number.toFixed(fixedDecimals)) : number;

//   return numberString.toLocaleString(localeArg, options);
// }
