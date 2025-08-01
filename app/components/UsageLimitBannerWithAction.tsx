import React from 'react';
import {Banner, Page} from "@shopify/polaris";
import {UsageLimitBannerContent} from "./UsageLimitBannerContent";

export const UsageLimitBannerWithAction = ({shopName}: { shopName: string }) => {
  return (
    <Page fullWidth>
      <Banner
        title="Usage limit exceeded"
        tone="warning"
        action={{content: "Go to Subscription", url: "/app/subscription"}}
        secondaryAction={{
          content: "Change Limit",
          url: `https://admin.shopify.com/store/${shopName}/settings/billing/subscriptions`,
          target: "_top",
        }}
      >
        <UsageLimitBannerContent/>
      </Banner>
    </Page>
  );
};
