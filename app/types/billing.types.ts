export interface UsagePrice {
  amount: number;
  currencyCode: string;
}

export interface CreateAppUsageRecordResponse {
  appUsageRecordCreate: {
    userErrors: {
      field: string;
      message: string;
    }
    appUsageRecord: {
      id: string;
    }
  }
}

export interface UnbilledOrderItem {
  usageFee: number;
}

export interface AppRecurringPricing {
  price: {
    amount: number;
    currencyCode: string;
  }
}

export interface AppUsagePricing {
  balanceUsed: {
    amount: number;
    currencyCode: string;
  }
  cappedAmount: {
    amount: number;
    currencyCode: string;
  }
  terms: string;
}

export interface ActiveSubscription {
  id: string;
  name: string;
  status: string;
  trialDays: number;
  createdAt: string;
  currentPeriodEnd: string;
  appRecurringPricing: AppRecurringPricing;
  appUsagePricing: AppUsagePricing;
}
