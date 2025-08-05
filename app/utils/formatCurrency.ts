/**
 * Formats number to compact currency format with custom decimal logic.
 */
export function formatSimpleCurrency(amount: number, currency: string): string {
  const fixed = Number(amount).toFixed(2);
  return `${fixed} ${currency}`;
}


/**
 * Formats number to localized currency.
 *
 * @param amount - Raw numeric value
 * @param currencyCode - ISO 4217 currency code
 * @param locale - BCP 47 locale string
 * @returns Localized currency string
 */
export function formatCurrency(amount: number, currencyCode: string | null, locale: string | null): string {
  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}
