import type {Decimal} from "@prisma/client/runtime/library";
import prisma from "../db.server";

/**
 * Currency rate record as stored in the database.
 */
interface CurrencyRate {
  id: string;
  code: string;
  rate: Decimal;
  base: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Creates multiple records in the `CurrencyRates` table.
 *
 * @param rates - Array of currency rate objects to create.
 * @returns Number of created records.
 */
export async function createCurrencyRates(
  rates: { code: string; rate: number; base: string }[]
): Promise<number> {
  const result = await prisma.currencyRates.createMany({
    data: rates,
  });

  return result.count;
}

/**
 * Updates multiple currency rates using Prisma transaction.
 *
 * @param rates - Array of currency rates to update with new values.
 * @returns Number of updated records.
 */
export async function updateCurrencyRates(
  rates: { code: string; rate: number; }[]
): Promise<number> {
  const result = await prisma.$transaction(
    rates.map(({code, rate}) =>
      prisma.currencyRates.update({
        where: {code},
        data: {rate},
      })
    )
  );

  return result.length;
}

/**
 * Finds a specific currency rate for a given currency code.
 *
 * @param code - The currency code.
 * @returns CurrencyRate object or null if not found.
 */
export async function findCurrencyRate(code: string): Promise<CurrencyRate | null> {
  return await prisma.currencyRates.findUnique({
    where: {code},
  });
}
