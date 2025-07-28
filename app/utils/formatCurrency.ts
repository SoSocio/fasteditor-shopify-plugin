
/**
 * Formats number to compact currency format with custom decimal logic.
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const fixed = Number(amount.toFixed(2));
  return `${fixed} ${currency}`;
};
