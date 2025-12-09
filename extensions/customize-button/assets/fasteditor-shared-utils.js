/**
 * FastEditor Shared Utilities
 * Common functions used across FastEditor components
 */

(function() {
  'use strict';

  /**
   * Updates button text and disabled state
   * @param {HTMLElement} button - The button element
   * @param {string} text - Text to display
   * @param {boolean} disabled - Whether button should be disabled
   */
  function setButtonState(button, text, disabled = true) {
    if (!button) return;

    button.textContent = text;

    if (disabled) {
      button.setAttribute('disabled', 'true');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    }
  }

  /**
   * Formats money value using Shopify's formatMoney if available
   * @param {number} cents - Price in cents
   * @param {string} format - Money format string
   * @returns {string} Formatted price string
   */
  function formatMoney(cents, format) {
    if (typeof cents !== 'number') return '';
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents, format);
    }
    return (cents / 100).toFixed(2);
  }

  /**
   * Parses JSON safely with error handling
   * @param {string} raw - Raw JSON string
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} Parsed value or default
   */
  function parseJSON(raw, defaultValue = null) {
    if (!raw || raw === 'null') return defaultValue;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[FastEditor] Failed to parse JSON:', error);
      return defaultValue;
    }
  }

  /**
   * Adds item to cart via Shopify Cart API
   * @param {string} variantId - Product variant ID
   * @param {number} quantity - Item quantity
   * @param {Object} properties - Optional cart item properties
   * @returns {Promise<Response>} Fetch response
   * @throws {Error} If cart addition fails
   */
  async function addItemToCart(variantId, quantity, properties = {}) {
    const root = window.Shopify?.routes?.root || '/';
    const formData = {
      items: [{
        id: variantId,
        quantity,
        ...(Object.keys(properties).length > 0 && { properties }),
      }],
    };

    const response = await fetch(`${root}cart/add.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to add item to cart');
    }

    return response;
  }

  // Expose utilities globally
  window.FastEditorUtils = {
    setButtonState,
    formatMoney,
    parseJSON,
    addItemToCart,
  };
})();
