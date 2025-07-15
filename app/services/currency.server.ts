import {
  createCurrencyRates,
  findCurrencyRate,
  updateCurrencyRates
} from "../models/currencyRates.server";
import {Decimal} from "@prisma/client/runtime/library";

/**
 * Triggers initial creation of currency rates from external API.
 */
export async function createCurrency() {
  const rates = await fetchAndParseCurrencyRates()
  const createdCount = await createCurrencyRates(rates);
  console.log("Created currency rates:", createdCount);
}

/**
 * Updates all existing currency rates from external API.
 */
export async function updateCurrency() {
  const rates = await fetchAndParseCurrencyRates()
  const updatedCount = await updateCurrencyRates(rates);
  console.log("Updated currency rates:", updatedCount);
}

/**
 * Fetches and transforms currency rates from the third-party API.
 * @returns Array of objects containing currency code, rate, and base.
 */
async function fetchAndParseCurrencyRates(): Promise<{
  code: string;
  rate: number;
  base: string
}[]> {
  const response = await fetch(
    `${process.env.CURRENCY_API}?access_key=${process.env.CURRENCY_API_ACCESS_KEY}&base=EUR`
  );

  if (!response.ok) {
    console.error("Currency API request failed");
    throw new Error(response.statusText);
  }

  const responseJson = await response.json();
  const rates: Record<string, number> = responseJson.rates;
  const baseCurrency = responseJson.base ?? "EUR";

  return Object.entries(rates).map(([code, rate]) => ({
    code,
    rate,
    base: baseCurrency,
  }));
}

/**
 * Converts amount from given currency to EUR using stored rate.
 * @param currency - Currency code to convert from.
 * @param amount - Amount to convert.
 * @returns Converted amount rounded to 2 decimal places.
 */
export async function convertToEUR(currency: string, amount: number): Promise<any> {
  if (currency === "EUR") {
    return parseFloat(amount.toFixed(2));
  }

  const rateData = await findCurrencyRate(currency);
  if (!rateData) {
    throw new Error(`Currency rate for ${currency} to EUR not found`);
  }

  const converted = new Decimal(amount).div(rateData.rate);
  return parseFloat(converted.toDecimalPlaces(2).toString());
}
