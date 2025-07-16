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
