import {Banner, List} from "@shopify/polaris";
import React from "react";

const ErrorBanner = () => {
  return (
    <Banner
      title="We couldn't load your dashboard data"
      action={{content: "Go to Settings", url: "/app/settings"}}
      tone="warning"
    >
      <List>
        <List.Item>
          FastEditor integration is not yet completed. Please enter your API key and domain on the Settings page.
        </List.Item>
        <List.Item>
          If the issue persists, try refreshing the page or contact support.
        </List.Item>
      </List>
    </Banner>
  );
};

export default ErrorBanner;
