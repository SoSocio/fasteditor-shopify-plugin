import type {LoaderFunctionArgs} from "@remix-run/node";
import {fetchAndParseCurrencyRates} from "../services/currency.server";
import {loaderMethodNotAllowed} from "../services/app.server";
import {updateCurrencyRates} from "../models/currencyRates.server";

const ENDPOINT = "/cron/currency-rates/update"

/**
 * GET requests are not allowed on this endpoint.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<void> => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT})
};

/**
 * Handles POST requests to update currency exchange rates in the database.
 */
export const action = async (): Promise<Response> => {
  console.info(`[${ENDPOINT}] Starting currency rate update...`);

  try {
    const rates = await fetchAndParseCurrencyRates()
    const updatedCount = await updateCurrencyRates(rates);
    console.info(`[${ENDPOINT}] Successfully updated ${updatedCount} currency rate(s).`);

    return new Response("Currency rates updated successfully.", {status: 200});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Failed to update currency rates:`, message);

    return new Response("Internal Server Error while updating currency rates.", {
      status: 500,
    });
  }
};
