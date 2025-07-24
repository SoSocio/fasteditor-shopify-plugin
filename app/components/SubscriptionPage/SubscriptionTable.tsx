import {
  IndexTable,
  Text,
  Button,
  Collapsible, Box, InlineStack, Badge
} from '@shopify/polaris';
import React, {Fragment, useCallback, useState} from 'react';
import type {AppSubscription} from "@shopify/shopify-api";

export const SubscriptionTable = (
  {subscriptions}: { subscriptions: AppSubscription[] }
) => {
  const [open, setOpen] = useState(true);

  const handleToggle = useCallback(() => setOpen((open) => !open), []);

  const resourceName = {
    singular: 'subscription',
    plural: 'subscriptions',
  };

  const badge = (status: string, label: string) => {
    let tone: 'info' | 'success' | 'warning' | 'critical';

    switch (status) {
      case "ACTIVE":
        tone = "success";
        break;
      case "CANCELLED":
      case "DECLINED":
        tone = "critical";
        break;
      case "EXPIRED":
      case "FROZEN":
        break;
      case "PENDING":
        tone = "info";
        break;
      default:
        tone = "warning";
    }

    return <Badge tone={tone}>{label}</Badge>;
  }

  const rowMarkup = subscriptions.map(
    (item: AppSubscription, index: number) => (
      <Fragment key={item.id}>
        <IndexTable.Row
          id={item.id}
          key={item.id}
          position={index}
        >
          <IndexTable.Cell>
            <Text as="span">
              {item.name}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{badge(item.status, item.status)}</IndexTable.Cell>
          <IndexTable.Cell>{item.createdAt}</IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">
              {item.currentPeriodEnd}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack gap="200">
              <Button size="micro">
                Cancel
              </Button>
              <Button
                size="micro"
                ariaControls="basic-collapsible"
                ariaExpanded={open}
                onClick={handleToggle}
              >
                More Info
              </Button>
            </InlineStack>
          </IndexTable.Cell>
        </IndexTable.Row>
        <Collapsible
          id="basic-collapsible"
          open={open}
          transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
          expandOnPrint
        >
          <Text as="p">fsf</Text>
        </Collapsible>
      </Fragment>
    ),
  );

  return (
    <Box
      borderRadius="200"
      overflowY="hidden"
      overflowX="hidden"
      borderWidth="0165"
      borderColor="border-brand"
    >
      <IndexTable
        resourceName={resourceName}
        itemCount={subscriptions.length}
        selectable={false}
        headings={[
          {title: 'Subscriptions'},
          {title: 'Status'},
          {title: 'Create At'},
          {title: 'End Date'},
          {title: 'Actions'},
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </Box>
  );
}
