import React from 'react';
import {Banner} from "@shopify/polaris";
import {UsageLimitBannerContent} from "./UsageLimitBannerContent";

export const UsageLimitBanner = () => {
  return (
    <Banner title="Usage limit exceeded" tone="warning">
      <UsageLimitBannerContent/>
    </Banner>
  );
};
