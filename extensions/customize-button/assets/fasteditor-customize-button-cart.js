/**
 * FastEditor Customize Button Cart Handler
 * Handles automatic add to cart functionality for customized products
 */

(function() {
  'use strict';

  /**
   * CSS selectors for button elements
   */
  const SELECTORS = {
    BUTTON_TEXT: '.fasteditor-customize-button__text',
  };

  /**
   * Utility functions from fasteditor-customize-button-utils.js
   */
  const Utils = window.FastEditorCustomizeButtonUtils || {};
  const setButtonState = Utils.setButtonState || function() {};
  const setButtonLoadingIcon = Utils.setButtonLoadingIcon || function() {};

  /**
   * URL parameter keys
   */
  const URL_PARAMS = {
    FASTEDITOR_CART_URL: 'fe_cart_url',
  };

  /**
   * Default text values
   */
  const DEFAULT_TEXTS = {
    ADDING_TO_CART: 'Adding to cart...',
    ADDED_TO_CART: 'Added to cart',
    ERROR: 'Error',
  };

  /**
   * API endpoints
   */
  const ENDPOINTS = {
    CART_ADD: 'cart/add.js',
    FASTEDITOR_PRODUCT: '/apps/embedded/app/fasteditor/product',
  };

  /**
   * Cart property keys
   */
  const CART_PROPERTIES = {
    PROJECT_KEY: '_fasteditor_project_key',
    IMAGE_URL: '_fasteditor_image_url',
    CUSTOMIZED: 'Customized',
  };

  /**
   * Timeouts (in milliseconds)
   */
  const TIMEOUTS = {
    TEXT_RESTORE: 3000,
  };

  /**
   * Routes
   */
  const ROUTES = {
    CART: '/cart',
  };

  /**
   * Adds customized item to cart
   * @param {string} variantId - Product variant ID
   * @param {number} quantity - Item quantity
   * @param {string} projectKey - FastEditor project key
   * @param {string} imageUrl - Customized image URL
   * @throws {Error} If cart addition fails
   */
  async function addItemToCart(variantId, quantity, projectKey, imageUrl) {
    const formData = {
      items: [{
        id: variantId,
        quantity,
        properties: {
          [CART_PROPERTIES.PROJECT_KEY]: projectKey,
          [CART_PROPERTIES.IMAGE_URL]: imageUrl,
          [CART_PROPERTIES.CUSTOMIZED]: 'Yes',
        },
      }],
    };

    const response = await fetch(
      `${window.Shopify.routes.root}${ENDPOINTS.CART_ADD}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add item to cart: ${error}`);
    }
  }

  /**
   * Handles automatic add to cart flow for FastEditor customized products
   * Fetches product data, adds to cart, and optionally redirects
   * 
   * Note: This function uses setButtonLoadingIcon which is defined in fasteditor-customize-button-utils.js
   * and must be loaded before this file.
   * 
   * @param {HTMLElement} button - The button element
   */
  async function handleFastEditorAutoAddToCart(button) {
    const urlParams = new URLSearchParams(window.location.search);
    const fasteditorCartUrl = urlParams.get(URL_PARAMS.FASTEDITOR_CART_URL);

    // Exit early if no FastEditor cart URL parameter
    if (!fasteditorCartUrl) return;

    const textElement = button.querySelector(SELECTORS.BUTTON_TEXT);
    const originalText = textElement 
      ? textElement.textContent 
      : button.innerText;
    const enableCartRedirect = button.dataset.redirect === 'true';
    const addingToCartText = button.dataset.addingToCartText 
      || DEFAULT_TEXTS.ADDING_TO_CART;
    const addedToCartText = button.dataset.addedToCartText 
      || DEFAULT_TEXTS.ADDED_TO_CART;
    const errorText = button.dataset.errorText 
      || DEFAULT_TEXTS.ERROR;

    try {
      // Update button to loading state
      setButtonState(button, addingToCartText);
      setButtonLoadingIcon(button, true);

      // Fetch product data from FastEditor API
      const url = new URL(ENDPOINTS.FASTEDITOR_PRODUCT, window.location.origin);
      url.searchParams.set('url', fasteditorCartUrl);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
        },
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('[FastEditor] Failed to parse response:', parseError);
        setButtonLoadingIcon(button, false);
        setButtonState(button, errorText, false);
        return;
      }

      // Check for structured error response from backend
      if (!response.ok || !responseData.ok) {
        console.error('[FastEditor] API error:', {
          statusCode: responseData.statusCode || response.status,
          message: responseData.message || responseData.statusText,
          code: responseData.code || 'UNKNOWN_ERROR',
        });
        
        setButtonLoadingIcon(button, false);
        setButtonState(button, errorText, false);
        
        // Restore original text after 3 seconds
        setTimeout(() => {
          setButtonState(button, originalText, false);
        }, TIMEOUTS.TEXT_RESTORE);
        return;
      }

      // Validate response data
      const { data } = responseData;
      if (!data?.variantId || !data?.quantity || 
          !data?.projectKey || !data?.imageUrl) {
        console.error('[FastEditor] Missing required fields in response:', data);
        setButtonLoadingIcon(button, false);
        setButtonState(button, errorText, false);
        
        setTimeout(() => {
          setButtonState(button, originalText, false);
        }, TIMEOUTS.TEXT_RESTORE);
        return;
      }

      // Add item to cart
      await addItemToCart(
        data.variantId, 
        data.quantity, 
        data.projectKey, 
        data.imageUrl
      );

      // Update button to success state
      setButtonLoadingIcon(button, false);
      setButtonState(button, addedToCartText);

      // Clean up URL parameter
      urlParams.delete(URL_PARAMS.FASTEDITOR_CART_URL);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);

      // Restore original text after timeout
      setTimeout(() => {
        setButtonState(button, originalText, false);
      }, TIMEOUTS.TEXT_RESTORE);

      // Redirect or reload based on settings
      if (enableCartRedirect) {
        window.location.href = ROUTES.CART;
      } else {
        location.reload();
      }
    } catch (error) {
      // Handle network errors and other unexpected errors
      console.error('[FastEditor] Cart initialization error:', error);
      
      setButtonLoadingIcon(button, false);
      setButtonState(button, errorText, false);
      
      // Restore original text after 3 seconds
      setTimeout(() => {
        setButtonState(button, originalText, false);
      }, TIMEOUTS.TEXT_RESTORE);
    }
  }

  // Expose functions globally for use in other scripts
  window.addItemToCart = addItemToCart;
  window.handleFastEditorAutoAddToCart = handleFastEditorAutoAddToCart;
})();
