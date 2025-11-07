export const APP_CLIENT_ID = String(process.env.SHOPIFY_API_KEY ?? "");
export const MAX_FEE_EUR = 4;
export const FEE_RATE = 0.02;
export const IS_TEST_BILLING = String(process.env.TEST_BILLING) === "true";
export const SUPPORT_EMAIL = String(process.env.SUPPORT_EMAIL ?? "support@test.com");
export const MS_IN_DAY = 24 * 60 * 60 * 1000;
