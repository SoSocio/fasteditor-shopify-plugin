import {useEffect, useMemo, useRef, useState} from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit
} from "@remix-run/react";
import {
  BlockStack,
  Checkbox,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Text,
  TextField
} from "@shopify/polaris";
import {useTranslation} from "react-i18next";

import type {
  PricingRule,
  PricingRuleActionData,
  PricingRuleFormValues,
} from "../types/pricingRules.types";
import {PageLayout} from "../components/layout/PageLayout";
import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";
import {PricingRuleTargetsTable} from "../components/PricingRules/PricingRuleTargetsTable";

const ENDPOINT = "/app/pricing-rules";

function buildDefaultValues(rule?: PricingRule | null): PricingRuleFormValues {
  const isVariantTarget = rule?.targetType === "variant";
  return {
    name: rule?.title ?? "",
    description: rule?.description ?? "",
    pricePerExtraPage: rule?.pricePerExtraPage ?? "",
    enabled: rule?.enabled ?? true,
    targetType: "variant",
    targetIds: isVariantTarget ? rule?.targetIds ?? [] : [],
    targetTitles: isVariantTarget ? rule?.targetTitles ?? [] : [],
  };
}

export { loader, action } from "./app.pricing-rules.$ruleId.server";

export const PricingRuleFormPage = () => {
  const {t} = useTranslation();
  const {rule, appAvailability, shopName, products, pageInfo, blockedTargetIds, shopSettings} = useLoaderData<typeof loader>();
  const params = useParams();
  const actionData = useActionData<PricingRuleActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const [formValues, setFormValues] = useState<PricingRuleFormValues>(
    buildDefaultValues(rule)
  );
  const isEditMode = !!rule && params.ruleId !== "new";
  const isSubmitting = navigation.state === "submitting";
  const formStateKey = rule?.id ?? params.ruleId ?? "new";
  const previousFormStateKeyRef = useRef(formStateKey);
  const selectedTargets = useMemo(() => {
    const currentTargetTitles = new Map<string, string>();

    products.forEach(({node: product}) => {
      product.variants.nodes.forEach((variant) => {
        currentTargetTitles.set(
          variant.id,
          `Variant: ${product.title} — ${variant.title}`
        );
      });
    });

    return formValues.targetIds.map((targetId, index) => ({
      targetId,
      targetTitle: currentTargetTitles.get(targetId) || formValues.targetTitles[index] || targetId,
    }));
  }, [formValues.targetIds, formValues.targetTitles, products]);

  useEffect(() => {
    if (previousFormStateKeyRef.current === formStateKey) {
      return;
    }

    previousFormStateKeyRef.current = formStateKey;
    setFormValues(buildDefaultValues(rule));
  }, [formStateKey, rule]);

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>;
  }

  const handleSubmitDelete = () => {
    if (!confirm(t("pricing-rule-form.delete-confirm"))) return;
    submit({intent: "delete"}, {method: "post"});
  };

  return (
    <PageLayout
      title={t(isEditMode ? "pricing-rule-form.title.edit" : "pricing-rule-form.title.new")}
      backAction={{
        content: t("pricing-rule-form.buttons.cancel"),
        onAction: () => navigate(ENDPOINT),
      }}
      primaryAction={{
        content: t(isEditMode ? "pricing-rule-form.buttons.save" : "pricing-rule-form.buttons.create"),
        onAction: () => {
          if (!formRef.current) return;
          submit(formRef.current);
        },
        loading: isSubmitting,
      }}
      fullWidth
    >
      <Form method="post" ref={formRef}>
        <input type="hidden" name="intent" value="save"/>
        <input type="hidden" name="targetType" value={formValues.targetType}/>
        <input type="hidden" name="targetIds" value={JSON.stringify(formValues.targetIds)}/>
        <input type="hidden" name="targetTitles" value={JSON.stringify(selectedTargets.map((target) => target.targetTitle))}/>
        <input type="hidden" name="enabled" value={formValues.enabled ? "true" : "false"}/>

        <BlockStack gap="500">
          <Card>
            <BlockStack gap="400">
              <FormLayout>
                <BlockStack gap="200">
                <TextField
                  name="name"
                  label={t("pricing-rule-form.fields.name")}
                  value={formValues.name}
                  onChange={(value) => setFormValues((prev) => ({...prev, name: value}))}
                  autoComplete="off"
                  error={actionData?.errors?.name ? t("pricing-rule-form.validation.name-required") : undefined}
                />
              </BlockStack>

                <TextField
                  name="description"
                  label={t("pricing-rule-form.fields.description")}
                  value={formValues.description}
                  onChange={(value) => setFormValues((prev) => ({...prev, description: value}))}
                  multiline={4}
                  autoComplete="off"
                />

                <BlockStack gap="200">
                  <TextField
                    name="pricePerExtraPage"
                    type="number"
                    label={t("pricing-rule-form.fields.price")}
                    suffix={shopSettings?.currency || "USD"}
                    value={formValues.pricePerExtraPage}
                    onChange={(value) => setFormValues((prev) => ({...prev, pricePerExtraPage: value}))}
                    min={0}
                    step={0.01}
                    autoComplete="off"
                    error={
                      actionData?.errors?.pricePerExtraPage === "required"
                        ? t("pricing-rule-form.validation.price-required")
                        : actionData?.errors?.pricePerExtraPage === "invalid"
                          ? t("pricing-rule-form.validation.price-invalid")
                          : undefined
                    }
                  />
                </BlockStack>

                <Checkbox
                  label={t("pricing-rule-form.fields.enabled")}
                  checked={formValues.enabled}
                  onChange={(value) =>
                    setFormValues((prev) => ({...prev, enabled: value}))
                  }
                />
                {selectedTargets.length > 0 ? (
                  <BlockStack gap="200">
                    <Text as="span" variant="bodySm">
                      {t("pricing-rule-form.fields.target-selected")} ({selectedTargets.length})
                    </Text>
                    <BlockStack gap="100">
                      {selectedTargets.map((target, index) => (
                        <InlineStack
                          key={`${target.targetId}-${index}`}
                          align="space-between"
                          blockAlign="center"
                        >
                          <Text as="span" variant="bodySm">
                            {target.targetTitle}
                          </Text>
                          <Button
                            size="slim"
                            tone="critical"
                            variant="secondary"
                            onClick={() =>
                              setFormValues((prev) => ({
                                ...prev,
                                targetIds: prev.targetIds.filter((_, targetIndex) => targetIndex !== index),
                                targetTitles: prev.targetTitles.filter((_, targetIndex) => targetIndex !== index),
                              }))
                            }
                          >
                            {t("pricing-rule-form.buttons.remove")}
                          </Button>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </BlockStack>
                ) : null}
                {actionData?.errors?.targetId ? (
                  <Text as="p" tone="critical" variant="bodySm">
                    {t("pricing-rule-form.validation.target-required")}
                  </Text>
                ) : null}
              </FormLayout>
              <BlockStack gap="300">
                <PricingRuleTargetsTable
                  products={products}
                  pageInfo={pageInfo}
                  shopName={shopName}
                  shopSettings={shopSettings}
                  blockedTargetIds={blockedTargetIds}
                  selectedTargetIds={formValues.targetIds}
                  onToggleTarget={(value) =>
                    setFormValues((prev) => {
                      const existingIndex = prev.targetIds.indexOf(value.targetId);
                      if (existingIndex >= 0) {
                        const nextIds = prev.targetIds.filter((id) => id !== value.targetId);
                        const nextTitles = prev.targetTitles.filter((_, idx) => idx !== existingIndex);
                        return {
                          ...prev,
                          targetType: "variant",
                          targetIds: nextIds,
                          targetTitles: nextTitles,
                        };
                      }

                      return {
                        ...prev,
                        targetType: "variant",
                        targetIds: [...prev.targetIds, value.targetId],
                        targetTitles: [...prev.targetTitles, value.targetTitle],
                      };
                    })
                  }
                />
              </BlockStack>
            </BlockStack>
          </Card>

          <InlineStack
            gap="200"
            wrap={false}
            align={isEditMode ? "space-between" : "end"}
          >
            {isEditMode ? (
              <Button destructive onClick={handleSubmitDelete}>
                {t("pricing-rule-form.buttons.delete")}
              </Button>
            ) : null}
            <InlineStack gap="200">
              <Button onClick={() => navigate(ENDPOINT)} tone="critical" variant="secondary">
                {t("pricing-rule-form.buttons.cancel")}
              </Button>
              <Button submit loading={isSubmitting} variant="primary">
                {t(isEditMode ? "pricing-rule-form.buttons.save" : "pricing-rule-form.buttons.create")}
              </Button>
            </InlineStack>
          </InlineStack>

        </BlockStack>
      </Form>
    </PageLayout>
  );
};

export default PricingRuleFormPage;
