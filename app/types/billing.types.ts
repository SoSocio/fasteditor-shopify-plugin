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
