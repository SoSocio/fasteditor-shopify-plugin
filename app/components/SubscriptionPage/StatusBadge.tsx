import {Badge} from '@shopify/polaris';
import React from 'react';

export const StatusBadge = ({status}: { status: string }) => {
  function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

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

  return <Badge tone={tone}>{capitalize(status)}</Badge>;
}
