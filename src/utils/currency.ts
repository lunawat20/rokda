// CURRENCY & FINANCIAL MONEY UTILITIES
// All monetary values in Rokda are represented as integers in minor units (paise).
// 1 INR = 100 paise.

/**
 * Converts a decimal monetary amount (e.g. 100.50) to integer paise (10050).
 */
export function currencyToPaise(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Converts integer paise (10050) to decimal monetary value (100.50).
 */
export function paiseToCurrency(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Formats integer paise into standard Indian Rupee notation (e.g. ₹1,24,580 or ₹1,24,580.50).
 */
export function formatPaise(paise: number, options?: { showDecimal?: boolean; currencySymbol?: string }): string {
  const symbol = options?.currencySymbol ?? '₹';
  const showDec = options?.showDecimal ?? false;
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const mainUnits = Math.floor(absPaise / 100);
  const minorUnits = absPaise % 100;

  // Indian numbering format (e.g., 1,24,580)
  const formattedMain = mainUnits.toLocaleString('en-IN');
  const formattedMinor = minorUnits.toString().padStart(2, '0');

  const formattedStr = showDec || minorUnits > 0
    ? `${symbol}${formattedMain}.${formattedMinor}`
    : `${symbol}${formattedMain}`;

  return isNegative ? `-${formattedStr}` : formattedStr;
}

/**
 * Formats large amounts compactly (e.g. ₹3.84L or ₹1.2Cr).
 */
export function formatPaiseCompact(paise: number, symbol: string = '₹'): string {
  const isNegative = paise < 0;
  const rupees = Math.abs(paise) / 100;

  let formatted = '';
  if (rupees >= 10000000) {
    formatted = `${symbol}${(rupees / 10000000).toFixed(2)}Cr`;
  } else if (rupees >= 100000) {
    formatted = `${symbol}${(rupees / 100000).toFixed(2)}L`;
  } else if (rupees >= 1000) {
    formatted = `${symbol}${(rupees / 1000).toFixed(1)}k`;
  } else {
    formatted = `${symbol}${rupees.toFixed(0)}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Safely parses string inputs e.g. "124,580.50" -> 12458050 paise
 */
export function parseInputToPaise(input: string): number {
  if (!input) return 0;
  const clean = input.replace(/[^0-9.-]/g, '');
  const val = parseFloat(clean);
  return currencyToPaise(val);
}
