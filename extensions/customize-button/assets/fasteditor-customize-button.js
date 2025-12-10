/**
 * FastEditor Customize Button Web Component
 * Encapsulates all customize button functionality in a reusable web component
 */

(function() {
  'use strict';

  /**
   * CSS selectors for button elements
   */
  const SELECTORS = {
    BUTTON_TEXT: '.fasteditor-customize-button__text',
    BUTTON_ICON: '.fasteditor-customize-button__icon',
    BUTTON_ICON_MAIN: '.fasteditor-customize-button__icon-main',
    BUTTON_ICON_LOADING: '.fasteditor-customize-button__icon-loading',
    VARIANT_INPUT: 'input[name="id"]',
    QUANTITY_INPUT: 'input[name="quantity"]',
  };

  /**
   * CSS class names
   */
  const CLASSES = {
    LOADING: 'fasteditor-customize-button--loading',
  };

  /**
   * Display values
   */
  const DISPLAY = {
    NONE: 'none',
    FLEX: 'flex',
  };

  /**
   * Default values
   */
  const DEFAULTS = {
    QUANTITY: 1,
    LOADING_TEXT: 'Loading...',
    ERROR_TEXT: 'Error occurred.',
    ADDING_TO_CART: 'Adding to cart...',
    ADDED_TO_CART: 'Added to cart',
  };

  /**
   * API endpoints
   */
  const ENDPOINTS = {
    SMARTLINK: '/apps/embedded/app/smartlink',
    CART_ADD: 'cart/add.js',
    FASTEDITOR_PRODUCT: '/apps/embedded/app/fasteditor/product',
  };

  /**
   * URL parameter keys
   */
  const URL_PARAMS = {
    FASTEDITOR_CART_URL: 'fe_cart_url',
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
   * Updates button text and disabled state
   * Uses shared utility if available, otherwise falls back to local implementation
   * @param {HTMLElement} button - The button element
   * @param {string} text - Text to display
   * @param {boolean} disabled - Whether button should be disabled
   */
  function setButtonState(button, text, disabled = true) {
    if (!button) return;

    // Use shared utility if available
    if (window.FastEditorUtils && window.FastEditorUtils.setButtonState) {
      const textElement = button.querySelector(SELECTORS.BUTTON_TEXT);
      if (textElement) {
        textElement.textContent = text;
        if (disabled) {
          button.setAttribute('disabled', 'true');
          button.setAttribute('aria-disabled', 'true');
        } else {
          button.removeAttribute('disabled');
          button.removeAttribute('aria-disabled');
        }
      } else {
        window.FastEditorUtils.setButtonState(button, text, disabled);
      }
      return;
    }

    // Fallback implementation
    const textElement = button.querySelector(SELECTORS.BUTTON_TEXT);
    if (textElement) {
      textElement.textContent = text;
    } else {
      button.textContent = text;
    }

    if (disabled) {
      button.setAttribute('disabled', 'true');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    }
  }

  /**
   * Toggles loading icon state on button
   * @param {HTMLElement} button - The button element
   * @param {boolean} isLoading - Whether to show loading icon
   */
  function setButtonLoadingIcon(button, isLoading) {
    if (!button) return;

    const iconElement = button.querySelector(SELECTORS.BUTTON_ICON);
    if (!iconElement) return;

    const mainIcon = iconElement.querySelector(SELECTORS.BUTTON_ICON_MAIN);
    const loadingIcon = iconElement.querySelector(SELECTORS.BUTTON_ICON_LOADING);

    // Store original display state on first call
    if (!iconElement.dataset.originalDisplay) {
      const computedStyle = window.getComputedStyle(iconElement);
      const originalDisplay = computedStyle.display === DISPLAY.NONE 
        ? DISPLAY.NONE 
        : DISPLAY.FLEX;
      iconElement.dataset.originalDisplay = originalDisplay;
    }

    if (isLoading) {
      iconElement.style.display = DISPLAY.FLEX;
      if (mainIcon) mainIcon.style.display = DISPLAY.NONE;
      if (loadingIcon) {
        loadingIcon.style.display = DISPLAY.FLEX;
      }
      button.classList.add(CLASSES.LOADING);
    } else {
      if (mainIcon) {
        mainIcon.style.display = DISPLAY.FLEX;
      }
      if (loadingIcon) {
        loadingIcon.style.display = DISPLAY.NONE;
      }
      iconElement.style.display = iconElement.dataset.originalDisplay;
      button.classList.remove(CLASSES.LOADING);
    }
  }

  /**
   * Adds customized item to cart
   * Uses shared utility if available
   * @param {string} variantId - Product variant ID
   * @param {number} quantity - Item quantity
   * @param {string} projectKey - FastEditor project key
   * @param {string} imageUrl - Customized image URL
   * @throws {Error} If cart addition fails
   */
  async function addItemToCart(variantId, quantity, projectKey, imageUrl) {
    const properties = {
      [CART_PROPERTIES.PROJECT_KEY]: projectKey,
      [CART_PROPERTIES.IMAGE_URL]: imageUrl,
      [CART_PROPERTIES.CUSTOMIZED]: 'Yes',
    };

    // Use shared utility if available
    if (window.FastEditorUtils && window.FastEditorUtils.addItemToCart) {
      return window.FastEditorUtils.addItemToCart(variantId, quantity, properties);
    }

    // Fallback implementation
    const formData = {
      items: [{
        id: variantId,
        quantity,
        properties,
      }],
    };

    const response = await fetch(
      `${window.Shopify?.routes?.root || '/'}${ENDPOINTS.CART_ADD}`,
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

    return response;
  }

  /**
   * Parse JSON with fallback
   * @param {string} raw
   * @param {*} fallback
   * @returns {*}
   */
  function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[FastEditor] Failed to parse JSON', error);
      return fallback;
    }
  }

  /**
   * Find variant by id
   * @param {Array} variants
   * @param {string} id
   * @returns {object|undefined}
   */
  function findVariant(variants, id) {
    if (!id) return undefined;
    return variants.find((variant) => String(variant.id) === String(id));
  }

  /**
   * Resolve current variant id from form
   * @param {HTMLFormElement|null} form
   * @param {string} fallbackId
   * @returns {string}
   */
  function resolveVariantId(form, fallbackId = '') {
    if (!form) return fallbackId;
    const select = form.querySelector('select[name="id"]');
    if (select?.value) return select.value;
    const checked = form.querySelector('input[name="id"]:checked');
    if (checked?.value) return checked.value;
    const input = form.querySelector('input[name="id"]');
    if (input?.value) return input.value;
    return fallbackId;
  }

  /**
   * Resolve quantity from form
   * @param {HTMLFormElement|null} form
   * @returns {number}
   */
  function resolveQuantity(form) {
    const input =
      (form && form.querySelector(SELECTORS.QUANTITY_INPUT))
      || document.querySelector(SELECTORS.QUANTITY_INPUT);

    if (!input) return DEFAULTS.QUANTITY;

    const value = parseInt(input.value, 10);
    return Number.isNaN(value) ? DEFAULTS.QUANTITY : value;
  }

  /**
   * Find product form within section or globally
   * @param {string} sectionId
   * @returns {HTMLFormElement|null}
   */
  function findProductForm(sectionId) {
    const section = sectionId ? document.getElementById(`shopify-section-${sectionId}`) : null;
    if (section) {
      const addForm = section.querySelector('form[action^="/cart/add"]');
      if (addForm) return addForm;
      const cartForm = section.querySelector('form[action^="/cart"]');
      if (cartForm) return cartForm;
    }
    return document.querySelector('form[action^="/cart/add"]') || document.querySelector('form[action^="/cart"]');
  }

  /**
   * Attach change listeners to variant inputs
   * @param {HTMLFormElement|null} form
   * @param {Function} callback
   */
  function attachVariantFormListeners(form, callback) {
    if (!form || typeof callback !== 'function') return;
    const inputs = form.querySelectorAll('input[name="id"], select[name="id"]');
    inputs.forEach((input) => {
      input.addEventListener('change', () => callback());
    });
  }

  /**
   * FastEditor Customize Button Web Component
   */
  class FastEditorCustomizeButton extends HTMLElement {
    constructor() {
      super();
      this.button = null;
      this.originalText = '';
      this.initialized = false;
      this.variants = [];
      this.currentVariantId = '';
      this.form = null;
      this.sectionId = '';
      this.variantChangeHandler = null;
    }

    /**
     * Called when element is connected to DOM
     */
    connectedCallback() {
      if (this.initialized) return;
      this.initialize();
    }

    /**
     * Cleanup listeners
     */
    disconnectedCallback() {
      if (this.variantChangeHandler) {
        document.removeEventListener('variant:change', this.variantChangeHandler);
      }
    }

    /**
     * Initialize component
     */
    initialize() {
      this.button = this.querySelector('button');
      if (!this.button) return;

      // Store original text early for reuse
      const textElement = this.button.querySelector(SELECTORS.BUTTON_TEXT);
      this.originalText = textElement
        ? textElement.textContent
        : this.button.textContent;

      this.sectionId = this.button.dataset.sectionId || this.dataset.sectionId || '';
      this.variants = parseJSON(this.button.dataset.variants, []);
      this.form = findProductForm(this.sectionId);
      this.currentVariantId = this.button.dataset.initialVariantId
        || resolveVariantId(this.form, '');

      // Check availability
      const availability = this.button.dataset.availability;
      const isVariantAvailable = this.button.dataset.variantAvailable === 'true';

      if (availability === 'false') {
        setButtonState(this.button, this.originalText, true);
      }

      if (!isVariantAvailable) {
        setButtonState(this.button, this.originalText, true);
      }

      // Prime state for current variant
      const initialVariant = findVariant(this.variants, this.currentVariantId);
      this.updateVariantState(initialVariant || { available: isVariantAvailable, id: this.currentVariantId });
      this.bindVariantListeners();

      // Add click handler
      this.button.addEventListener('click', () => this.handleClick());

      // Handle auto add to cart if URL parameter exists
      this.handleAutoAddToCart();

      this.initialized = true;
    }

    /**
     * Handle button click - redirect to FastEditor
     */
    async handleClick() {
      if (!this.button || this.button.hasAttribute('disabled')) return;

      const shop = this.button.dataset.shop;
      const productHandle = this.button.dataset.handle;
      const variantId = this.getSelectedVariantId();
      if (!variantId) return;
      const quantity = resolveQuantity(this.form);
      const loadingText = this.button.dataset.loadingText || DEFAULTS.LOADING_TEXT;
      const errorText = this.button.dataset.errorText || DEFAULTS.ERROR_TEXT;

      // Get or create userId from cookie
      const userId = window.getOrCreateUserId ? window.getOrCreateUserId() : null;

      try {
        setButtonState(this.button, loadingText, true);
        setButtonLoadingIcon(this.button, true);

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
          setButtonLoadingIcon(this.button, false);
          setButtonState(this.button, errorText, false);
          return;
        }

        // Check for structured error response
        if (!response.ok || !responseData.ok) {
          console.error('[FastEditor] API error:', {
            statusCode: responseData.statusCode || response.status,
            message: responseData.message || responseData.statusText,
            code: responseData.code || 'UNKNOWN_ERROR',
          });
          
          setButtonLoadingIcon(this.button, false);
          setButtonState(this.button, errorText, false);
          
          setTimeout(() => {
            setButtonState(this.button, this.originalText, false);
          }, TIMEOUTS.TEXT_RESTORE);
          return;
        }

        // Check for successful response with URL
        if (!responseData.data?.url) {
          console.error('[FastEditor] Missing URL in response:', responseData);
          setButtonLoadingIcon(this.button, false);
          setButtonState(this.button, errorText, false);
          
          setTimeout(() => {
            setButtonState(this.button, this.originalText, false);
          }, TIMEOUTS.TEXT_RESTORE);
          return;
        }

        // Success - redirect to FastEditor customization page
        window.location.href = responseData.data.url;
      } catch (error) {
        console.error('[FastEditor] Redirect error:', error);
        
        setButtonLoadingIcon(this.button, false);
        setButtonState(this.button, errorText, false);
        
        setTimeout(() => {
          setButtonState(this.button, this.originalText, false);
        }, TIMEOUTS.TEXT_RESTORE);
      }
    }

    /**
     * Keep button state in sync with variant
     * @param {object|null|undefined} variant
     */
    updateVariantState(variant) {
      const isVariantAvailable = Boolean(variant?.available);

      this.currentVariantId = variant?.id ? String(variant.id) : this.currentVariantId;
      this.button.dataset.variantAvailable = String(isVariantAvailable);

      if (!variant) {
        setButtonState(this.button, this.originalText, true);
        setButtonLoadingIcon(this.button, false);
        return;
      }

      if (!isVariantAvailable) {
        setButtonState(this.button, this.originalText, true);
        setButtonLoadingIcon(this.button, false);
        return;
      }

      setButtonLoadingIcon(this.button, false);
      setButtonState(this.button, this.originalText, false);
    }

    /**
     * Apply variant update by id
     * @param {string} nextId
     * @param {object} providedVariant
     */
    applyVariantChange(nextId, providedVariant) {
      if (nextId) {
        this.currentVariantId = String(nextId);
      }
      const variant = providedVariant || findVariant(this.variants, this.currentVariantId);
      this.updateVariantState(variant);
    }

    /**
     * Handle variant change events from theme
     * @param {CustomEvent} event
     */
    handleVariantChange(event) {
      const detail = event?.detail || {};
      const variant = detail.variant || findVariant(this.variants, detail.id);
      const variantId = variant?.id || detail.id || this.currentVariantId;
      this.applyVariantChange(variantId, variant);
    }

    /**
     * Update state based on current form selection
     */
    handleVariantUpdateFromForm() {
      const nextId = resolveVariantId(this.form, this.currentVariantId);
      this.applyVariantChange(nextId);
    }

    /**
     * Attach listeners for variant updates
     */
    bindVariantListeners() {
      this.variantChangeHandler = (event) => this.handleVariantChange(event);
      document.addEventListener('variant:change', this.variantChangeHandler);
      attachVariantFormListeners(this.form, () => this.handleVariantUpdateFromForm());
    }

    /**
     * Get currently selected variant id
     * @returns {string|undefined}
     */
    getSelectedVariantId() {
      if (this.currentVariantId) return this.currentVariantId;
      this.currentVariantId = resolveVariantId(this.form, '');
      return this.currentVariantId || document.querySelector(SELECTORS.VARIANT_INPUT)?.value;
    }

    /**
     * Handle automatic add to cart flow for customized products
     */
    async handleAutoAddToCart() {
      if (!this.button) return;

      const urlParams = new URLSearchParams(window.location.search);
      const fasteditorCartUrl = urlParams.get(URL_PARAMS.FASTEDITOR_CART_URL);

      // Exit early if no FastEditor cart URL parameter
      if (!fasteditorCartUrl) return;

      const enableCartRedirect = this.button.dataset.redirect === 'true';
      const addingToCartText = this.button.dataset.addingToCartText 
        || DEFAULTS.ADDING_TO_CART;
      const addedToCartText = this.button.dataset.addedToCartText 
        || DEFAULTS.ADDED_TO_CART;

    // Shared guard to ensure only one network call; all buttons mirror the same state
    if (!window.FastEditorAutoAddGuard) {
      window.FastEditorAutoAddGuard = {
        buttons: [],
        state: 'idle',
        promise: null,
        texts: null,
      };
    }
    const guard = window.FastEditorAutoAddGuard;

    // Register this button
    guard.buttons.push({
      button: this.button,
      originalText: this.originalText,
    });

    // Capture shared texts from the first button
    if (!guard.texts) {
      guard.texts = {
        addingToCartText,
        addedToCartText,
      };
    }

    const setLoadingForAll = () => {
      guard.buttons.forEach(({ button }) => {
        setButtonState(button, guard.texts.addingToCartText, true);
        setButtonLoadingIcon(button, true);
      });
    };

    const setSuccessForAll = () => {
      guard.buttons.forEach(({ button, originalText }) => {
        setButtonLoadingIcon(button, false);
        setButtonState(button, guard.texts.addedToCartText, true);
        setTimeout(() => {
          setButtonState(button, originalText, false);
        }, TIMEOUTS.TEXT_RESTORE);
      });
    };

    const setErrorForAll = () => {
      guard.buttons.forEach(({ button, originalText }) => {
        setButtonLoadingIcon(button, false);
        setButtonState(button, originalText, false);
      });
    };

    // If a request is already in flight, mirror state and await its completion
    if (guard.state === 'loading' && guard.promise) {
      setLoadingForAll();
      try {
        await guard.promise;
        if (guard.state === 'success') {
          setSuccessForAll();
        } else if (guard.state === 'error') {
          setErrorForAll();
        }
      } catch {
        setErrorForAll();
      }
      return;
    }

    // If already settled, just apply final state
    if (guard.state === 'success') {
      setSuccessForAll();
      return;
    }
    if (guard.state === 'error') {
      setErrorForAll();
      return;
    }

    // First trigger: run the flow
    guard.state = 'loading';
    setLoadingForAll();
    guard.promise = (async () => {
      try {
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
          throw parseError;
        }

        // Check for structured error response
        if (!response.ok || !responseData.ok) {
          console.error('[FastEditor] API error:', {
            statusCode: responseData.statusCode || response.status,
            message: responseData.message || responseData.statusText,
            code: responseData.code || 'UNKNOWN_ERROR',
          });
          throw new Error('API error');
        }

        // Validate response data
        const { data } = responseData;
        if (!data?.variantId || !data?.quantity || 
            !data?.projectKey || !data?.imageUrl) {
          console.error('[FastEditor] Missing required fields in response:', data);
          throw new Error('Invalid response payload');
        }

        // Add item to cart
        await addItemToCart(
          data.variantId, 
          data.quantity, 
          data.projectKey, 
          data.imageUrl
        );

        // Update buttons to success state
        guard.state = 'success';
        setSuccessForAll();

        // Clean up URL parameter
        urlParams.delete(URL_PARAMS.FASTEDITOR_CART_URL);
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);

        // Redirect or reload based on settings
        if (enableCartRedirect) {
          window.location.href = ROUTES.CART;
        } else {
          location.reload();
        }
      } catch (error) {
        console.error('[FastEditor] Cart initialization error:', error);
        guard.state = 'error';
        setErrorForAll();
        return;
      }
    })();

    // Wait for promise to settle to keep state consistent
    try {
      await guard.promise;
    } catch {
      // state already set to error
    }
    }
  }

  // Register the custom element
  if (!customElements.get('fasteditor-customize-button')) {
    customElements.define('fasteditor-customize-button', FastEditorCustomizeButton);
  }

  // Expose utility functions globally for backward compatibility
  window.FastEditorCustomizeButtonUtils = {
    setButtonState,
    setButtonLoadingIcon,
  };
})();

