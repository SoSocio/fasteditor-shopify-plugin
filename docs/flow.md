# FastEditor Flow

Connect the store to the FastEditor platform — a "Customize" button on the product page redirects customers to the FastEditor customization page; orders with customized items sync to the portal; subscription and usage-based billing are managed in the app.

---

## Table of contents

1. [Connect to FastEditor](#1-connect-to-fasteditor)
2. [Initial setup](#2-initial-setup)
3. [Main app screens](#3-main-app-screens)
4. [Product setup](#4-product-setup)
5. [Customization flow (customer)](#5-customization-flow-customer)
6. [Order processing](#6-order-processing)
7. [Subscription and billing](#7-subscription-and-billing)
8. [Automatic behavior](#8-automatic-behavior)

---

## 1. Connect to FastEditor

**Precondition:** The app is installed in the store.

| Step | Action |
|------|--------|
| 1 | Merchant opens the app and goes to **Settings**. |
| 2 | Enters **FastEditor API Key** and **FastEditor Domain** (from the FastEditor portal). |
| 3 | Clicks **Connect**. |
| 4 | The app validates credentials via the FastEditor API. |
| 5 | **Success:** success message, integration active. **Failure:** error message — merchant corrects the data and retries. |

---

## 2. Initial setup

**Precondition:** Store is connected to FastEditor (section 1).

The merchant uses the **Getting Started** page:

| Block | What to do |
|-------|------------|
| **Integration** | Verify connection (link to Settings). |
| **Product setup** | Link products to FastEditor: set SKU in product/variant inventory in Shopify; add the `fasteditor` tag to products that should show the Customize button. |
| **Customize button** | Add the app block to the product page template via **Theme Editor** (button in the app opens the editor with the product-customize block). |
| **Sticky bar** | Add the sticky bar with the Customize button on product pages (for products with the `fasteditor` tag). |

**Note.** If the app is unavailable (e.g. subscription or usage limit), a banner is shown and access to main flows is restricted.

---

## 3. Main app screens

| Screen | Description |
|--------|-------------|
| **Getting Started** | Cards: Integration, Product setup, Customize button, Sticky bar — with descriptions and links (Settings, Products, Theme Editor). |
| **Dashboard** | Table of products with the `fasteditor` tag; search by title or SKU; filters; pagination; shop context (country, currency). No order-level stats — focus on product list and setup. |

---

## 4. Product setup

Product–FastEditor linking is done **only in Shopify Admin**:

1. In **Products**, the merchant opens a product.
2. In the **Inventory** section, sets **SKU** for variant(s) — SKU must match the FastEditor configuration.
3. Adds the **fasteditor** tag so the Customize button appears on the storefront.
4. Saves changes.

The app **Dashboard** shows the list of products with the `fasteditor` tag and their SKU, price, quantity.

---

## 5. Customization flow (customer)

**Precondition:** Product has the `fasteditor` tag; the product page includes the Customize button block or sticky bar.

| Step | Action |
|------|--------|
| 1 | Customer sees the **Customize** button (or sticky bar) on the product page. |
| 2 | Clicks **Customize** → redirect to the FastEditor customization page (SmartLink; the app provides the SmartLink creation endpoint). |
| 3 | Customer customizes the product on the FastEditor page. |
| 4 | Adds to cart or proceeds to checkout. |
| 5 | After payment, the `orders/paid` webhook runs → the app processes customized line items, syncs with FastEditor, stores for usage billing, and updates data as needed (section 6). |

---

## 6. Order processing

**Trigger:** Order paid (webhook `orders/paid`).

| Step | Action |
|------|--------|
| 1 | The app receives the `orders/paid` webhook. |
| 2 | Identifies customized line items in the order. |
| 3 | Sends data to the FastEditor API. |
| 4 | Stores line items in the database for billing. |
| 5 | Updates order metafields if needed. |

All steps run automatically; there are no manual steps in the UI.

---

## 7. Subscription and billing

- The merchant must have an **active subscription** (monthly plan + usage component).
- If there is no subscription or it is inactive, the app may redirect to subscribe or renew.
- **Usage:** calculated from sales of customized products; a cron job runs monthly for usage billing.
- **Currency rates:** updated daily for conversion.

---

## 8. Automatic behavior

| Event | App behavior |
|-------|--------------|
| **Order paid** | Webhook `orders/paid` → extract customized line items → send to FastEditor → store in DB → record usage for billing. |
| **Product or variant created/updated in Shopify** | The app does **not** run product sync; the merchant links to FastEditor manually (SKU + `fasteditor` tag). |
