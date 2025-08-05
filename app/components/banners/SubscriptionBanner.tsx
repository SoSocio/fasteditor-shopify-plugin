import React, {useCallback} from 'react';
import {Banner, Page} from "@shopify/polaris";

export const SubscriptionBanner = ({fetcher}: { fetcher: any }) => {
  const onSubscribe = useCallback(async () => {
    fetcher.submit(null, {method: "POST"});
  }, [fetcher])

  return (
    <Page fullWidth>
      <Banner
        title="Your subscription has been cancelled"
        action={{
          content: 'Subscribe',
          onAction: onSubscribe,
          loading: fetcher.state !== "idle"
        }}
        tone="warning"
      >
        To continue using the app's features, please press “Subscribe” to reactivate your plan.
      </Banner>
    </Page>
  );
};
