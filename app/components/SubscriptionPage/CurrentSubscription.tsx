import {BlockStack, Box, Text} from '@shopify/polaris';
import {StatusBadge} from "./StatusBadge";
import type {ActiveSubscription} from "../../types/billing.types";
import { useTranslation } from "react-i18next";

export const CurrentSubscription = ({subscription}: { subscription: ActiveSubscription }) => {
  const { t, i18n } = useTranslation();
  const subscriptionPrice = `${Number(subscription.appRecurringPricing.price.amount).toFixed(0)} ${subscription.appRecurringPricing.price.currencyCode}`
  const planNameKeyMap: Record<string, string> = {
    "Monthly subscription": "subscription-page.current-subscription.monthly-plan",
  };
  const planNameKey = planNameKeyMap[subscription.name];
  const planName = planNameKey ? t(planNameKey) : subscription.name;

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
        <Text variant="headingLg" as="h2">{planName}</Text>
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
