# FastEditor

Shopify app that connects a merchant’s store to the FastEditor platform

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Documentation & resources](#documentation--resources)

---

## Overview

FastEditor is an embedded Shopify app that connects a store to the FastEditor platform. Customers see a **Customize** button (and optional sticky bar) on product pages; clicking it redirects to the FastEditor customization page. Orders containing customized items are synced with the platform; the app handles subscription and usage-based billing.

- Customization happens on the FastEditor page (redirect), not on the Shopify product page.
- App UI: **Getting Started** (setup cards) and **Dashboard** (products with the `fasteditor` tag).
- When the app is unavailable (e.g. subscription or usage limit), a banner is shown and access may be restricted.

---

## Features

- **Subscription and usage billing** — Monthly plan + usage-based (share of customized product sales); trial; create/cancel/success flows; daily currency rate updates; banner when unavailable.
- **Portal integration** — Connect store in Settings (FastEditor API Key and Domain); credentials validated via FastEditor API; state reflected (e.g. app metafield).
- **Customize button and sticky bar** — Theme app extension; shown only for products with the `fasteditor` tag; added via Theme Editor (app block).
- **SmartLink generation** — App calls FastEditor API to create SmartLink (variant, quantity, SKU, cart URL, userId) when the customer starts customization.
- **Redirect to FastEditor** — Customer clicks Customize → redirect to FastEditor customization page (SmartLink URL).
- **Product data resolution** — `GET /app/fasteditor/product` resolves product data from FastEditor (variantId, quantity, projectKey, imageUrl).
- **Add to cart and line item properties** — Handles adding customized product to cart and attaching properties to the line item.
- **Post-purchase request to FastEditor** — On `orders/paid`, app sends customized line items to FastEditor API, stores them for usage billing, and may update order metafields.
- **Dashboard** — Products with `fasteditor` tag; search (title/SKU); filters; pagination; shop context (country, currency).
- **Getting Started** — Cards: Integration, Product setup, Customize button, Sticky bar (instructions and links).
- **Currency, GDPR, i18n** — External rates API (EUR conversion); GDPR webhooks; multiple locales and Polaris UI.

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Backend | Remix (React Router 7), Node.js, Prisma, SQLite (dev) / PostgreSQL (prod) |
| Frontend | React, TypeScript, Polaris, App Bridge, i18next |
| Extensions | Shopify Theme App Extension (Liquid, JS, CSS) — block `customize-button` |
| APIs | Shopify Admin GraphQL, FastEditor API, Currency API |

---

## Requirements

- **Node.js** `^18.20` or `^20.10` or `>=21`
- **Shopify** Partner account, development store or Plus sandbox
- **FastEditor** API Key and Domain (from FastEditor portal)
- **Database** SQLite (dev) or PostgreSQL (prod); hosting + Shopify CLI for production

---

## Quick start

```bash
git clone <repo-url> fasteditor && cd fasteditor
npm install
cp .env.example .env
# Edit .env: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL, SCOPES; DATABASE_URL for prod

npm run setup

npm run dev:local          # Tunnel + Remix dev; press P to open URL, install in dev store
```

Local dev uses Shopify CLI (tunnel, OAuth, env). For webhook testing use Shopify CLI or ngrok (see [Troubleshooting](#troubleshooting)).

---

## Environment variables

| Variable | Description | Required |
|----------|-------------|----------|
| **Shopify** | | |
| `SHOPIFY_API_KEY` | App client ID | Yes |
| `SHOPIFY_API_SECRET` | Client secret | Yes |
| `SHOPIFY_APP_URL` | Public app URL (e.g. Vercel) | Yes |
| `SCOPES` | Comma-separated, e.g. `read_products,write_products,read_orders,write_orders,read_locales` | Yes |
| **Database** | | |
| `DATABASE_URL` | PostgreSQL URL (prod); dev uses SQLite in schema | Yes (prod) |
| **Billing** | | |
| `TEST_BILLING` | `true` for test billing | No |
| `MONTHLY_PLAN_PRICE` | Monthly plan price | No |
| `TRIAL_PERIOD_DAYS` | Trial length (days) | No |
| **Support** | | |
| `SUPPORT_EMAIL` | Support email | No |
| **Currency API** | | |
| `CURRENCY_API` | Base URL for rates | No (for cron) |
| `CURRENCY_API_ACCESS_KEY` | Access key | No |
| **Runtime** | | |
| `NODE_ENV` | `production` on host | Recommended |

---

## Project structure

```
fasteditor/
├── app/
│   ├── components/    # Banners, Dashboard, Settings, Subscription, layout
│   ├── constants/     # App config, fees, flags
│   ├── graphql/       # Admin API: app, billing, metafields, product, shop
│   ├── models/        # Prisma: session, shopSettings, order items, usage, currency, merchant
│   ├── routes/        # Remix: app.*, auth.*, webhooks.*, cron.*
│   ├── services/      # App, billing, currency, FastEditor API, orderProcessor, products, shop, smartlink
│   ├── types/         # TypeScript interfaces
│   ├── db.server.ts
│   └── shopify.server.ts
├── extensions/customize-button/   # Theme extension: blocks, assets, snippets
├── prisma/            # Schema, migrations
├── public/            # Static assets, locales
├── shopify.app.toml   # App config, webhooks, scopes
├── vite.config.ts
├── Dockerfile
└── vercel.json        # Crons: currency-rates
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Shopify app dev (CLI + tunnel + Remix) |
| `npm run dev:local` | Dev with `shopify.app.dev.toml` |
| `npm run build` | Production build |
| `npm run start` | Production server (`remix-serve`) |
| `npm run docker-start` | `setup` + `start` (Docker) |
| `npm run setup` | `prisma generate && prisma migrate deploy` |
| `npm run deploy` | Deploy app (Shopify CLI); update URL, webhooks |
| `npm run config:link` | Link repo to app in Partner Dashboard |
| `npm run lint` | ESLint |

---

## Deployment

- **Build:** `npm run build`; run with `remix-serve` or host preset (e.g. Vercel).
- **Vercel:** Use Remix/Vercel preset; crons in `vercel.json` for currency-rates.
- **Docker:** `Dockerfile` (Node 18 Alpine); set `DATABASE_URL` for production DB.

See [Shopify deployment docs](https://shopify.dev/docs/apps/deployment/web) and your host’s guide.

---

## Security

- **Auth:** OAuth via Shopify; sessions in DB (Prisma).
- **Secrets:** Env only; do not log API keys; personal data per GDPR webhooks.
- **Validation:** Input validated in loaders/actions (SmartLink, Settings); rate limiting via host/proxy.
- **Webhooks:** Use app-specific webhooks (HMAC); Admin-created webhooks are not signed by the app.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DB tables missing | `npm run setup` or `npx prisma migrate deploy` |
| OAuth loop after scope change | `npm run deploy` to update scopes in Shopify |
| Webhook HMAC fail | Use app-specific webhooks in `shopify.app.toml`; avoid manual Admin subscriptions |
| Vercel: "readable" stream error | Use Vercel Remix preset and `@vercel/remix` imports |
| Webhook via CLI: `admin` undefined | Expected with CLI fake shop; test on real store |
| Streaming (defer) not working locally | Use ngrok: `shopify app dev --tunnel-url=<ngrok_url>:8080` |
| "nbf" claim failed | Sync system clock |
| Non-embedded app | `embedded = false` in toml; `isEmbeddedApp: false` in app config and `AppProvider` |

---

## Documentation & resources

- **App flows:** [flow.md](./flow.md)
- **Endpoints:** [docs/endpoints.md](./docs/endpoints.md) — public API (`/app/fasteditor/product`, `/app/smartlink`), app routes, webhooks, cron
- **Theme extension:** [docs/extension.md](./docs/extension.md) — customize-button blocks, assets, snippets, settings
- **API:** `app/graphql/` + [Shopify Admin API](https://shopify.dev/docs/api/admin)

- [Remix](https://remix.run/docs)
- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [App authentication](https://shopify.dev/docs/apps/auth)
- [Theme app extensions](https://shopify.dev/docs/apps/app-extensions/list)
- [Webhooks](https://shopify.dev/docs/apps/build/webhooks)
- [Polaris](https://polaris.shopify.com/)
- [Prisma](https://www.prisma.io/docs)
- [Deployment (Shopify)](https://shopify.dev/docs/apps/deployment/web)
