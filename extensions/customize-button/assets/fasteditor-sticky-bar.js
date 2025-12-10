/**
 * FastEditor Sticky Bar Web Component
 * A web component for displaying a sticky product bar with customization and add to cart functionality
 */

(function() {
  'use strict';

  const SELECTORS = {
    PRICE: '[data-fasteditor-price]',
    COMPARE_PRICE: '[data-fasteditor-compare-price]',
    VARIANT: '[data-fasteditor-variant]',
    IMAGE: '[data-fasteditor-image]',
    CUSTOMIZE: '[data-fasteditor-customize]',
    ADD: '[data-fasteditor-add]'
  };

  const ENDPOINTS = {
    SMARTLINK: '/apps/embedded/app/smartlink',
    CART_ADD: 'cart/add.js'
  };

  const TIMEOUTS = {
    ADD_RESTORE: 3000
  };

  const TEXT_DEFAULTS = {
    customizeLoading: 'Loading...',
    add: 'Add to cart',
    adding: 'Adding to cart...',
    added: 'Added to cart',
    error: 'Something went wrong',
    soldOut: 'Sold out'
  };

  class FastEditorStickyBar extends HTMLElement {
    constructor() {
      super();
      this.state = {
        variantId: null
      };
      this.variants = [];
      this.product = null;
      this.form = null;
      this.texts = {};
      this.formats = {};
      
      // Cleanup functions - initialize early
      this.cleanupFunctions = [];
      
      // Bind methods to preserve context (only methods defined at class level)
      this.updateVariant = this.updateVariant.bind(this);
      this.handleVariantChange = this.handleVariantChange.bind(this);
      this.handleFormChange = this.handleFormChange.bind(this);
      this.handleAddToCart = this.handleAddToCart.bind(this);
    }

    static get observedAttributes() {
      return [
        'data-variants',
        'data-initial-variant-id',
        'data-mobile-position',
        'data-desktop-position',
        'data-state'
      ];
    }

    connectedCallback() {
      // Use requestAnimationFrame to ensure DOM is ready
      if (this.hasAttribute('data-initialized')) return;
      
      // Wait for next frame to ensure all attributes are set
      const init = () => {
        if (!this.hasAttribute('data-initialized') && this.isConnected) {
          this.initialize();
        }
      };

      // Use microtask to ensure attributes are processed
      Promise.resolve().then(() => {
        requestAnimationFrame(init);
      });
    }

    disconnectedCallback() {
      this.cleanup();
      this.removeAttribute('data-initialized');
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue) return;
      
      if (name === 'data-variants') {
        this.variants = this.parseVariants(newValue);
        if (this.state.variantId) {
          this.updateVariant(this.state.variantId);
        }
      } else if (name === 'data-initial-variant-id' && newValue) {
        this.state.variantId = String(newValue);
        this.updateVariant(this.state.variantId);
      } else if (name === 'data-mobile-position' || name === 'data-desktop-position') {
        this.setupPositionTracking();
      }
    }

    initialize() {
      if (this.hasAttribute('data-initialized')) return;
      
      try {
        this.parseDataAttributes();
        if (!this.variants.length) {
          console.warn('[FastEditor] Sticky bar: No variants found');
          return;
        }

        this.gatherContext();
        this.setupPositionTracking();
        this.setupVisibility();
        this.wireActions();
        this.setupVariantListeners();
        
        if (this.state.variantId) {
          this.updateVariant(this.state.variantId);
        } else {
          const initialId = this.resolveVariantId(this.form, '');
          if (initialId) {
            this.updateVariant(initialId);
          }
        }

        this.setAttribute('data-initialized', 'true');
      } catch (error) {
        console.error('[FastEditor] Sticky bar initialization error:', error);
      }
    }

    parseDataAttributes() {
      this.variants = this.parseVariants(this.dataset.variants);
      this.state.variantId = this.dataset.initialVariantId || '';
      
      this.product = {
        title: this.dataset.productTitle || '',
        featuredImage: this.parseProductImage(this.dataset.productImage),
        initialImageSrc: '',
        initialImageAlt: ''
      };

      this.formats = {
        default: this.dataset.moneyFormat || '',
        withCurrency: this.dataset.moneyWithCurrencyFormat || ''
      };
    }

    gatherContext() {
      const imageNode = this.querySelector(SELECTORS.IMAGE);
      if (imageNode) {
        this.product.initialImageSrc = imageNode.getAttribute('src') || '';
        this.product.initialImageAlt = imageNode.getAttribute('alt') || '';
      }

      this.form = this.findProductForm(this.dataset.sectionId);
      if (!this.state.variantId && this.form) {
        this.state.variantId = this.resolveVariantId(this.form, '');
      }

      const customizeButton = this.querySelector(SELECTORS.CUSTOMIZE);
      const addButton = this.querySelector(SELECTORS.ADD);
      this.texts = this.buildTexts(addButton, customizeButton);
    }

    setupVariantListeners() {
      if (!this.form) return;

      // Ensure cleanupFunctions is initialized
      if (!this.cleanupFunctions) {
        this.cleanupFunctions = [];
      }

      // Listen to form changes
      const inputs = this.form.querySelectorAll('input[name="id"], select[name="id"]');
      const formChangeHandlers = [];
      inputs.forEach((input) => {
        input.addEventListener('change', this.handleFormChange);
        formChangeHandlers.push({ input, handler: this.handleFormChange });
      });

      this.cleanupFunctions.push(() => {
        formChangeHandlers.forEach(({ input, handler }) => {
          input.removeEventListener('change', handler);
        });
      });

      // Listen to global variant change events
      const variantChangeHandler = (event) => {
        const detail = event.detail || {};
        const sectionId = this.dataset.sectionId;
        if (sectionId && detail.sectionId && detail.sectionId !== sectionId) return;
        this.handleVariantChange(detail.variant?.id || detail.id);
      };

      document.addEventListener('variant:change', variantChangeHandler);
      this.cleanupFunctions.push(() => {
        document.removeEventListener('variant:change', variantChangeHandler);
      });
    }

    handleFormChange() {
      const variantId = this.resolveVariantId(this.form, this.state.variantId);
      if (variantId) {
        this.updateVariant(variantId);
      }
    }

    handleVariantChange(variantId) {
      if (variantId) {
        this.updateVariant(variantId);
      } else {
        const resolvedId = this.resolveVariantId(this.form, this.state.variantId);
        if (resolvedId) {
          this.updateVariant(resolvedId);
        }
      }
    }

    updateVariant(variantId) {
      if (variantId) {
        this.state.variantId = String(variantId);
      }

      if (!this.state.variantId) {
        this.state.variantId = this.resolveVariantId(this.form, '');
      }

      let variant = this.findVariant(this.variants, this.state.variantId);
      if (!variant && this.variants.length) {
        variant = this.variants[0];
        this.state.variantId = String(variant.id);
      }

      if (!variant) return;

      this.updatePrice(variant);
      this.updateComparePrice(variant);
      this.updateVariantMeta(variant);
      this.syncAvailability(variant);
    }

    updatePrice(variant) {
      const priceNode = this.querySelector(SELECTORS.PRICE);
      if (!priceNode || !variant) return;
      const format = this.formats.withCurrency || this.formats.default;
      priceNode.textContent = this.formatMoney(Number(variant.price), format);
    }

    updateComparePrice(variant) {
      const compareNode = this.querySelector(SELECTORS.COMPARE_PRICE);
      if (!compareNode || !variant) return;
      const comparePrice = Number(variant.compare_at_price);
      if (!comparePrice || comparePrice <= Number(variant.price)) {
        compareNode.textContent = '';
        compareNode.style.display = 'none';
        return;
      }
      const format = this.formats.withCurrency || this.formats.default;
      compareNode.textContent = this.formatMoney(comparePrice, format);
      compareNode.style.display = '';
    }

    updateVariantMeta(variant) {
      const variantNode = this.querySelector(SELECTORS.VARIANT);
      const imageNode = this.querySelector(SELECTORS.IMAGE);

      if (variantNode) {
        const variantTitle = variant?.title && variant.title !== 'Default Title'
          ? variant.title
          : '';
        if (variantTitle) {
          variantNode.textContent = variantTitle;
          variantNode.style.display = '';
        } else {
          variantNode.textContent = '';
          variantNode.style.display = 'none';
        }
      }

      if (imageNode) {
        const mediaContainer = imageNode.closest('.fasteditor-sticky-bar__media');
        
        // Try to get variant image - handle different possible structures
        let variantImageSrc = null;
        let variantImageAlt = null;
        
        if (variant?.featured_image) {
          // featured_image can be a string URL, an object with src, or an object with url
          if (typeof variant.featured_image === 'string') {
            variantImageSrc = variant.featured_image;
          } else if (variant.featured_image.src) {
            variantImageSrc = variant.featured_image.src;
            variantImageAlt = variant.featured_image.alt;
          } else if (variant.featured_image.url) {
            variantImageSrc = variant.featured_image.url;
            variantImageAlt = variant.featured_image.alt;
          }
        }
        
        // Fallback chain: variant image -> product image -> initial image
        const fallback = this.product?.initialImageSrc
          ? { src: this.product.initialImageSrc, alt: this.product.initialImageAlt || this.product?.title }
          : null;
        
        let candidate = null;
        if (variantImageSrc) {
          candidate = { src: variantImageSrc, alt: variantImageAlt || this.product?.title || '' };
        } else if (this.product?.featuredImage) {
          // Handle product featuredImage structure
          if (typeof this.product.featuredImage === 'string') {
            candidate = { src: this.product.featuredImage, alt: this.product?.title || '' };
          } else if (this.product.featuredImage.src) {
            candidate = { src: this.product.featuredImage.src, alt: this.product.featuredImage.alt || this.product?.title || '' };
          } else if (this.product.featuredImage.url) {
            candidate = { src: this.product.featuredImage.url, alt: this.product.featuredImage.alt || this.product?.title || '' };
          }
        } else if (fallback) {
          candidate = fallback;
        }
        
        if (candidate?.src) {
          imageNode.src = candidate.src;
          imageNode.alt = candidate.alt || this.product?.title || '';
          imageNode.style.display = '';
          if (mediaContainer) mediaContainer.style.display = '';
        } else {
          imageNode.src = '';
          imageNode.style.display = 'none';
          if (mediaContainer) mediaContainer.style.display = 'none';
        }
      }
    }

    syncAvailability(variant) {
      const addButton = this.querySelector(SELECTORS.ADD);
      if (!addButton) return;
      if (!variant || !variant.available) {
        this.setButtonState(addButton, this.texts.soldOut, true);
        return;
      }
      this.setButtonState(addButton, this.texts.add, false);
    }

    wireActions() {
      // Ensure cleanupFunctions is initialized
      if (!this.cleanupFunctions) {
        this.cleanupFunctions = [];
      }

      const addButton = this.querySelector(SELECTORS.ADD);
      if (addButton) {
        addButton.addEventListener('click', this.handleAddToCart);
        this.cleanupFunctions.push(() => {
          addButton.removeEventListener('click', this.handleAddToCart);
        });
      }
    }

    async handleAddToCart(event) {
      const button = event.target.closest(SELECTORS.ADD) || event.target;
      if (button.hasAttribute('disabled')) return;

      const variantId = this.getVariantId();
      if (!variantId) return;

      const quantity = this.getQuantity();
      this.setButtonState(button, this.texts.adding, true);

      try {
        await this.submitAddToCart(variantId, quantity);
        this.setButtonState(button, this.texts.added, true);
        setTimeout(() => {
          this.setButtonState(button, this.texts.add, false);
        }, TIMEOUTS.ADD_RESTORE);
      } catch (error) {
        console.error('[FastEditor] Add to cart failed', error);
        this.setButtonState(button, this.texts.error, true);
        setTimeout(() => {
          this.setButtonState(button, this.texts.add, false);
        }, TIMEOUTS.ADD_RESTORE);
      }
    }

    getVariantId() {
      return this.state.variantId;
    }

    getQuantity() {
      return this.resolveQuantity(this.form);
    }

    setupPositionTracking() {
      const mediaQuery = window.matchMedia('(min-width: 750px)');
      const resolvePosition = () => (
        mediaQuery.matches
          ? this.dataset.desktopPosition || 'bottom'
          : this.dataset.mobilePosition || 'bottom'
      );

      const offsetUpdater = this.bindOffsetUpdater();

      const applyPosition = () => {
        const position = resolvePosition();
        this.setAttribute('data-position-state', position);
        if (offsetUpdater) offsetUpdater();
      };

      applyPosition();

      const listener = typeof mediaQuery.addEventListener === 'function'
        ? mediaQuery.addEventListener.bind(mediaQuery)
        : mediaQuery.addListener.bind(mediaQuery);

      listener('change', applyPosition);
    }

    bindOffsetUpdater() {
      if (this.__fasteditorOffsetUpdater) return this.__fasteditorOffsetUpdater;

      // Ensure cleanupFunctions is initialized
      if (!this.cleanupFunctions) {
        this.cleanupFunctions = [];
      }

      let rafId = null;
      const updateOffset = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          if (this.getAttribute('data-position-state') !== 'top') {
            this.style.removeProperty('--fasteditor-top-offset');
            rafId = null;
            return;
          }
          const header = this.findHeaderElement();
          if (header) {
            const rect = header.getBoundingClientRect();
            const offset = Math.ceil(rect.bottom);
            this.style.setProperty('--fasteditor-top-offset', `${offset}px`);
          } else {
            this.style.setProperty('--fasteditor-top-offset', '0px');
          }
          rafId = null;
        });
      };

      const resizeHandler = () => updateOffset();
      const scrollHandler = () => updateOffset();

      window.addEventListener('resize', resizeHandler);
      window.addEventListener('scroll', scrollHandler, { passive: true });

      this.cleanupFunctions.push(() => {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('scroll', scrollHandler);
      });

      if (typeof ResizeObserver !== 'undefined') {
        const header = this.findHeaderElement();
        if (header) {
          const observer = new ResizeObserver(updateOffset);
          observer.observe(header);
          this.__fasteditorOffsetObserver = observer;
          this.cleanupFunctions.push(() => {
            observer.disconnect();
          });
        }
      }

      this.__fasteditorOffsetUpdater = updateOffset;
      return updateOffset;
    }

    setupVisibility() {
      // Ensure cleanupFunctions is initialized
      if (!this.cleanupFunctions) {
        this.cleanupFunctions = [];
      }

      const header = this.findHeaderElement();
      const mediaQuery = window.matchMedia('(min-width: 750px)');
      const shouldHideForViewport = () => {
        const isDesktop = mediaQuery.matches;
        return isDesktop
          ? this.dataset.desktopPosition === 'hide'
          : this.dataset.mobilePosition === 'hide';
      };
      
      this.setAttribute('data-state', 'hidden');

      if (!header) {
        return;
      }

      const toggle = (shouldShow) => {
        if (shouldHideForViewport()) {
          this.setAttribute('data-state', 'hidden');
          return;
        }
        this.setAttribute('data-state', shouldShow ? 'visible' : 'hidden');
      };

      let scrollThreshold = null;

      const calculateThreshold = () => {
        const rect = header.getBoundingClientRect();
        const headerBottom = rect.bottom;
        scrollThreshold = window.scrollY + headerBottom;
      };

      const checkScrollPosition = () => {
        if (scrollThreshold === null) {
          calculateThreshold();
        }
        
        const currentScrollY = window.scrollY;
        const shouldShow = currentScrollY > scrollThreshold;
        toggle(shouldShow);
      };

      const handleResize = () => {
        calculateThreshold();
        checkScrollPosition();
      };

      calculateThreshold();
      checkScrollPosition();

      window.addEventListener('scroll', checkScrollPosition, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

      this.cleanupFunctions.push(() => {
        window.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', handleResize);
      });
    }

    // Utility methods

    parseVariants(raw) {
      if (window.FastEditorUtils && window.FastEditorUtils.parseJSON) {
        return window.FastEditorUtils.parseJSON(raw, []);
      }
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error('[FastEditor] Failed to parse variants', error);
        return [];
      }
    }

    parseProductImage(raw) {
      if (window.FastEditorUtils && window.FastEditorUtils.parseJSON) {
        return window.FastEditorUtils.parseJSON(raw, null);
      }
      if (!raw || raw === 'null') return null;
      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error('[FastEditor] Failed to parse product image', error);
        return null;
      }
    }

    findVariant(variants, id) {
      if (!id) return undefined;
      return variants.find((variant) => String(variant.id) === String(id));
    }

    formatMoney(cents, format) {
      if (window.FastEditorUtils && window.FastEditorUtils.formatMoney) {
        return window.FastEditorUtils.formatMoney(cents, format);
      }
      if (typeof cents !== 'number') return '';
      if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
        return window.Shopify.formatMoney(cents, format);
      }
      return (cents / 100).toFixed(2);
    }

    resolveVariantId(form, fallbackId) {
      if (!form) return fallbackId || '';
      const select = form.querySelector('select[name="id"]');
      if (select && select.value) return select.value;
      const checked = form.querySelector('input[name="id"]:checked');
      if (checked && checked.value) return checked.value;
      const input = form.querySelector('input[name="id"]');
      if (input && input.value) return input.value;
      return fallbackId || '';
    }

    resolveQuantity(form) {
      if (!form) return 1;
      const input = form.querySelector('input[name="quantity"]');
      const value = input ? parseInt(input.value, 10) : 1;
      return Number.isNaN(value) ? 1 : value;
    }

    findProductForm(sectionId) {
      const section = sectionId ? document.getElementById(`shopify-section-${sectionId}`) : null;
      if (section) {
        const addForm = section.querySelector('form[action^="/cart/add"]');
        if (addForm) return addForm;
        const cartForm = section.querySelector('form[action^="/cart"]');
        if (cartForm) return cartForm;
      }
      return document.querySelector('form[action^="/cart/add"]') || document.querySelector('form[action^="/cart"]');
    }

    findHeaderElement() {
      const selectors = [
        'header[role="banner"]',
        '[data-header]',
        '.shopify-section-header',
        '.shopify-section--header',
        'header'
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    }

    setButtonState(button, text, disabled) {
      if (window.FastEditorUtils && window.FastEditorUtils.setButtonState) {
        window.FastEditorUtils.setButtonState(button, text, disabled);
        return;
      }
      if (!button) return;
      button.textContent = text;
      if (disabled) {
        button.setAttribute('disabled', 'true');
        return;
      }
      button.removeAttribute('disabled');
    }

    async submitAddToCart(variantId, quantity) {
      if (window.FastEditorUtils && window.FastEditorUtils.addItemToCart) {
        return window.FastEditorUtils.addItemToCart(variantId, quantity);
      }
      const root = window.Shopify?.routes?.root || '/';
      const response = await fetch(`${root}${ENDPOINTS.CART_ADD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity }] })
      });
      if (response.ok) return response;
      const message = await response.text();
      throw new Error(message || 'Failed to add to cart');
    }

    buildTexts(addButton, customizeButton) {
      return {
        customizeLoading: customizeButton?.dataset.loadingText || TEXT_DEFAULTS.customizeLoading,
        add: addButton?.dataset.addText || TEXT_DEFAULTS.add,
        adding: addButton?.dataset.addingText || TEXT_DEFAULTS.adding,
        added: addButton?.dataset.addedText || TEXT_DEFAULTS.added,
        error: addButton?.dataset.errorText || TEXT_DEFAULTS.error,
        soldOut: addButton?.dataset.soldOutText || TEXT_DEFAULTS.soldOut
      };
    }

    cleanup() {
      if (this.cleanupFunctions && Array.isArray(this.cleanupFunctions)) {
        this.cleanupFunctions.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            console.error('[FastEditor] Cleanup error', error);
          }
        });
        this.cleanupFunctions = [];
      }

      if (this.__fasteditorOffsetObserver) {
        this.__fasteditorOffsetObserver.disconnect();
        this.__fasteditorOffsetObserver = null;
      }
    }
  }

  // Register the custom element
  if (typeof customElements !== 'undefined') {
    if (!customElements.get('fasteditor-sticky-bar')) {
      customElements.define('fasteditor-sticky-bar', FastEditorStickyBar);
    }

    // Initialize any existing instances if DOM is already loaded
    const initializeExistingInstances = () => {
      const existingBars = document.querySelectorAll('fasteditor-sticky-bar:not([data-initialized])');
      existingBars.forEach((bar) => {
        if (bar instanceof FastEditorStickyBar) {
          // Force initialization by calling connectedCallback logic
          if (!bar.hasAttribute('data-initialized')) {
            const init = () => {
              if (!bar.hasAttribute('data-initialized') && bar.isConnected) {
                bar.initialize();
              }
            };
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', init);
            } else {
              Promise.resolve().then(() => {
                requestAnimationFrame(init);
              });
            }
          }
        }
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeExistingInstances);
    } else {
      // Use setTimeout to ensure DOM is fully ready
      setTimeout(initializeExistingInstances, 0);
    }
  }
})();