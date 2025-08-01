export const APP_CLIENT_ID = String(process.env.SHOPIFY_API_KEY ?? "");
export const MIN_FEE_EUR = 4;
export const FEE_RATE = 0.02;
export const IS_TEST_BILLING = Boolean(process.env.TEST_BILLING);
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@test.com";
