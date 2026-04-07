import {useFetcher, useLoaderData, useLocation, useNavigate} from "@remix-run/react";
import {useEffect} from "react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Text,
} from "@shopify/polaris";
import {useTranslation} from "react-i18next";

import {PageLayout} from "../components/layout/PageLayout";
import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";
import {formatSimpleCurrency} from "../utils/formatCurrency";

export { loader, action } from "./app.pricing-rules.server";

const PricingRulesList = () => {
  const {t} = useTranslation();
  const data = useLoaderData<typeof loader>();
  const rules = data?.rules ?? [];
  const appAvailability = data?.appAvailability ?? null;
  const shopName = data?.shopName ?? "";
  const shopSettings = data?.shopSettings ?? {country: "US", currency: "USD"};
  const fetcher = useFetcher();
  const deletingRuleId = fetcher.submission?.formData.get("ruleId");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has("focusRuleId")) {
      return;
    }

    searchParams.delete("focusRuleId");
    const nextSearch = searchParams.toString();
    const nextUrl = nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [location.pathname, location.search]);

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>;
  }

  const emptyStateMarkup = (
    <EmptyState
      heading={t("pricing-rules-page.empty-state.title")}
      action={{
        content: t("pricing-rules-page.create-button"),
        onAction: () => navigate("/app/pricing-rules/new"),
      }}
    >
      <p>{t("pricing-rules-page.empty-state.description")}</p>
    </EmptyState>
  );

  const renderRuleTargets = (targetTitles: string[]) => {
    if (!targetTitles.length) {
      return <Text as="span">-</Text>;
    }

    const visibleTargetTitles = targetTitles.slice(0, 5);
    const hiddenTargetsCount = targetTitles.length - visibleTargetTitles.length;

    return (
      <BlockStack gap="100">
        {visibleTargetTitles.map((title, index) => (
          <Text as="span" key={`${title}-${index}`} variant="bodySm">
            {title}
          </Text>
        ))}
        {hiddenTargetsCount > 0 ? (
          <Text as="span" tone="subdued" variant="bodySm">
            +{hiddenTargetsCount}
          </Text>
        ) : null}
      </BlockStack>
    );
  };

  const rows = rules.map((rule, index) => (
    <IndexTable.Row
      id={`Rule-${rule.legacyResourceId}`}
      key={rule.id}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {rule.title || "-"}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span">{rule.description || "-"}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {renderRuleTargets(rule.targetTitles)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span">
          {rule.pricePerExtraPage
            ? formatSimpleCurrency(Number(rule.pricePerExtraPage), shopSettings.currency)
            : "-"}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={rule.enabled ? "success" : "critical"}>
          {rule.enabled
            ? t("pricing-rules-page.status.active")
            : t("pricing-rules-page.status.inactive")}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          <Button
            size="slim"
            onClick={() => navigate(`/app/pricing-rules/${rule.legacyResourceId}`)}
          >
            {t("pricing-rules-page.actions.edit")}
          </Button>
          <Button
            size="slim"
            destructive
            loading={deletingRuleId === rule.legacyResourceId}
            onClick={() => {
              if (confirm(t("pricing-rule-form.delete-confirm"))) {
                fetcher.submit(
                  {intent: "delete", ruleId: rule.legacyResourceId},
                  {method: "post"}
                );
              }
            }}
          >
            {t("pricing-rules-page.actions.delete")}
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <PageLayout
      title={t("pricing-rules-page.title")}
      fullWidth
      primaryAction={{
        content: t("pricing-rules-page.create-button"),
        onAction: () => navigate("/app/pricing-rules/new"),
      }}
    >
      <BlockStack gap="500">
        {rules.length === 0 ? (
          <Card>
            {emptyStateMarkup}
          </Card>
        ) : (
          <Box
            borderRadius="200"
            overflowY="hidden"
            overflowX="hidden"
            borderWidth="0165"
            borderColor="border-brand"
          >
            <IndexTable
              resourceName={{
                singular: "pricing rule",
                plural: "pricing rules",
              }}
              itemCount={rules.length}
              headings={[
                {title: t("pricing-rules-page.table.headings.name")},
                {title: t("pricing-rules-page.table.headings.description")},
                {title: t("pricing-rules-page.table.headings.targets")},
                {title: t("pricing-rules-page.table.headings.price")},
                {title: t("pricing-rules-page.table.headings.status")},
                {title: t("pricing-rules-page.table.headings.actions")},
              ]}
              selectable={false}
            >
              {rows}
            </IndexTable>
          </Box>
        )}
      </BlockStack>
    </PageLayout>
  );
};

export default PricingRulesList;
