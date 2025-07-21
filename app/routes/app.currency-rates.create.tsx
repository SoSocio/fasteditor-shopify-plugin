import type {LoaderFunctionArgs} from "@remix-run/node";
import {fetchAndParseCurrencyRates} from "../services/currency.server";
import {loaderMethodNotAllowed} from "../services/app.server";
import {createCurrencyRates} from "../models/currencyRates.server";

const ENDPOINT = "/app/currency-rate/create"

/**
 * GET requests are not allowed on this endpoint.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<void> => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT})
};

/**
 * Handles POST requests to create currency exchange rates in the database.
 */
export const action = async (): Promise<Response> => {
  console.info(`[${ENDPOINT}] Initiating currency rate creation...`);

  try {
    const rates = await fetchAndParseCurrencyRates()
    const createdCount = await createCurrencyRates(rates);
    console.info(`[${ENDPOINT}] Created ${createdCount} new currency rate record(s).`);

    return new Response("Currency rates created successfully.", {status: 200});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Failed to create currency rates:`, message);

    return new Response("Internal Server Error while creating currency rates.", {
      status: 500,
    });
  }
};
