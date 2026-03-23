export type PricingRuleTargetType = "product" | "variant" | "";

export interface PricingRule {
  id: string;
  legacyResourceId: string;
  title: string;
  description: string;
  pricePerExtraPage: string;
  enabled: boolean;
  targetType: PricingRuleTargetType;
  targetIds: string[];
  targetTitles: string[];
  productVariantId: string;
  productVariantLegacyResourceId: string;
  productVariantPrice: string;
}

export interface PricingRuleFormValues {
  name: string;
  description: string;
  pricePerExtraPage: string;
  enabled: boolean;
  targetType: PricingRuleTargetType;
  targetIds: string[];
  targetTitles: string[];
}

export interface PricingRuleActionErrors {
  name?: "required";
  pricePerExtraPage?: "required" | "invalid";
  targetId?: "required";
}

export interface PricingRuleActionData {
  ok: boolean;
  errors?: PricingRuleActionErrors;
}

export interface PricingRuleTargetOption {
  id: string;
  type: PricingRuleTargetType;
  title: string;
  label: string;
}

export interface PricingRuleExtraCharge {
  ruleId: string;
  ruleTitle: string;
  variantId: string;
  variantGid: string;
  extraPages: number;
  quantity: number;
  pricePerExtraPage: string;
  extraUnitAmount: string;
  extraCost: string;
}
