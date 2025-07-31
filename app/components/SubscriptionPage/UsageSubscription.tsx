import {BlockStack, Box, Button, ProgressBar, Text} from '@shopify/polaris';
import React from 'react';
import type {ActiveSubscription} from "../../types/billing.types";

export const UsageSubscription = ({subscription, shopName}: {
  subscription: ActiveSubscription,
  shopName: string
}) => {
  const percent = (subscription.appUsagePricing.balanceUsed.amount * 100) / subscription.appUsagePricing.cappedAmount.amount
  const remainingAmount = Number(subscription.appUsagePricing.cappedAmount.amount - subscription.appUsagePricing.balanceUsed.amount).toFixed(2) + " " + subscription.appUsagePricing.cappedAmount.currencyCode

  const balanceUsed = `${subscription.appUsagePricing.balanceUsed.amount} ${subscription.appUsagePricing.balanceUsed.currencyCode}`
  const cappedAmount = `${subscription.appUsagePricing.cappedAmount.amount} ${subscription.appUsagePricing.cappedAmount.currencyCode}`

  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">Current app spending limit</Text>
      <BlockStack gap="100">
        <Text as="h2">Remaining amount: {remainingAmount}</Text>
        <Box>
          <ProgressBar progress={percent} size="small"/>
        </Box>
        <Text as="p">{balanceUsed} spent | {cappedAmount} limit</Text>
      </BlockStack>
      <Box>
        <Button
          url={`https://admin.shopify.com/store/${shopName}/settings/billing/subscriptions`}
          target="_top"
        >
          Change Limit
        </Button>
      </Box>
    </BlockStack>
  );
}

