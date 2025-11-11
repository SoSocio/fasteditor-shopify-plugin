import React from 'react';
import type {ActiveSubscription} from "../../types/billing.types";
import {BlockStack, Box, Button, ProgressBar, Text} from '@shopify/polaris';
import {formatSimpleCurrency} from "../../utils/formatCurrency";

export const UsageSubscription = ({subscription, shopName}: {
  subscription: ActiveSubscription,
  shopName: string
}) => {
  const cappedAmount = subscription.appUsagePricing.cappedAmount.amount
  const balanceUsed = subscription.appUsagePricing.balanceUsed.amount
  const currency = subscription.appUsagePricing.cappedAmount.currencyCode
  const percent = (balanceUsed * 100) / cappedAmount

  const remainingAmount = formatSimpleCurrency(cappedAmount - balanceUsed, currency)

  const formatedBalanceUsed = formatSimpleCurrency(balanceUsed, currency)
  const formatedCappedAmount = formatSimpleCurrency(cappedAmount, currency)

  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">Current app spending limit</Text>
      <BlockStack gap="100">
        <Text as="h2">Remaining amount: {remainingAmount}</Text>
        <Box>
          <ProgressBar progress={percent} size="small"/>
        </Box>
        <Text as="p">{formatedBalanceUsed} spent | {formatedCappedAmount} limit</Text>
      </BlockStack>
      <Box>
        <Button
          url={`https://admin.shopify.com/store/${shopName}/settings/plan/subscriptions`}
          target="_top"
        >
          Change Limit
        </Button>
      </Box>
    </BlockStack>
  );
}

