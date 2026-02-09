# Theme App Extension: customize-button

The FastEditor app includes one **theme app extension** named `customize-button`. It adds a Customize button and an optional sticky bar on product pages, and an optional cart block for displaying line item properties (e.g. FastEditor image URL).

---

## Table of contents

- [Overview](#overview)
- [Structure](#structure)
- [Blocks](#blocks)
- [Assets](#assets)
- [Snippets](#snippets)
- [Configuration](#configuration)
- [Visibility rules](#visibility-rules)

---

## Overview

| Item | Value |
|------|--------|
| **Extension name** | `customize-button` |
| **Type** | `theme` |
| **Config** | `extensions/customize-button/shopify.extension.toml` |

The extension is available only when the app is installed and (per block schema) when the app metafield indicates the app is paid/available. Blocks target the **product** template; the Customize button and sticky bar are shown only for products that have the **fasteditor** tag (or in theme editor design mode).

---

## Structure

```
extensions/customize-button/
├── shopify.extension.toml   # Extension config (name, type, uid)
├── blocks/
│   ├── product-customize-block.liquid   # Customize button (product section block)
│   └── sticky-bar.liquid                # Sticky bar (product section block)
├── assets/
│   ├── fasteditor-customize-button.js   # Button logic (SmartLink, add to cart)
│   ├── fasteditor-customize-button.css
│   ├── fasteditor-sticky-bar.js         # Sticky bar logic
│   ├── fasteditor-sticky-bar.css
│   ├── fasteditor-shared-utils.js       # Shared helpers
│   └── cookie-user-id.js                 # User ID cookie (e.g. for SmartLink)
├── snippets/
│   ├── button-customize.liquid          # Button markup (icons, text)
│   ├── icon-*.liquid                     # Icon snippets (brush, pen, image, etc.)
│   └── ...
└── locales/
    ├── en.default.json                  # Default strings
    ├── en.default.schema.json           # Block setting labels (EN)
    └── *.json / *.schema.json           # Other locales
```

---

## Blocks

### 1. Product Customize Block

**File:** `blocks/product-customize-block.liquid`  
**Purpose:** Renders a single "Customize" button on the product page. On click, the app creates a SmartLink (POST `/app/smartlink`) and redirects the customer to the FastEditor customization page.

| Schema | Value |
|--------|--------|
| **Target** | `section` |
| **Templates** | `product` |
| **Available if** | `app.metafields.fasteditor_app.paid` (app is paid/available). |

**Visibility:** Renders only when:
- The product has the **fasteditor** tag, or
- Theme editor is in **design mode**.

**Settings (grouped in schema):**

| Group | Settings |
|-------|----------|
| **Button text** | Button text, font, font size, text color. |
| **Button appearance** | Background color, border (width, color, radius). |
| **Icon** | Icon type (none, pen, brush, image, images, link, settings, custom), custom icon image, icon color/size/gap, position (left/right). |
| **Button state texts** | Loading text, adding-to-cart text, added-to-cart text, error text. |
| **Behavior** | Redirect to cart page after adding to cart (checkbox). |

**Data attributes (for JS):** `data-shop`, `data-handle`, `data-section-id`, `data-availability`, `data-variant-available`, `data-initial-variant-id`, `data-variants`, `data-redirect`, plus state text attributes. The JS uses these to call `/app/smartlink` and handle add-to-cart with line item properties.

---

### 2. Sticky Bar Block

**File:** `blocks/sticky-bar.liquid`  
**Purpose:** A sticky bar on the product page with product thumbnail, title, price, Customize button, and optional Add to cart. Shown on desktop/mobile with configurable position (top/bottom/hide).

| Schema | Value |
|--------|--------|
| **Target** | `section` |
| **Templates** | `product` |

**Visibility:** Same as the Customize block — product has **fasteditor** tag or design mode.

**Settings (grouped):**

| Group | Settings |
|-------|----------|
| **Layout** | Desktop position (top/bottom/hide), mobile position, button radius, show product details on mobile. |
| **Colors** | Bar background, bar text, Customize button background/text, Add to cart button background/text. |
| **Buttons** | Customize button text, loading text; Add to cart button text, adding/added/error/sold-out text. |
| **Visibility** | Add to cart visibility: both, mobile only, desktop only, hidden. |

Uses the same SmartLink and add-to-cart flow as the product-customize block (shared JS/utils).

---

## Assets

| File | Purpose |
|------|---------|
| `fasteditor-customize-button.js` | Customize button: call POST `/app/smartlink`, redirect to SmartLink URL; add to cart with line item properties. |
| `fasteditor-customize-button.css` | Styles for the Customize button (scoped by block ID). |
| `fasteditor-sticky-bar.js` | Sticky bar: variant switching, Customize, Add to cart (same API as button). |
| `fasteditor-sticky-bar.css` | Sticky bar layout and appearance. |
| `fasteditor-shared-utils.js` | Shared helpers (e.g. API base URL, fetch options). |
| `cookie-user-id.js` | Read/write user ID cookie (e.g. for `userId` in SmartLink request). |

---

## Snippets

| Snippet | Purpose |
|---------|---------|
| `button-customize` | Renders the button markup with optional icon (left/right); used by product-customize block. |
| `icon-brush`, `icon-pen`, `icon-image`, `icon-images`, `icon-link`, `icon-settings`, `icon-button`, `icon-loading` | Icon SVGs for the Customize button. |

Block settings (icon type, position, custom image) are passed into `button-customize` from the block.

---

## Configuration

**shopify.extension.toml:**

```toml
name = "customize-button"
type = "theme"
# uid is set by Shopify CLI
```

Block schemas and setting labels are in `locales/*.schema.json` and `locales/*.json` (e.g. `en.default.schema.json` for English block settings).

---

## Visibility rules

- **App availability:** Blocks that check `app.metafields.fasteditor_app.paid` or `app.metafields.fasteditor_app.availability` only show or enable when the app is considered available/paid for the store.
- **Product tag:** The Customize button and sticky bar render on the product page only if the product has the **fasteditor** tag (or the theme editor is in design mode).
- **Variant availability:** The Customize button can be disabled when the selected variant is unavailable (`data-variant-available`); the block may also show a “sold out” state.
