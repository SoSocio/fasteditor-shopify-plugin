import type {authenticate, unauthenticated} from "../shopify.server";

export interface AppInfo {
  title: string;
  handle: string;
}

interface AppSubscriptionLineItem {
  id: string;
  plan: {
    pricingDetails: {
      __typename: "AppUsagePricing" | "AppRecurringPricing";
    }
  }
}

export interface AppSubscription {
  id: string;
  name: string;
  lineItems: AppSubscriptionLineItem[];
}

export interface CurrentAppInstallationResponse {
  currentAppInstallation: {
    activeSubscriptions: AppSubscription[];
  };
}

export interface AppByKeyResponse {
  appByKey: AppInfo;
}

export type unauthenticatedAdmin = Awaited<ReturnType<typeof unauthenticated.admin>>["admin"]

export type authenticateAdmin = Awaited<ReturnType<typeof authenticate.admin>>["admin"]
