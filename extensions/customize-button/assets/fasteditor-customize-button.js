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
    ERROR_NOTICE: '.fasteditor-customize-button__notice',
    VARIANT_INPUT: 'input[name="id"]',
    QUANTITY_INPUT: 'input[name="quantity"]',
  };

  /**
   * CSS class names
   */
  const CLASSES = {
    LOADING: 'fasteditor-customize-button--loading',
    ERROR_NOTICE_VISIBLE: 'fasteditor-customize-button__notice--visible',
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
    CART: 'cart.js',
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
    PRICING_MODE: '_fasteditor_pricing_mode',
    EXTRA_PAGES: '_fasteditor_extra_pages',
    PRICE_PER_EXTRA_PAGE: '_fasteditor_price_per_extra_page',
    EXTRA_UNIT_AMOUNT: '_fasteditor_extra_unit_amount',
    EXTRA_VARIANT_ID: '_fasteditor_extra_variant_id',
    PRICING_RULE_ID: '_fasteditor_pricing_rule_id',
    PRICING_RULE_TITLE: '_fasteditor_pricing_rule_title',
    PARENT_VARIANT_ID: '_fasteditor_parent_variant_id',
    PARENT_PROJECT_KEY: '_fasteditor_parent_project_key',
  };

  /**
   * Timeouts (in milliseconds)
   */
  const TIMEOUTS = {
    TEXT_RESTORE: 3000,
    AUTO_ADD_INTERCEPT: 4000,
    AUTO_ADD_REQUEST: 15000,
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
   * Adds one or more items to cart.
   * Uses shared utility when only one line item is present.
   * @param {Array} items
   * @throws {Error} If cart addition fails
   */
  async function addItemsToCart(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No cart items to add');
    }

    if (
      items.length === 1
      && window.FastEditorUtils
      && window.FastEditorUtils.addItemToCart
    ) {
      const [item] = items;
      const response = await window.FastEditorUtils.addItemToCart(
        item.id,
        item.quantity,
        item.properties || {}
      );
      return patchLineUpdateCartAddResponse(response, items, window.fetch.bind(window));
    }

    const response = await fetch(
      `${window.Shopify?.routes?.root || '/'}${ENDPOINTS.CART_ADD}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add items to cart: ${error}`);
    }

    return patchLineUpdateCartAddResponse(response, items, window.fetch.bind(window));
  }

  /**
   * Auto-add debug logger
   * @param {string} message
   * @param {object|undefined} details
   */
  function logAutoAdd(message, details) {
    if (typeof details === 'undefined') {
      console.info(`[FastEditor][AutoAdd] ${message}`);
      return;
    }

    console.info(`[FastEditor][AutoAdd] ${message}`, details);
  }

  /**
   * Prepare small DOM descriptor for debug logs
   * @param {Element|null|undefined} element
   * @returns {object|null}
   */
  function describeElement(element) {
    if (!element) return null;

    return {
      tagName: element.tagName,
      id: element.id || '',
      name: element.getAttribute('name') || '',
      type: element.getAttribute('type') || '',
      action: element.getAttribute('action') || '',
      method: element.getAttribute('method') || '',
      classes: element.className || '',
      dataset: element.dataset ? { ...element.dataset } : {},
    };
  }

  /**
   * Escape attribute value for selector usage
   * @param {string} value
   * @returns {string}
   */
  function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, '\\$&');
  }

  /**
   * Whether the request targets Shopify cart add endpoint
   * @param {string} url
   * @param {string} method
   * @returns {boolean}
   */
  function isCartAddRequest(url, method = 'GET') {
    if (String(method || 'GET').toUpperCase() !== 'POST') return false;
    if (!url) return false;

    try {
      const absoluteUrl = new URL(url, window.location.origin);
      return /\/cart\/add(?:\.js)?\/?$/.test(absoluteUrl.pathname);
    } catch (error) {
      console.error('[FastEditor] Failed to resolve cart/add URL:', error);
      return false;
    }
  }

  /**
   * Whether form/json field belongs to cart line item payload
   * @param {string} key
   * @returns {boolean}
   */
  function isCartItemField(key) {
    return (
      key === 'id'
      || key === 'quantity'
      || key === 'properties'
      || key === 'items'
      || key === 'selling_plan'
      || /^properties\[/.test(key)
      || /^items\[/.test(key)
    );
  }

  /**
   * Serialize cart item for JSON request body
   * @param {object} item
   * @returns {object}
   */
  function serializeCartItem(item) {
    const nextItem = {
      id: item.id,
      quantity: item.quantity,
    };

    if (item.properties && Object.keys(item.properties).length > 0) {
      nextItem.properties = item.properties;
    }

    return nextItem;
  }

  /**
   * Whether cart item uses Shopify cart transform line_update pricing mode
   * @param {object|null|undefined} item
   * @returns {boolean}
   */
  function isLineUpdateCartItem(item) {
    if (!item || typeof item !== 'object') return false;

    const properties = item.properties && typeof item.properties === 'object'
      ? item.properties
      : {};

    return String(properties[CART_PROPERTIES.PRICING_MODE] || '') === 'line_update'
      && String(properties[CART_PROPERTIES.PROJECT_KEY] || '') !== '';
  }

  /**
   * Fetch current Shopify cart state
   * @param {Function} requestFn
   * @returns {Promise<object>}
   */
  async function fetchCurrentCart(requestFn) {
    const response = await requestFn(
      `${window.Shopify?.routes?.root || '/'}${ENDPOINTS.CART}`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch cart snapshot: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Find line_update cart item in cart.js by project key
   * @param {object|null} cart
   * @param {Array} cartItems
   * @returns {object|null}
   */
  function findMatchingLineUpdateCartItem(cart, cartItems) {
    if (!Array.isArray(cart?.items) || !Array.isArray(cartItems)) {
      return null;
    }

    const sourceItem = cartItems.find((item) => isLineUpdateCartItem(item));
    if (!sourceItem) {
      return null;
    }

    const sourceProperties = sourceItem.properties || {};
    const projectKey = String(sourceProperties[CART_PROPERTIES.PROJECT_KEY] || '');
    const variantId = String(sourceItem.id || '');

    const matchingItems = cart.items.filter((item) => {
      const properties = item?.properties && typeof item.properties === 'object'
        ? item.properties
        : {};

      if (String(properties[CART_PROPERTIES.PARENT_PROJECT_KEY] || '') !== '') {
        return false;
      }

      if (projectKey && String(properties[CART_PROPERTIES.PROJECT_KEY] || '') === projectKey) {
        return true;
      }

      return (
        String(properties[CART_PROPERTIES.PRICING_MODE] || '') === 'line_update'
        && String(item?.id || '') === variantId
      );
    });

    return matchingItems[matchingItems.length - 1] || null;
  }

  /**
   * Normalize cart/add response for line_update mode using current cart snapshot
   * @param {Response} response
   * @param {Array} cartItems
   * @param {Function} requestFn
   * @returns {Promise<Response>}
   */
  async function patchLineUpdateCartAddResponse(response, cartItems, requestFn) {
    if (!response?.ok || !Array.isArray(cartItems) || !cartItems.some((item) => isLineUpdateCartItem(item))) {
      return response;
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return response;
    }

    let payload = null;
    try {
      payload = await response.clone().json();
    } catch (error) {
      logAutoAdd('Failed to parse cart/add response for line_update normalization', {
        message: error?.message || String(error),
      });
      return response;
    }

    let matchedCartItem = null;
    try {
      const cart = await fetchCurrentCart(requestFn);
      matchedCartItem = findMatchingLineUpdateCartItem(cart, cartItems);
    } catch (error) {
      logAutoAdd('Failed to fetch cart snapshot for line_update normalization', {
        message: error?.message || String(error),
      });
      return response;
    }

    if (!matchedCartItem) {
      logAutoAdd('No matching cart.js line item found for line_update normalization');
      return response;
    }

    const nextPayload = (payload && typeof payload === 'object' && !Array.isArray(payload))
      ? { ...payload, ...matchedCartItem }
      : matchedCartItem;

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.delete('Content-Length');

    logAutoAdd('Normalized line_update cart/add response from cart.js snapshot', {
      projectKey: matchedCartItem.properties?.[CART_PROPERTIES.PROJECT_KEY] || '',
      key: matchedCartItem.key || '',
      finalPrice: matchedCartItem.final_price,
      finalLinePrice: matchedCartItem.final_line_price,
    });

    return new Response(JSON.stringify(nextPayload), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  /**
   * Append cart items to FormData or URLSearchParams
   * @param {FormData|URLSearchParams} target
   * @param {Array} cartItems
   */
  function appendCartItems(target, cartItems) {
    const appendField = (key, value) => {
      target.append(key, String(value));
    };

    if (cartItems.length === 1) {
      const [item] = cartItems;
      appendField('id', item.id);
      appendField('quantity', item.quantity);

      Object.entries(item.properties || {}).forEach(([key, value]) => {
        appendField(`properties[${key}]`, value);
      });
      return;
    }

    cartItems.forEach((item, index) => {
      appendField(`items[${index}][id]`, item.id);
      appendField(`items[${index}][quantity]`, item.quantity);

      Object.entries(item.properties || {}).forEach(([key, value]) => {
        appendField(`items[${index}][properties][${key}]`, value);
      });
    });
  }

  /**
   * Build replacement FormData while preserving theme metadata
   * @param {FormData} source
   * @param {Array} cartItems
   * @returns {FormData}
   */
  function buildInterceptedFormData(source, cartItems) {
    const nextBody = new FormData();

    source.forEach((value, key) => {
      if (!isCartItemField(key)) {
        nextBody.append(key, value);
      }
    });

    appendCartItems(nextBody, cartItems);
    return nextBody;
  }

  /**
   * Build replacement URLSearchParams while preserving theme metadata
   * @param {URLSearchParams} source
   * @param {Array} cartItems
   * @returns {URLSearchParams}
   */
  function buildInterceptedSearchParams(source, cartItems) {
    const nextBody = new URLSearchParams();

    source.forEach((value, key) => {
      if (!isCartItemField(key)) {
        nextBody.append(key, value);
      }
    });

    appendCartItems(nextBody, cartItems);
    return nextBody;
  }

  /**
   * Build replacement JSON payload while preserving theme metadata
   * @param {object} payload
   * @param {Array} cartItems
   * @returns {object}
   */
  function buildInterceptedJsonPayload(payload, cartItems) {
    const nextPayload = {};

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (!isCartItemField(key)) {
        nextPayload[key] = value;
      }
    });

    const useItemsArray = cartItems.length > 1 || Array.isArray(payload?.items);
    if (useItemsArray) {
      nextPayload.items = cartItems.map((item) => serializeCartItem(item));
      return nextPayload;
    }

    const [item] = cartItems;
    nextPayload.id = item.id;
    nextPayload.quantity = item.quantity;

    if (item.properties && Object.keys(item.properties).length > 0) {
      nextPayload.properties = item.properties;
    }

    return nextPayload;
  }

  /**
   * Build replacement body from raw string payload
   * @param {string} rawBody
   * @param {Headers} headers
   * @param {Array} cartItems
   * @returns {string}
   */
  function buildInterceptedStringBody(rawBody, headers, cartItems) {
    const contentType = headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      const payload = parseJSON(rawBody, {});
      headers.set('Content-Type', 'application/json');
      return JSON.stringify(buildInterceptedJsonPayload(payload, cartItems));
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      return buildInterceptedSearchParams(
        new URLSearchParams(rawBody),
        cartItems
      ).toString();
    }

    const parsedJson = parseJSON(rawBody, null);
    if (parsedJson && typeof parsedJson === 'object') {
      headers.set('Content-Type', 'application/json');
      return JSON.stringify(buildInterceptedJsonPayload(parsedJson, cartItems));
    }

    return buildInterceptedSearchParams(
      new URLSearchParams(rawBody),
      cartItems
    ).toString();
  }

  /**
   * Build replacement request body for fetch interception
   * @param {Request|FormData|URLSearchParams|string|undefined|null} source
   * @param {Headers} headers
   * @param {Array} cartItems
   * @returns {Promise<BodyInit>}
   */
  async function buildInterceptedRequestBody(source, headers, cartItems) {
    if (source instanceof FormData) {
      headers.delete('Content-Type');
      return buildInterceptedFormData(source, cartItems);
    }

    if (source instanceof URLSearchParams) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      return buildInterceptedSearchParams(source, cartItems).toString();
    }

    if (typeof source === 'string') {
      return buildInterceptedStringBody(source, headers, cartItems);
    }

    if (source && typeof source.text === 'function') {
      const sourceHeaders = source.headers instanceof Headers ? source.headers : null;
      const contentType =
        headers.get('Content-Type')
        || sourceHeaders?.get('Content-Type')
        || '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await source.formData();
        headers.delete('Content-Type');
        return buildInterceptedFormData(formData, cartItems);
      }

      const rawBody = await source.text();
      if (contentType.includes('application/x-www-form-urlencoded')) {
        headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      }
      return buildInterceptedStringBody(rawBody, headers, cartItems);
    }

    headers.set('Content-Type', 'application/json');
    return JSON.stringify(buildInterceptedJsonPayload({}, cartItems));
  }

  /**
   * Build replacement Request object for intercepted fetch
   * @param {RequestInfo|URL} resource
   * @param {RequestInit|undefined} init
   * @param {Array} cartItems
   * @returns {Promise<Request|null>}
   */
  async function buildInterceptedFetchRequest(resource, init, cartItems) {
    const request = resource instanceof Request
      ? resource
      : new Request(resource, init);

    if (!isCartAddRequest(request.url, init?.method || request.method)) {
      return null;
    }

    const hasExplicitBody = Boolean(
      init && Object.prototype.hasOwnProperty.call(init, 'body')
    );
    const headers = new Headers(init?.headers || request.headers || undefined);
    const bodySource = hasExplicitBody ? init.body : request.clone();
    const body = await buildInterceptedRequestBody(bodySource, headers, cartItems);

    return new Request(request, {
      headers,
      body,
    });
  }

  /**
   * Build replacement payload for intercepted XMLHttpRequest
   * @param {BodyInit|undefined|null} body
   * @param {Array} cartItems
   * @returns {BodyInit}
   */
  function buildInterceptedXhrBody(body, cartItems) {
    const headers = new Headers();

    if (body instanceof FormData) {
      return buildInterceptedFormData(body, cartItems);
    }

    if (body instanceof URLSearchParams) {
      return buildInterceptedSearchParams(body, cartItems).toString();
    }

    if (typeof body === 'string') {
      return buildInterceptedStringBody(body, headers, cartItems);
    }

    headers.set('Content-Type', 'application/json');
    return JSON.stringify(buildInterceptedJsonPayload({}, cartItems));
  }

  /**
   * Install one-shot interception for the next theme cart/add request
   * @param {object} options
   * @returns {Function}
   */
  function createCartAddRequestInterceptor(options) {
    const { cartItems, onRequest, onSuccess, onError } = options;
    const originalFetch = window.fetch;
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    let handled = false;
    let restored = false;

    const restore = () => {
      if (restored) return;
      restored = true;
      logAutoAdd('Restoring original fetch/XMLHttpRequest handlers');
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
      XMLHttpRequest.prototype.send = originalXhrSend;
    };

    window.fetch = async function interceptFastEditorCartAdd(resource, init) {
      if (handled) {
        return originalFetch.call(this, resource, init);
      }

      let interceptedRequest;
      try {
        interceptedRequest = await buildInterceptedFetchRequest(resource, init, cartItems);
      } catch (error) {
        handled = true;
        restore();
        onError?.(error);
        throw error;
      }

      if (!interceptedRequest) {
        return originalFetch.call(this, resource, init);
      }

      handled = true;
      restore();
      logAutoAdd('Intercepted fetch cart/add request', {
        url: interceptedRequest.url,
        method: interceptedRequest.method,
      });
      onRequest?.(interceptedRequest.url);

      try {
        const response = await originalFetch.call(this, interceptedRequest);
        const normalizedResponse = await patchLineUpdateCartAddResponse(
          response,
          cartItems,
          originalFetch.bind(window)
        );

        if (normalizedResponse.ok) {
          logAutoAdd('Fetch cart/add request completed successfully', {
            status: normalizedResponse.status,
            url: interceptedRequest.url,
          });
          onSuccess?.(normalizedResponse);
        } else {
          logAutoAdd('Fetch cart/add request failed', {
            status: normalizedResponse.status,
            url: interceptedRequest.url,
          });
          onError?.(new Error(`Cart add request failed with status ${normalizedResponse.status}`));
        }
        return normalizedResponse;
      } catch (error) {
        onError?.(error);
        throw error;
      }
    };

    XMLHttpRequest.prototype.open = function interceptFastEditorXhrOpen(method, url) {
      this.__fasteditorMethod = method;
      this.__fasteditorUrl = url;
      return originalXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function interceptFastEditorXhrSend(body) {
      if (handled || !isCartAddRequest(this.__fasteditorUrl, this.__fasteditorMethod)) {
        return originalXhrSend.call(this, body);
      }

      handled = true;
      restore();
      logAutoAdd('Intercepted XHR cart/add request', {
        url: this.__fasteditorUrl,
        method: this.__fasteditorMethod,
      });
      onRequest?.(this.__fasteditorUrl);

      const handleLoad = () => {
        if (this.status >= 200 && this.status < 400) {
          logAutoAdd('XHR cart/add request completed successfully', {
            status: this.status,
            url: this.__fasteditorUrl,
          });
          onSuccess?.({ ok: true, status: this.status, xhr: this });
        } else {
          logAutoAdd('XHR cart/add request failed', {
            status: this.status,
            url: this.__fasteditorUrl,
          });
          onError?.(new Error(`Cart add request failed with status ${this.status}`));
        }
      };
      const handleNetworkError = () => {
        logAutoAdd('XHR cart/add request failed with network error', {
          url: this.__fasteditorUrl,
        });
        onError?.(new Error('Cart add request failed'));
      };

      this.addEventListener('load', handleLoad, { once: true });
      this.addEventListener('error', handleNetworkError, { once: true });

      try {
        return originalXhrSend.call(this, buildInterceptedXhrBody(body, cartItems));
      } catch (error) {
        onError?.(error);
        throw error;
      }
    };

    return restore;
  }

  /**
   * Find theme add-to-cart submitter inside product form
   * @param {HTMLFormElement|null} form
   * @returns {HTMLElement|null}
   */
  function findProductSubmitButton(form, root) {
    if (!form) return null;

    const submitSelectors = [
      'button[type="submit"]:not([disabled]):not([name="checkout"])',
      'input[type="submit"]:not([disabled])',
    ];

    for (const selector of submitSelectors) {
      const submitButton = form.querySelector(selector);
      if (submitButton) {
        return submitButton;
      }
    }

    const formId = form.getAttribute('id');
    if (formId) {
      const escapedFormId = escapeSelectorValue(formId);
      const scopes = [root, document].filter(Boolean);

      for (const scope of scopes) {
        for (const selector of submitSelectors) {
          const submitButton = scope.querySelector(`${selector}[form="${escapedFormId}"]`);
          if (submitButton) {
            return submitButton;
          }
        }
      }
    }

    return null;
  }

  /**
   * Trigger theme add-to-cart flow using submit button or form submit
   * @param {HTMLFormElement} form
   * @param {HTMLElement|null} submitButton
   */
  function triggerThemeAddToCart(form, submitButton) {
    if (!form) {
      throw new Error('Missing product form for auto add');
    }

    if (submitButton && typeof submitButton.click === 'function') {
      logAutoAdd('Triggering submit button click', describeElement(submitButton));
      submitButton.click();
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      logAutoAdd('Submit button not found, using form.requestSubmit()', describeElement(form));
      form.requestSubmit();
      return;
    }

    logAutoAdd('Submit button and requestSubmit unavailable, dispatching submit event manually', describeElement(form));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  /**
   * Execute add-to-cart via theme form and fall back to direct cart/add when needed
   * @param {object} options
   * @returns {Promise<{mode: string, response: Response|object}>}
   */
  async function runThemeAutoAddFlow(options) {
    const { form, cartItems, fallback, sectionRoot } = options;

    if (!form) {
      logAutoAdd('Product form was not found, switching to direct fallback');
      const response = await fallback();
      return { mode: 'direct', response };
    }

    const submitButtons = form.querySelectorAll(
      'button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled])'
    );
    const submitButton = findProductSubmitButton(form, sectionRoot);
    logAutoAdd('Found product form', describeElement(form));
    logAutoAdd('Submit buttons found inside form', {
      count: submitButtons.length,
      buttons: Array.from(submitButtons).map((button) => describeElement(button)),
    });
    logAutoAdd(
      submitButton ? 'Found submit button' : 'Submit button was not found',
      submitButton ? describeElement(submitButton) : describeElement(form)
    );

    return new Promise((resolve, reject) => {
      let requestStarted = false;
      let requestTimeoutId = 0;
      let fallbackTimeoutId = 0;
      let settled = false;
      let restoreInterceptor = () => {};

      const cleanup = () => {
        window.clearTimeout(fallbackTimeoutId);
        window.clearTimeout(requestTimeoutId);
        form.removeEventListener('submit', preventNativeSubmit, true);
        if (submitButton) {
          submitButton.removeEventListener('click', handleDebugClick, true);
        }
        form.removeEventListener('submit', handleDebugSubmit, true);
        restoreInterceptor();
      };

      const settleSuccess = (payload) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(payload);
      };

      const settleError = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const runFallback = () => {
        if (settled) return;
        settled = true;
        cleanup();
        logAutoAdd('Theme cart/add request was not observed in time, running direct fallback', {
          timeoutMs: TIMEOUTS.AUTO_ADD_INTERCEPT,
        });
        Promise.resolve()
          .then(() => fallback())
          .then((response) => {
            resolve({ mode: 'direct', response });
          })
          .catch((error) => {
            reject(error);
          });
      };

      const preventNativeSubmit = (event) => {
        logAutoAdd('Submit event captured, preventing native form navigation', {
          action: form.getAttribute('action') || '',
          submitter: describeElement(event.submitter),
        });
        event.preventDefault();
      };

      const handleDebugClick = () => {
        logAutoAdd('Submit button click event fired');
      };

      const handleDebugSubmit = (event) => {
        logAutoAdd('Form submit event fired', {
          action: form.getAttribute('action') || '',
          submitter: describeElement(event.submitter),
        });
      };

      logAutoAdd('Installing one-shot cart/add interceptor');
      form.addEventListener('submit', preventNativeSubmit, true);
      form.addEventListener('submit', handleDebugSubmit, true);
      if (submitButton) {
        submitButton.addEventListener('click', handleDebugClick, true);
      }

      restoreInterceptor = createCartAddRequestInterceptor({
        cartItems,
        onRequest() {
          requestStarted = true;
          window.clearTimeout(fallbackTimeoutId);
          logAutoAdd('Theme cart/add request started');
          requestTimeoutId = window.setTimeout(() => {
            settleError(new Error('Timed out waiting for theme cart/add response'));
          }, TIMEOUTS.AUTO_ADD_REQUEST);
        },
        onSuccess(response) {
          logAutoAdd('Theme cart/add flow finished successfully', {
            mode: 'theme',
            status: response?.status,
          });
          settleSuccess({ mode: 'theme', response });
        },
        onError(error) {
          logAutoAdd('Theme cart/add flow failed', {
            message: error?.message || String(error),
          });
          settleError(error);
        },
      });

      fallbackTimeoutId = window.setTimeout(() => {
        if (!requestStarted) {
          runFallback();
        }
      }, TIMEOUTS.AUTO_ADD_INTERCEPT);

      try {
        triggerThemeAddToCart(form, submitButton);
      } catch (error) {
        settleError(error);
      }
    });
  }

  /**
   * Builds cart items for the main customized product and optional extra pricing product.
   * @param {object} data
   * @returns {Array}
   */
  function buildCartItems(data) {
    const mainProperties = {
      [CART_PROPERTIES.PROJECT_KEY]: data.projectKey,
      [CART_PROPERTIES.IMAGE_URL]: data.imageUrl,
      [CART_PROPERTIES.CUSTOMIZED]: 'Yes',
    };
    const pricingMode = data.pricingMode || 'extra_line';

    if (data.extraPricing) {
      mainProperties[CART_PROPERTIES.PRICING_MODE] = pricingMode;
      mainProperties[CART_PROPERTIES.EXTRA_PAGES] = String(data.extraPricing.extraPages);
      mainProperties[CART_PROPERTIES.PRICE_PER_EXTRA_PAGE] = String(data.extraPricing.pricePerExtraPage);
      mainProperties[CART_PROPERTIES.EXTRA_UNIT_AMOUNT] = String(data.extraPricing.extraUnitAmount);
      mainProperties[CART_PROPERTIES.PRICING_RULE_ID] = data.extraPricing.ruleId;
      mainProperties[CART_PROPERTIES.PRICING_RULE_TITLE] = data.extraPricing.ruleTitle;

      if (pricingMode === 'extra_line') {
        mainProperties[CART_PROPERTIES.EXTRA_VARIANT_ID] = String(data.extraPricing.variantId);
      }
    }

    const items = [{
      id: data.variantId,
      quantity: data.quantity,
      properties: mainProperties,
    }];

    if (!data.extraPricing || pricingMode === 'line_update') {
      return items;
    }

    items.push({
      id: data.extraPricing.variantId,
      quantity: data.extraPricing.quantity,
      properties: {
        [CART_PROPERTIES.PRICING_MODE]: 'extra_line',
        [CART_PROPERTIES.EXTRA_PAGES]: String(data.extraPricing.extraPages),
        [CART_PROPERTIES.PARENT_PROJECT_KEY]: String(data.projectKey),
        [CART_PROPERTIES.PRICING_RULE_ID]: data.extraPricing.ruleId,
        [CART_PROPERTIES.PRICING_RULE_TITLE]: data.extraPricing.ruleTitle,
        [CART_PROPERTIES.PARENT_VARIANT_ID]: String(data.variantId),
      },
    });

    return items;
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
    const selectors = [
      'form[action*="/cart/add"]',
      'form[action*="/cart"]',
    ];
    const forms = [];
    const seenForms = new Set();

    const collectForms = (root) => {
      if (!root) return;

      for (const selector of selectors) {
        root.querySelectorAll(selector).forEach((form) => {
          if (seenForms.has(form)) return;
          seenForms.add(form);
          forms.push(form);
        });
      }
    };

    collectForms(section);
    collectForms(document);

    if (forms.length === 0) {
      return null;
    }

    const scoredForms = forms.map((form) => {
      const searchRoot = section || document;
      const submitButton = findProductSubmitButton(form, searchRoot);
      const hasVariantInput = Boolean(form.querySelector(SELECTORS.VARIANT_INPUT));
      const hasQuantityInput = Boolean(form.querySelector(SELECTORS.QUANTITY_INPUT));
      const action = form.getAttribute('action') || '';
      let score = 0;

      if (action.includes('/cart/add')) score += 3;
      if (hasVariantInput) score += 4;
      if (hasQuantityInput) score += 1;
      if (submitButton) score += 4;

      return {
        form,
        score,
        hasVariantInput,
        hasQuantityInput,
        submitButton,
      };
    });

    logAutoAdd('Product form candidates', {
      count: scoredForms.length,
      candidates: scoredForms.map((candidate) => ({
        score: candidate.score,
        hasVariantInput: candidate.hasVariantInput,
        hasQuantityInput: candidate.hasQuantityInput,
        submitButton: describeElement(candidate.submitButton),
        form: describeElement(candidate.form),
      })),
    });

    scoredForms.sort((left, right) => right.score - left.score);
    return scoredForms[0]?.form || null;
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
      this.errorNotice = null;
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
      this.errorNotice = this.querySelector(SELECTORS.ERROR_NOTICE);
      this.currentVariantId = this.button.dataset.initialVariantId
        || resolveVariantId(this.form, '');
      this.hideAutoAddErrorNotice();

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

      this.hideAutoAddErrorNotice();
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
        setButtonLoadingIcon(this.button, false);
        setButtonState(this.button, this.originalText, false);
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
      this.hideAutoAddErrorNotice();

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

    showAutoAddErrorNotice(message) {
      if (!this.errorNotice || !this.button) return;

      const resolvedMessage = message || this.button.dataset.autoAddErrorMessage || '';
      if (!resolvedMessage) {
        this.hideAutoAddErrorNotice();
        return;
      }

      this.errorNotice.textContent = resolvedMessage;
      this.errorNotice.hidden = false;
      this.errorNotice.classList.add(CLASSES.ERROR_NOTICE_VISIBLE);

      const color = this.button.dataset.autoAddErrorColor;
      if (color) {
        this.errorNotice.style.color = color;
      } else {
        this.errorNotice.style.removeProperty('color');
      }
    }

    hideAutoAddErrorNotice() {
      if (!this.errorNotice) return;

      this.errorNotice.textContent = '';
      this.errorNotice.hidden = true;
      this.errorNotice.classList.remove(CLASSES.ERROR_NOTICE_VISIBLE);
      this.errorNotice.style.removeProperty('color');
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
      logAutoAdd('Detected FastEditor return URL parameter', {
        sectionId: this.sectionId,
        fasteditorCartUrl,
      });

      const addingToCartText = this.button.dataset.addingToCartText 
        || DEFAULTS.ADDING_TO_CART;
      const addedToCartText = this.button.dataset.addedToCartText 
        || DEFAULTS.ADDED_TO_CART;
      const clearAutoAddUrlParam = () => {
        urlParams.delete(URL_PARAMS.FASTEDITOR_CART_URL);
        const nextSearch = urlParams.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? '?' + nextSearch : ''}`;
        window.history.replaceState({}, '', nextUrl);
      };

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
      component: this,
    });

    // Capture shared texts from the first button
    if (!guard.texts) {
      guard.texts = {
        addingToCartText,
        addedToCartText,
      };
    }

    const setLoadingForAll = () => {
      guard.buttons.forEach(({ button, component }) => {
        component?.hideAutoAddErrorNotice();
        setButtonState(button, guard.texts.addingToCartText, true);
        setButtonLoadingIcon(button, true);
      });
    };

    const setSuccessForAll = () => {
      guard.buttons.forEach(({ button, originalText, component }) => {
        component?.hideAutoAddErrorNotice();
        setButtonLoadingIcon(button, false);
        setButtonState(button, guard.texts.addedToCartText, true);
        setTimeout(() => {
          setButtonState(button, originalText, false);
        }, TIMEOUTS.TEXT_RESTORE);
      });
    };

    const setErrorForAll = () => {
      guard.buttons.forEach(({ button, originalText, component }) => {
        setButtonLoadingIcon(button, false);
        setButtonState(button, originalText, false);
        component?.showAutoAddErrorNotice();
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

        console.info('[FastEditor] Resolved product payload:', data);
        if (data.extraPricing) {
          console.info('[FastEditor] Extra pricing payload:', data.extraPricing);
        }

        if (Number(data.extraPages || 0) > 0 && !data.extraPricing) {
          console.error('[FastEditor] Extra pages detected but no pricing rule was resolved:', {
            variantId: data.variantId,
            extraPages: data.extraPages,
          });
          throw new Error('Missing pricing rule for extra pages');
        }

        const cartItems = buildCartItems(data);
        logAutoAdd('Prepared cart items for theme auto-add', {
          itemsCount: cartItems.length,
          variantIds: cartItems.map((item) => String(item.id)),
        });
        this.form = findProductForm(this.sectionId);
        const sectionRoot = this.sectionId
          ? document.getElementById(`shopify-section-${this.sectionId}`)
          : null;
        const autoAddResult = await runThemeAutoAddFlow({
          form: this.form,
          cartItems,
          fallback: () => addItemsToCart(cartItems),
          sectionRoot,
        });

        // Update buttons to success state
        guard.state = 'success';
        setSuccessForAll();

        // Clean up URL parameter
        clearAutoAddUrlParam();
        if (autoAddResult.mode === 'direct') {
          console.info('[FastEditor] Theme cart flow did not intercept request, direct add fallback completed.');
        } else {
          logAutoAdd('Theme auto-add completed without FastEditor redirect/reload');
        }
      } catch (error) {
        console.error('[FastEditor] Cart initialization error:', error);
        clearAutoAddUrlParam();
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
