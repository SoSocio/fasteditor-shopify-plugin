import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import i18n from './i18n';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import Backend from "i18next-http-backend/cjs";
import { getInitialNamespaces } from "remix-i18next/client";
import LanguageDetector from "i18next-browser-languagedetector";

async function hydrate() {
  await i18next  // Setup i18next with the following packages via `.use()`
    .use(initReactI18next) 
    .use(LanguageDetector)
    .use(Backend)
    .init({
      ...i18n, // Extending our default config file with client only fields
      // detects the namespaces your routes rendered while SSR use
      ns: getInitialNamespaces(),
      backend: { loadPath: `/locales/{{lng}}/{{ns}}.json?v=${__APP_VERSION__}` },
      detection: {
        order: ['htmlTag'],
        caches: [],
      },
    });

    startTransition(() => {
      hydrateRoot(
        document,
        <I18nextProvider i18n={i18next}>
          <StrictMode>
            <RemixBrowser />
          </StrictMode>
        </I18nextProvider>,
      );
    });
  }
  
  if (window.requestIdleCallback) {
    window.requestIdleCallback(hydrate);
  } else {
    // Safari doesn't support requestIdleCallback
    // <https://caniuse.com/requestidlecallback>
    window.setTimeout(hydrate, 1);
  }