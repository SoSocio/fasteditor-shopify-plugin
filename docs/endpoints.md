# Endpoints

Overview of HTTP endpoints: public API (used by the theme extension or FastEditor), app UI routes, webhooks, and cron.

---

## Table of contents

- [Public API (extension / external)](#public-api-extension--external)
- [App UI routes](#app-ui-routes)
- [Webhooks](#webhooks)
- [Cron](#cron)

---

## Public API (extension / external)

These endpoints are called from the storefront (theme extension) or by the FastEditor portal. They do not require Shopify session auth; validation is via request body or query params.

### GET `/app/fasteditor/product`

Resolves product data from FastEditor by URL. Used when the storefront or FastEditor needs variant/quantity/projectKey/imageUrl for a customization session.

| Item | Description |
|------|-------------|
| **Method** | `GET` |
| **Auth** | None (public). |
| **Query params** | `url` (required) — FastEditor API URL to fetch product data from. |
| **Success** | `200` — JSON body below. |
| **Errors** | `400` — missing/invalid `url`. `500` — internal or FastEditor error. |

**Success response (200):**

```json
{
  "statusCode": 200,
  "statusText": "success",
  "ok": true,
  "data": {
    "variantId": "string",
    "quantity": "number",
    "projectKey": "number",
    "imageUrl": "string"
  }
}
```

**Error response (4xx/5xx):**

```json
{
  "statusCode": 400,
  "statusText": "Bad Request",
  "message": "Query parameter 'url' is required and must be non-empty.",
  "code": "MISSING_URL_PARAMETER",
  "ok": false
}
```

---

### POST `/app/smartlink`

Creates a SmartLink via the FastEditor API. Called from the theme extension when the customer clicks "Customize" (variant, quantity, shop, productHandle, optional userId are sent; the app builds the FastEditor payload and returns the SmartLink URL).

| Item | Description |
|------|-------------|
| **Method** | `POST` |
| **Auth** | None (public). |
| **Content-Type** | `application/json` |
| **Success** | `200` — JSON with `data.url` (SmartLink URL). |
| **Errors** | `400` — validation (missing/invalid fields). `502` — FastEditor API error. `500` — internal error. |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shop` | string | Yes | Shop domain (e.g. `store.myshopify.com`). |
| `variantId` | string | Yes | Shopify variant ID (GID or numeric). |
| `productHandle` | string | Yes | Product handle for cart URL. |
| `quantity` | number | Yes | Quantity. |
| `userId` | string | No | Optional user/customer identifier. |

**Example request:**

```json
{
  "shop": "my-store.myshopify.com",
  "variantId": "41234567890",
  "productHandle": "my-product",
  "quantity": 1,
  "userId": "optional-user-id"
}
```

**Success response (200):**

```json
{
  "statusCode": 200,
  "statusText": "success",
  "ok": true,
  "data": {
    "url": "https://fasteditor.example.com/..."
  }
}
```

**Error response (400 example):**

```json
{
  "statusCode": 400,
  "statusText": "Bad Request",
  "message": "Invalid JSON in request body.",
  "code": "INVALID_JSON",
  "ok": false
}
```

**Error response (502 — FastEditor API):**

```json
{
  "statusCode": 502,
  "statusText": "FastEditor API error",
  "message": "...",
  "code": "FASTEDITOR_API_ERROR",
  "ok": false
}
```

---

## App UI routes

These routes render the embedded app UI in Shopify Admin. They require an active Shopify session (OAuth).

| Path | Description |
|------|-------------|
| `/app` | App layout; redirects or renders nested route. |
| `/app/_index` or `/` (under app) | Getting Started page (Integration, Product setup, Customize button, Sticky bar). |
| `/app/dashboard` | Dashboard — table of products with `fasteditor` tag. |
| `/app/settings` | Settings — FastEditor API Key and Domain, Connect. |
| `/app/subscription` | Subscription management (current plan, usage). |
| `/app/subscription/create` | Start / select subscription. |
| `/app/subscription/success` | Post-checkout success. |
| `/app/subscription/cancel` | Cancel subscription flow. |
| `/app/currency-rates/create` | Create / manage currency rates (if used). |
| `/app/language/update` | Update merchant app language. |

---

## Webhooks

Registered in `shopify.app.toml`. All expect POST with Shopify webhook payload; HMAC is verified for app-specific webhooks.

| Path | Topic | Description |
|------|-------|-------------|
| `/webhooks/app/subscriptions/update` | `app_subscriptions/update` | Subscription status changes. |
| `/webhooks/app/orders_paid` | `orders/paid` | Order paid — extract customized line items, send to FastEditor, store for usage billing. |
| `/webhooks/app/scopes_update` | `app/scopes_update` | App scopes updated. |
| `/webhooks/app/uninstalled` | `app/uninstalled` | App uninstalled — clean up shop data. |
| `/webhooks/app/gdpr` | GDPR compliance | `customers/data_request`, `customers/redact`, `shop/redact`. |

---

## Cron

Scheduled (e.g. via Vercel cron in `vercel.json`). Should be secured (e.g. secret header or server-side only).

| Path | Schedule | Description |
|------|----------|-------------|
| `/cron/currency-rates/update` | Daily | Update currency rates (for billing conversion). |
