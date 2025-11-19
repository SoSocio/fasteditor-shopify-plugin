import {Banner, Page} from "@shopify/polaris";
import {UsageLimitBannerContent} from "./UsageLimitBannerContent";
import { useTranslation } from "react-i18next";

export const UsageLimitBannerWithAction = ({shopName}: { shopName: string }) => {
  const { t } = useTranslation();

  return (
    <Page fullWidth>
      <Banner
        title={t("usage-limit-banner.title")}
        tone="warning"
        action={{content: t("usage-limit-banner.go-to-subscription-button"), url: "/app/subscription"}}
        secondaryAction={{
          content: t("usage-limit-banner.change-limit-button"),
          url: `https://admin.shopify.com/store/${shopName}/settings/billing/subscriptions`,
          target: "_top",
        }}
      >
        <UsageLimitBannerContent/>
      </Banner>
    </Page>
  );
};
