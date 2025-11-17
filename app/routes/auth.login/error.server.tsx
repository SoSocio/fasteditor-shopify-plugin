import type { LoginError } from "@shopify/shopify-app-remix/server";
import { LoginErrorType } from "@shopify/shopify-app-remix/server";

interface LoginErrorMessage {
  shop?: string;
}

/**
 * Returns translation keys for login errors
 * These keys should be translated on the client side using useTranslation
 */
export function loginErrorMessage(loginErrors: LoginError): LoginErrorMessage {
  if (loginErrors?.shop === LoginErrorType.MissingShop) {
    return { shop: "errors.login.missing-shop" };
  } else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
    return { shop: "errors.login.invalid-shop" };
  }

  return {};
}
