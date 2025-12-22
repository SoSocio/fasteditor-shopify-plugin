import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { t } = useTranslation();
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>{t("home-page.heading")}</h1>
        <p className={styles.text}>
          {t("home-page.tagline")}
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>{t("home-page.shop-domain-label")}</span>
              <input className={styles.input} type="text" name="shop" />
              <span>{t("home-page.shop-domain-example")}</span>
            </label>
            <button className={styles.button} type="submit">
              {t("home-page.login-button")}
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>{t("home-page.product-feature-title")}</strong>. {t("home-page.product-feature-description")}
          </li>
          <li>
            <strong>{t("home-page.product-feature-title")}</strong>. {t("home-page.product-feature-description")}
          </li>
          <li>
            <strong>{t("home-page.product-feature-title")}</strong>. {t("home-page.product-feature-description")}
          </li>
        </ul>
      </div>
    </div>
  );
}
