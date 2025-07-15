import type {LoaderFunctionArgs} from "@remix-run/node";
import {loaderMethodNotAllowed} from "../errors/loaderMethodNotAllowed";
import {createCurrency} from "../services/currency.server";

const ENDPOINT = "cron/currency-rate"

export const loader = async ({request}: LoaderFunctionArgs): Promise<void> => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT})
};

export const action = async (): Promise<Response> => {
  try {
    await createCurrency()

    return new Response("Currency updated.", {status: 200});
  } catch (error) {
    console.error(`[${ENDPOINT}] Currency updated failed:`, error);
    return new Response("Internal Server Error", {status: 500});
  }
};
