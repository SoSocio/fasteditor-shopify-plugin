/**
 * FastEditor Cart Sync
 * Rewrites cart quantity mutations into a single cart/update.js request
 * so the parent customized product and the extra pricing product stay in sync.
 */

(function() {
  'use strict';

  if (window.FastEditorCartSyncInitialized) {
    return;
  }

  window.FastEditorCartSyncInitialized = true;

  const ROOT = window.Shopify?.routes?.root || '/';
  const ENDPOINTS = {
    CART: `${ROOT}cart.js`,
    UPDATE: `${ROOT}cart/update.js`,
  };
  const INTERNAL_HEADER = 'X-FastEditor-Cart-Sync';
  const PATH_PATTERNS = {
    MUTATION: /\/cart\/(?:change|update)(?:\.js)?$/,
  };
  const CART_PROPERTIES = {
    PROJECT_KEY: '_fasteditor_project_key',
    EXTRA_PAGES: '_fasteditor_extra_pages',
    PARENT_PROJECT_KEY: '_fasteditor_parent_project_key',
  };

  const originalFetch = window.fetch.bind(window);

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
  }

  function toPositiveInteger(value, fallback = 0) {
    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) {
      return fallback;
    }

    return Math.max(parsed, 0);
  }

  function collectEntries(entries) {
    const fields = {};

    for (const [key, rawValue] of entries) {
      const value = typeof rawValue === 'string' ? rawValue : String(rawValue);

      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        if (!Array.isArray(fields[key])) {
          fields[key] = [fields[key]];
        }

        fields[key].push(value);
        continue;
      }

      fields[key] = value;
    }

    return fields;
  }

  function mergeFields(target, source) {
    const merged = { ...target };

    Object.entries(source).forEach(([key, value]) => {
      if (merged[key] === undefined) {
        merged[key] = value;
        return;
      }

      const combined = asArray(merged[key]).concat(asArray(value));
      merged[key] = combined;
    });

    return merged;
  }

  function getBracketObject(fields, prefix) {
    const result = {};
    const prefixStart = `${prefix}[`;

    Object.entries(fields).forEach(([key, value]) => {
      if (!key.startsWith(prefixStart) || !key.endsWith(']')) {
        return;
      }

      const nestedKey = key.slice(prefixStart.length, -1);
      result[nestedKey] = value;
    });

    return result;
  }

  function normalizeStringArray(value) {
    const values = asArray(value)
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);

    return values.length > 0 ? values : null;
  }

  function resolveSections(fields) {
    const directSections = normalizeStringArray(fields.sections);
    if (directSections) {
      return directSections;
    }

    const bracketSections = normalizeStringArray(fields['sections[]']);
    if (bracketSections) {
      return bracketSections;
    }

    if (document.querySelector('cart-drawer, cart-drawer-items')) {
      return ['cart-drawer', 'cart-icon-bubble'];
    }

    return null;
  }

  function resolveSectionsUrl(fields) {
    if (typeof fields.sections_url === 'string' && fields.sections_url.trim() !== '') {
      return fields.sections_url;
    }

    return window.location.pathname || '/';
  }

  function getProperties(item) {
    return isPlainObject(item?.properties) ? item.properties : {};
  }

  function getProperty(item, key) {
    const value = getProperties(item)[key];
    return value === undefined || value === null ? '' : String(value);
  }

  function isMainFastEditorItem(item) {
    return getProperty(item, CART_PROPERTIES.PROJECT_KEY) !== ''
      && getProperty(item, CART_PROPERTIES.PARENT_PROJECT_KEY) === '';
  }

  function isExtraPricingItem(item) {
    return getProperty(item, CART_PROPERTIES.PARENT_PROJECT_KEY) !== '';
  }

  function hasManagedItems(cart) {
    return Array.isArray(cart?.items)
      && cart.items.some((item) => isMainFastEditorItem(item) || isExtraPricingItem(item));
  }

  function getHeaderValue(headers, name) {
    if (!headers) return '';

    if (headers instanceof Headers) {
      return headers.get(name) || '';
    }

    if (Array.isArray(headers)) {
      const match = headers.find(([key]) => String(key).toLowerCase() === name.toLowerCase());
      return match ? String(match[1]) : '';
    }

    if (isPlainObject(headers)) {
      const matchedKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === name.toLowerCase()
      );
      return matchedKey ? String(headers[matchedKey]) : '';
    }

    return '';
  }

  function resolveUrl(input) {
    try {
      if (typeof input === 'string') {
        return new URL(input, window.location.origin);
      }

      if (input instanceof URL) {
        return input;
      }

      if (input && typeof input.url === 'string') {
        return new URL(input.url, window.location.origin);
      }
    } catch (error) {
      console.error('[FastEditor] Failed to resolve request URL:', error);
    }

    return null;
  }

  function isCartMutationUrl(url) {
    if (!url) {
      return false;
    }

    return PATH_PATTERNS.MUTATION.test(url.pathname);
  }

  function isInternalRequest(input, init) {
    if (getHeaderValue(init?.headers, INTERNAL_HEADER)) {
      return true;
    }

    return input instanceof Request && Boolean(input.headers.get(INTERNAL_HEADER));
  }

  function getRequestMethod(input, init) {
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    return String(method || 'GET').toUpperCase();
  }

  async function fetchCart() {
    const response = await originalFetch(ENDPOINTS.CART, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        [INTERNAL_HEADER]: '1',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.status}`);
    }

    return response.json();
  }

  function parseRawTextPayload(text, contentType = '') {
    if (!text) {
      return { fields: {}, source: 'empty' };
    }

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text);
        return { fields: isPlainObject(parsed) ? parsed : {}, source: 'json' };
      } catch (error) {
        console.error('[FastEditor] Failed to parse JSON cart payload:', error);
        return { fields: {}, source: 'json' };
      }
    }

    return {
      fields: collectEntries(new URLSearchParams(text).entries()),
      source: 'search',
    };
  }

  function parseProvidedBody(body, contentType = '') {
    if (body === undefined || body === null) {
      return { fields: {}, source: 'empty' };
    }

    if (typeof body === 'string') {
      return parseRawTextPayload(body, contentType);
    }

    if (body instanceof FormData) {
      return {
        fields: collectEntries(body.entries()),
        source: 'form',
      };
    }

    if (body instanceof URLSearchParams) {
      return {
        fields: collectEntries(body.entries()),
        source: 'search',
      };
    }

    if (isPlainObject(body)) {
      return {
        fields: body,
        source: 'object',
      };
    }

    return { fields: {}, source: 'unknown' };
  }

  async function readRequestPayload(input, init) {
    const initHeaders = new Headers(init?.headers || undefined);
    const initContentType = initHeaders.get('Content-Type') || initHeaders.get('content-type') || '';

    if (init && Object.prototype.hasOwnProperty.call(init, 'body')) {
      return parseProvidedBody(init.body, initContentType);
    }

    if (!(input instanceof Request)) {
      return { fields: {}, source: 'empty' };
    }

    const request = input.clone();
    const requestContentType = request.headers.get('Content-Type')
      || request.headers.get('content-type')
      || initContentType;

    if (request.method === 'GET' || request.method === 'HEAD') {
      return { fields: {}, source: 'empty' };
    }

    if (requestContentType.includes('application/json')) {
      try {
        const json = await request.json();
        return {
          fields: isPlainObject(json) ? json : {},
          source: 'json',
        };
      } catch (error) {
        console.error('[FastEditor] Failed to read JSON cart request:', error);
        return { fields: {}, source: 'json' };
      }
    }

    try {
      const formData = await request.formData();
      return {
        fields: collectEntries(formData.entries()),
        source: 'form',
      };
    } catch (error) {
      try {
        const text = await request.text();
        return parseRawTextPayload(text, requestContentType);
      } catch (textError) {
        console.error('[FastEditor] Failed to read cart request body:', error, textError);
        return { fields: {}, source: 'unknown' };
      }
    }
  }

  function mergeSearchParams(fields, url) {
    if (!(url instanceof URL) || !url.search) {
      return fields;
    }

    const searchFields = collectEntries(url.searchParams.entries());
    return mergeFields(fields, searchFields);
  }

  function resolveCartItemByReference(items, reference) {
    if (!Array.isArray(items) || reference === undefined || reference === null || reference === '') {
      return null;
    }

    const value = String(reference);

    let item = items.find((entry) => entry.key === value);
    if (item) return item;

    item = items.find(
      (entry) => String(entry.variant_id) === value || String(entry.id) === value
    );
    if (item) return item;

    const numericValue = Number.parseInt(value, 10);
    if (!Number.isNaN(numericValue) && String(numericValue) === value) {
      return items[numericValue - 1] || null;
    }

    return null;
  }

  function isSupportedChangePayload(fields) {
    return (fields.line !== undefined || fields.id !== undefined)
      && fields.quantity !== undefined
      && fields.properties === undefined
      && fields.selling_plan === undefined;
  }

  function isSupportedUpdatePayload(fields) {
    return fields.updates !== undefined
      || fields['updates[]'] !== undefined
      || Object.keys(fields).some((key) => key.startsWith('updates['));
  }

  function buildPartialUpdatesFromChange(cart, fields) {
    const item = resolveCartItemByReference(cart.items || [], fields.line ?? fields.id);
    if (!item) {
      return {};
    }

    return {
      [item.key]: toPositiveInteger(fields.quantity, item.quantity),
    };
  }

  function buildPartialUpdatesFromUpdate(cart, fields) {
    const items = Array.isArray(cart.items) ? cart.items : [];
    const updates = {};

    if (isPlainObject(fields.updates)) {
      Object.entries(fields.updates).forEach(([reference, quantity]) => {
        const item = resolveCartItemByReference(items, reference);
        if (!item) return;
        updates[item.key] = toPositiveInteger(quantity, item.quantity);
      });

      if (Object.keys(updates).length > 0) {
        return updates;
      }
    }

    if (Array.isArray(fields.updates)) {
      fields.updates.forEach((quantity, index) => {
        const item = items[index];
        if (!item) return;
        updates[item.key] = toPositiveInteger(quantity, item.quantity);
      });

      if (Object.keys(updates).length > 0) {
        return updates;
      }
    }

    if (fields['updates[]'] !== undefined) {
      asArray(fields['updates[]']).forEach((quantity, index) => {
        const item = items[index];
        if (!item) return;
        updates[item.key] = toPositiveInteger(quantity, item.quantity);
      });

      if (Object.keys(updates).length > 0) {
        return updates;
      }
    }

    const bracketUpdates = getBracketObject(fields, 'updates');
    Object.entries(bracketUpdates).forEach(([reference, quantity]) => {
      const item = resolveCartItemByReference(items, reference);
      if (!item) return;
      updates[item.key] = toPositiveInteger(quantity, item.quantity);
    });

    return updates;
  }

  function extractPartialUpdates(cart, fields, url) {
    if (/\/cart\/change(?:\.js)?$/.test(url.pathname)) {
      if (!isSupportedChangePayload(fields)) {
        return null;
      }

      return buildPartialUpdatesFromChange(cart, fields);
    }

    if (/\/cart\/update(?:\.js)?$/.test(url.pathname)) {
      if (!isSupportedUpdatePayload(fields)) {
        return null;
      }

      return buildPartialUpdatesFromUpdate(cart, fields);
    }

    return null;
  }

  function buildSynchronizedUpdates(cart, partialUpdates) {
    const items = Array.isArray(cart.items) ? cart.items : [];
    const updates = {};
    const extraItemsByProjectKey = new Map();

    items.forEach((item) => {
      updates[item.key] = toPositiveInteger(item.quantity);

      if (!isExtraPricingItem(item)) {
        return;
      }

      const projectKey = getProperty(item, CART_PROPERTIES.PARENT_PROJECT_KEY);
      if (!projectKey) {
        return;
      }

      if (!extraItemsByProjectKey.has(projectKey)) {
        extraItemsByProjectKey.set(projectKey, []);
      }

      extraItemsByProjectKey.get(projectKey).push(item);
    });

    Object.entries(partialUpdates).forEach(([reference, quantity]) => {
      const item = resolveCartItemByReference(items, reference);
      const key = item?.key || reference;
      updates[key] = toPositiveInteger(quantity);
    });

    items.forEach((item) => {
      if (!isMainFastEditorItem(item)) {
        return;
      }

      const projectKey = getProperty(item, CART_PROPERTIES.PROJECT_KEY);
      const relatedExtraItems = extraItemsByProjectKey.get(projectKey) || [];
      const primaryExtraItem = relatedExtraItems[0];

      if (!primaryExtraItem) {
        return;
      }

      const mainQuantity = toPositiveInteger(updates[item.key], item.quantity);
      const extraPages = toPositiveInteger(
        getProperty(item, CART_PROPERTIES.EXTRA_PAGES)
          || getProperty(primaryExtraItem, CART_PROPERTIES.EXTRA_PAGES)
      );
      const desiredExtraQuantity = mainQuantity > 0 ? (mainQuantity * extraPages) : 0;

      updates[primaryExtraItem.key] = desiredExtraQuantity;

      relatedExtraItems.slice(1).forEach((extraItem) => {
        updates[extraItem.key] = 0;
      });

      extraItemsByProjectKey.delete(projectKey);
    });

    extraItemsByProjectKey.forEach((orphanItems) => {
      orphanItems.forEach((item) => {
        updates[item.key] = 0;
      });
    });

    return updates;
  }

  function buildUpdatePayload(cart, partialUpdates, fields) {
    const payload = {
      updates: buildSynchronizedUpdates(cart, partialUpdates),
    };

    const sections = resolveSections(fields);
    if (sections) {
      payload.sections = sections;
      payload.sections_url = resolveSectionsUrl(fields);
    }

    if (fields.note !== undefined) {
      payload.note = fields.note;
    }

    if (fields.attributes !== undefined && isPlainObject(fields.attributes)) {
      payload.attributes = fields.attributes;
    }

    const bracketAttributes = getBracketObject(fields, 'attributes');
    if (Object.keys(bracketAttributes).length > 0) {
      payload.attributes = {
        ...(isPlainObject(payload.attributes) ? payload.attributes : {}),
        ...bracketAttributes,
      };
    }

    return payload;
  }

  function buildForwardHeaders(input, init) {
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    headers.set(INTERNAL_HEADER, '1');
    return headers;
  }

  function buildForwardInit(input, init, payload) {
    const requestInit = {
      method: 'POST',
      headers: buildForwardHeaders(input, init),
      body: JSON.stringify(payload),
      credentials: init?.credentials || (input instanceof Request ? input.credentials : undefined) || 'same-origin',
      signal: init?.signal || (input instanceof Request ? input.signal : undefined),
    };

    const mode = init?.mode || (input instanceof Request ? input.mode : undefined);
    if (mode) {
      requestInit.mode = mode;
    }

    const cache = init?.cache || (input instanceof Request ? input.cache : undefined);
    if (cache) {
      requestInit.cache = cache;
    }

    const redirect = init?.redirect || (input instanceof Request ? input.redirect : undefined);
    if (redirect) {
      requestInit.redirect = redirect;
    }

    const referrer = init?.referrer || (input instanceof Request ? input.referrer : undefined);
    if (referrer) {
      requestInit.referrer = referrer;
    }

    const referrerPolicy = init?.referrerPolicy || (input instanceof Request ? input.referrerPolicy : undefined);
    if (referrerPolicy) {
      requestInit.referrerPolicy = referrerPolicy;
    }

    return requestInit;
  }

  function sendCartUpdate(payload, input, init) {
    return originalFetch(ENDPOINTS.UPDATE, buildForwardInit(input, init, payload));
  }

  async function rewriteCartMutation(input, init, url) {
    const cart = await fetchCart();

    if (!hasManagedItems(cart)) {
      return originalFetch(input, init);
    }

    const payloadData = await readRequestPayload(input, init);
    const fields = mergeSearchParams(payloadData.fields, url);
    const partialUpdates = extractPartialUpdates(cart, fields, url);

    if (!partialUpdates || Object.keys(partialUpdates).length === 0) {
      return originalFetch(input, init);
    }

    const payload = buildUpdatePayload(cart, partialUpdates, fields);
    return sendCartUpdate(payload, input, init);
  }

  window.fetch = async function fastEditorCartSyncFetch(input, init) {
    const url = resolveUrl(input);

    if (
      !url
      || isInternalRequest(input, init)
      || getRequestMethod(input, init) !== 'POST'
      || !isCartMutationUrl(url)
    ) {
      return originalFetch(input, init);
    }

    try {
      return await rewriteCartMutation(input, init, url);
    } catch (error) {
      console.error('[FastEditor] Cart request rewrite failed:', error);
      return originalFetch(input, init);
    }
  };
})();
