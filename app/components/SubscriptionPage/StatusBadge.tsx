import {Badge} from '@shopify/polaris';
import React from 'react';

export const StatusBadge = ({status}: { status: string }) => {
  function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  const tone: 'info' | 'success' | 'warning' | 'critical' = (() => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "CANCELLED":
      case "DECLINED":
        return "critical";
      case "PENDING":
        return "info";
      case "EXPIRED":
      case "FROZEN":
        return "warning";
      default:
        return "warning";
    }
  })();

  return <Badge tone={tone}>{capitalize(status)}</Badge>;
}
