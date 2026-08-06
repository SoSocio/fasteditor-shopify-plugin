// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * @type {CartTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

const FASTEDITOR_LINE_UPDATE_MODE = "line_update";
const SHOPIFY_CHECKOUT_IMAGE_PREFIXES = [
  "https://cdn.shopify.com/",
  "https://cdn.shopifycdn.net/",
];

/**
 * @param {string | null | undefined} value
 * @returns {number | null}
 */
function parseDecimal(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * @param {number} value
 * @returns {string}
 */
function formatDecimal(value) {
  return value.toFixed(6).replace(/\.?0+$/, "");
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function normalizeUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

/**
 * Shopify cart transform accepts checkout image overrides only from Shopify CDN hosts.
 *
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function resolveCheckoutImageUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return null;
  }

  return SHOPIFY_CHECKOUT_IMAGE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    ? normalized
    : null;
}

/**
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const presentmentCurrencyRate = parseDecimal(input.presentmentCurrencyRate) ?? 1;

  const operations = input.cart.lines.reduce((result, line) => {
    if (line.pricingMode?.value !== FASTEDITOR_LINE_UPDATE_MODE) {
      return result;
    }

    const currentUnitAmount = parseDecimal(line.cost?.amountPerQuantity?.amount);
    const storedBaseUnitAmount = parseDecimal(line.baseUnitAmount?.value);
    // Ignore placeholder zero values when Shopify already provides a positive line price.
    const baseUnitAmount = (
      storedBaseUnitAmount !== null
      && (storedBaseUnitAmount > 0 || currentUnitAmount === null || currentUnitAmount <= 0)
    )
      ? storedBaseUnitAmount
      : currentUnitAmount;
    const extraUnitAmount = parseDecimal(line.extraUnitAmount?.value);
    const imageUrl = resolveCheckoutImageUrl(line.imageUrl?.value);
    const hasPriceUpdate = (
      baseUnitAmount !== null
      && extraUnitAmount !== null
      && extraUnitAmount > 0
    );

    if (!hasPriceUpdate && !imageUrl) {
      return result;
    }

    /** @type {{cartLineId: string, image?: {url: string}, price?: {adjustment: {fixedPricePerUnit: {amount: string}}}}} */
    const lineUpdate = {
      cartLineId: line.id,
    };

    if (imageUrl) {
      lineUpdate.image = {
        url: imageUrl,
      };
    }

    if (hasPriceUpdate) {
      const fixedPricePerUnit = baseUnitAmount + (extraUnitAmount * presentmentCurrencyRate);

      lineUpdate.price = {
        adjustment: {
          fixedPricePerUnit: {
            amount: formatDecimal(fixedPricePerUnit),
          },
        },
      };
    }

    result.push({
      lineUpdate,
    });

    return result;
  }, []);

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return {operations};
}
