import {BlockStack, Box, Text} from '@shopify/polaris';
import React from 'react';
import {StatusBadge} from "./StatusBadge";
import type {ActiveSubscription} from "../../types/billing.types";
import { useTranslation } from "react-i18next";

export const CurrentSubscription = ({subscription}: { subscription: ActiveSubscription }) => {
  const { t, i18n } = useTranslation();
  const subscriptionPrice = `${Number(subscription.appRecurringPricing.price.amount).toFixed(0)} ${subscription.appRecurringPricing.price.currencyCode}`

  const formatted = (date: string) => (
    new Intl.DateTimeFormat(i18n.language || "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date))
  )

  return (
    <BlockStack gap="200">
      <Box>
        <StatusBadge status={subscription.status}/>
      </Box>
      <BlockStack gap="300">
        <Text variant="headingLg" as="h2">{subscription.name}</Text>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {subscriptionPrice} {t("subscription-page.current-subscription.per-month")}
          </Text>
          <BlockStack gap="100">
            <Text as="span" variant="bodyMd">
              {t("subscription-page.current-subscription.started-on")} <b>{formatted(subscription.createdAt)}</b>
            </Text>
            <Text as="span" variant="bodyMd">
              {t("subscription-page.current-subscription.ends-on")} <b>{formatted(subscription.currentPeriodEnd)}</b>
            </Text>
          </BlockStack>
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
}
