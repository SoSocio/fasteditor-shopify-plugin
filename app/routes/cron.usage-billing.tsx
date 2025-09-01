import {processMonthlyUsageBilling} from "../services/usageBilling.server";

const ENDPOINT = "cron/usage-billing"

/**
 * GET requests are not allowed on this endpoint.
 */
export const loader = async (): Promise<Response> => {
  try {
    await processMonthlyUsageBilling()
    console.info(`[${ENDPOINT}] Monthly usage billing completed successfully.`);

    return new Response("Billing run completed.", {status: 200});
  } catch (error: any) {
    console.error(`[${ENDPOINT}] Error during billing run:`, error?.message ?? error);
    return new Response("Internal Server Error", {status: 500});
  }
};

export const action = async (): Promise<Response> => {
  try {
    await processMonthlyUsageBilling()
    console.info(`[${ENDPOINT}] Monthly usage billing completed successfully.`);

    return new Response("Billing run completed.", {status: 200});
  } catch (error: any) {
    console.error(`[${ENDPOINT}] Error during billing run:`, error?.message ?? error);
    return new Response("Internal Server Error", {status: 500});
  }
};
