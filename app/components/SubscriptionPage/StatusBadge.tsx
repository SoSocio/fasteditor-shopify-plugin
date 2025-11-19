import {Badge} from '@shopify/polaris';
import React from 'react';
import { useTranslation } from "react-i18next";

export const StatusBadge = ({status}: { status: string }) => {
  const { t } = useTranslation();

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

  const statusKey = `subscription-page.status.${status.toLowerCase()}`;
  const statusLabel = t(statusKey, { defaultValue: status });

  return <Badge tone={tone}>{statusLabel}</Badge>;
}
