/**
 * FastEditor Customize Button Redirect Handler
 * Handles redirect functionality for FastEditor customization button
 */

(function() {
  'use strict';

  /**
   * CSS selectors for form elements
   */
  const SELECTORS = {
    VARIANT_INPUT: 'input[name="id"]',
    QUANTITY_INPUT: 'input[name="quantity"]',
  };

  /**
   * Default values
   */
  const DEFAULTS = {
    QUANTITY: 1,
    LOADING_TEXT: 'Loading...',
    ERROR_TEXT: 'Error occurred.',
  };

  /**
   * API endpoints
   */
  const ENDPOINTS = {
    SMARTLINK: '/apps/embedded/app/smartlink',
  };

  /**
   * Utility functions from fasteditor-customize-button-utils.js
   */
  const Utils = window.FastEditorCustomizeButtonUtils || {};
  const setButtonState = Utils.setButtonState || function() {};
  const setButtonLoadingIcon = Utils.setButtonLoadingIcon || function() {};

  /**
   * Handles redirect to FastEditor customization page
   * 
   * Note: This function is called from the button's click event handler
   * defined in the Liquid template.
   * 
   * @param {HTMLElement} button - The button element
   * @param {string} originalText - Original button text to restore
   */
  async function handleFastEditorRedirect(button, originalText) {
    const shop = button.dataset.shop;
    const productHandle = button.dataset.handle;
    const variantId = document.querySelector(SELECTORS.VARIANT_INPUT)?.value;
    const quantityInput = document.querySelector(SELECTORS.QUANTITY_INPUT);
    const quantity = quantityInput 
      ? parseInt(quantityInput.value, 10) 
      : DEFAULTS.QUANTITY;
    const loadingText = button.dataset.loadingText || DEFAULTS.LOADING_TEXT;
    const errorText = button.dataset.errorText || DEFAULTS.ERROR_TEXT;

    // Get or create userId from cookie
    const userId = window.getOrCreateUserId ? window.getOrCreateUserId() : null;

    try {
      setButtonState(button, loadingText);
      setButtonLoadingIcon(button, true);

      const response = await fetch(ENDPOINTS.SMARTLINK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
        },
        body: JSON.stringify({ shop, variantId, quantity, productHandle, userId }),
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
        }, 3000);
        return;
      }

      // Check for successful response with URL
      if (!responseData.data?.url) {
        console.error('[FastEditor] Missing URL in response:', responseData);
        setButtonLoadingIcon(button, false);
        setButtonState(button, errorText, false);
        
        setTimeout(() => {
          setButtonState(button, originalText, false);
        }, 3000);
        return;
      }

      // Success - redirect to FastEditor customization page
      window.location.href = responseData.data.url;
    } catch (error) {
      // Handle network errors and other unexpected errors
      console.error('[FastEditor] Redirect error:', error);
      
      setButtonLoadingIcon(button, false);
      setButtonState(button, errorText, false);
      
      // Restore original text after 3 seconds
      setTimeout(() => {
        setButtonState(button, originalText, false);
      }, 3000);
    }
  }

  // Expose function globally for use in other scripts
  window.handleFastEditorRedirect = handleFastEditorRedirect;
})();
