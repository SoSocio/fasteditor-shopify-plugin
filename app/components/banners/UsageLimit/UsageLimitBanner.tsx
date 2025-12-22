import React from 'react';
import {Banner} from "@shopify/polaris";
import {UsageLimitBannerContent} from "./UsageLimitBannerContent";
import { useTranslation } from "react-i18next";

export const UsageLimitBanner = () => {
  const { t } = useTranslation();

  return (
    <Banner title={t("usage-limit-banner.title")} tone="warning">
      <UsageLimitBannerContent/>
    </Banner>
  );
};
