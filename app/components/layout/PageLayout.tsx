import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { Page } from "@shopify/polaris";
import type { PageProps } from "@shopify/polaris";
import { LanguageFilledIcon } from "@shopify/polaris-icons";
import { useTranslation } from "react-i18next";
import { useFetcher } from "@remix-run/react";

import i18n from "../../i18n";

/**
 * Interface for PageLayout component props
 */
interface PageLayoutProps {
  title: string;
  children: ReactNode;
  fullWidth?: boolean;
  subtitle?: string;
  backAction?: PageProps["backAction"];
  primaryAction?: PageProps["primaryAction"];
  secondaryActions?: PageProps["secondaryActions"];
  actionGroups?: PageProps["actionGroups"];
  narrowWidth?: boolean;
  compactTitle?: boolean;
}

/**
 * Interface for language update API response
 */
interface LanguageUpdateResponse {
  success: boolean;
  language?: string;
  error?: string;
}

/**
 * PageLayout component provides a consistent page structure with:
 * - Page title
 * - Language switcher in actionGroups (top right)
 * - Optional back action, primary action, and secondary actions
 * - Content area
 *
 * This component wraps the Polaris Page component and adds the language switcher
 * via actionGroups for consistent placement across all pages.
 *
 * @param props - PageLayout component props
 * @returns Wrapped Page component with language switcher
 */
export function PageLayout({
  title,
  children,
  fullWidth,
}: PageLayoutProps) {
  const { t, i18n: i18nInstance } = useTranslation();
  const fetcher = useFetcher<LanguageUpdateResponse>();

  /**
   * Handles language selection.
   * Updates the language in the database via API call and changes the UI language.
   *
   * @param languageCode - Selected language code
   */
  const handleLanguageChange = useCallback(
    (languageCode: string) => {
      // Update language in the database
      fetcher.submit(
        { language: languageCode },
        { method: "POST", action: "/app/language/update" }
      );

      // Update UI language immediately
      i18nInstance.changeLanguage(languageCode);
    },
    [fetcher, i18nInstance]
  );

  // Handle successful language update
  useEffect(() => {
    if (fetcher.data?.success) {
      console.log("Language updated successfully:", fetcher.data.language);
    }
  }, [fetcher.data]);

  /**
   * Get current language display name
   */
  const currentLanguageLabel = t(
    `language-switcher.languages.${i18nInstance.language}`
  );

  /**
   * Generate language actions from supported languages
   * No icons in dropdown - clean list of languages
   */
  const languageActions = i18n.supportedLngs.map((lng) => ({
    content: t(`language-switcher.languages.${lng}`),
    onAction: () => handleLanguageChange(lng),
    active: i18nInstance.language === lng,
  }));

  /**
   * Combine user-provided action groups with language switcher
   * Title shows current language with Polaris icon
   */
  const allActionGroups: PageProps["actionGroups"] = [
    {
      title: currentLanguageLabel,
      icon: LanguageFilledIcon,
      actions: languageActions,
    },
  ];

  return (
    <Page
      title={title}
      actionGroups={allActionGroups}
      fullWidth={fullWidth}
    >
      {children}
    </Page>
  );
}

