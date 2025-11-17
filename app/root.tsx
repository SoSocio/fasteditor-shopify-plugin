import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { useTranslation } from 'react-i18next';
import i18next from './i18next.server';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "./shopify.server";
import { getMerchant } from "./models/merchant.server";
import i18n from "./i18n";

/**
 * Maps locale to i18next supported locale
 * Converts formats like 'de-DE' to 'de' if needed
 */
function mapLocaleToSupported(locale: string | null | undefined): string {
  if (!locale) {
    return i18n.fallbackLng;
  }

  // Check if locale is already in our supported list
  if (i18n.supportedLngs.includes(locale)) {
    return locale;
  }

  // Extract base language (e.g., 'de-DE' -> 'de')
  const baseLang = locale.split('-')[0];
  if (i18n.supportedLngs.includes(baseLang)) {
    return baseLang;
  }

  // Fallback to default
  return i18n.fallbackLng;
}

export async function loader({ request }: LoaderFunctionArgs) {
  let locale: string;

  try {
    const { session } = await authenticate.admin(request);
    const userId = session.onlineAccessInfo?.associated_user.id;

    // Priority 1: Get merchant's language from database
    if (userId) {
      const merchant = await getMerchant(String(userId), session.shop);
      if (merchant?.language) {
        locale = mapLocaleToSupported(merchant.language);
        console.log("App Root Loader - Using merchant language:", merchant.language, "->", locale);
      } else {
        // Priority 2: Fallback to i18next detection
        locale = await i18next.getLocale(request);
        console.log("App Root Loader - Using detected locale (fallback):", locale);
      }
    } else {
      // No userId - use i18next detection
      locale = await i18next.getLocale(request);
      console.log("App Root Loader - No userId, using detected locale:", locale);
    }
  } catch (error) {
    // For unauthenticated requests, use i18next detection
    locale = await i18next.getLocale(request);
    console.log("App Root Loader - Unauthenticated, using detected locale:", locale);
  }

  return { locale };
}

export default function App() {
  const { locale } = useLoaderData<typeof loader>();
  const [shopifyLocale, setShopifyLocale] = useState<string>(locale);
  const { i18n } = useTranslation();

  const shopify = useAppBridge();

  // Use locale from loader (merchant's language from database) as priority
  // Fallback to Shopify App Bridge locale if needed
  useEffect(() => {
    const finalLocale = locale || shopify.config.locale || 'en';
    setShopifyLocale(finalLocale);
    if (i18n.language !== finalLocale) {
      i18n.changeLanguage(finalLocale);
    }
  }, [locale, shopify, i18n]);

  console.log("shopifyLocale", shopifyLocale);

  return (
    <html lang={shopifyLocale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
