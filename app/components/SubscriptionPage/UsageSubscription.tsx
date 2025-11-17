import React from 'react';
import type {ActiveSubscription} from "../../types/billing.types";
import {BlockStack, Box, Button, ProgressBar, Text} from '@shopify/polaris';
import {formatSimpleCurrency} from "../../utils/formatCurrency";
import { useTranslation } from "react-i18next";

export const UsageSubscription = ({subscription, shopName}: {
  subscription: ActiveSubscription,
  shopName: string
}) => {
  const { t } = useTranslation();
  const cappedAmount = subscription.appUsagePricing.cappedAmount.amount
  const balanceUsed = subscription.appUsagePricing.balanceUsed.amount
  const currency = subscription.appUsagePricing.cappedAmount.currencyCode
  const percent = (balanceUsed * 100) / cappedAmount

  const remainingAmount = formatSimpleCurrency(cappedAmount - balanceUsed, currency)

  const formatedBalanceUsed = formatSimpleCurrency(balanceUsed, currency)
  const formatedCappedAmount = formatSimpleCurrency(cappedAmount, currency)

  return (
    <BlockStack gap="300">
      <Text as="h2" variant="headingMd">{t("subscription-page.usage-subscription.title")}</Text>
      <BlockStack gap="100">
        <Text as="h2">{t("subscription-page.usage-subscription.remaining-amount")} {remainingAmount}</Text>
        <Box>
          <ProgressBar progress={percent} size="small"/>
        </Box>
        <Text as="p">{formatedBalanceUsed} {t("subscription-page.usage-subscription.spent")} | {formatedCappedAmount} {t("subscription-page.usage-subscription.limit")}</Text>
      </BlockStack>
      <Box>
        <Button
          url={`https://admin.shopify.com/store/${shopName}/settings/plan/subscriptions`}
          target="_top"
        >
          {t("subscription-page.usage-subscription.change-limit-button")}
        </Button>
      </Box>
    </BlockStack>
  );
}

