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
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const presentmentCurrencyRate = parseDecimal(input.presentmentCurrencyRate) ?? 1;

  const operations = input.cart.lines.reduce((result, line) => {
    if (line.pricingMode?.value !== FASTEDITOR_LINE_UPDATE_MODE) {
      return result;
    }

    const baseUnitAmount = parseDecimal(line.cost?.amountPerQuantity?.amount);
    const extraUnitAmount = parseDecimal(line.extraUnitAmount?.value);

    if (baseUnitAmount === null || extraUnitAmount === null || extraUnitAmount <= 0) {
      return result;
    }

    const fixedPricePerUnit = baseUnitAmount + (extraUnitAmount * presentmentCurrencyRate);

    result.push({
      lineUpdate: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: formatDecimal(fixedPricePerUnit),
            },
          },
        },
      },
    });

    return result;
  }, []);

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return {operations};
}
