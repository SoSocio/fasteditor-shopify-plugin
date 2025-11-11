/**
 * FastEditor Customize Button Utilities
 * Shared utility functions for customize button state management
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
   * Updates button text and disabled state
   * @param {HTMLElement} button - The button element
   * @param {string} text - Text to display
   * @param {boolean} disabled - Whether button should be disabled
   */
  function setButtonState(button, text, disabled = true) {
    if (!button) return;

    const textElement = button.querySelector(SELECTORS.BUTTON_TEXT);
    if (textElement) {
      textElement.textContent = text;
    } else {
      button.textContent = text;
    }

    if (disabled) {
      button.setAttribute('disabled', 'true');
    } else {
      button.removeAttribute('disabled');
    }
  }

  /**
   * Toggles loading icon state on button
   * Stores and restores original icon display state
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
      // Show icon container and loading icon, hide main icon
      iconElement.style.display = DISPLAY.FLEX;
      if (mainIcon) mainIcon.style.display = DISPLAY.NONE;
      if (loadingIcon) {
        loadingIcon.style.display = DISPLAY.FLEX;
      }
      button.classList.add(CLASSES.LOADING);
    } else {
      // Restore original state: show main icon if exists, hide loading icon
      if (mainIcon) {
        mainIcon.style.display = DISPLAY.FLEX;
      }
      if (loadingIcon) {
        loadingIcon.style.display = DISPLAY.NONE;
      }
      // Restore original display state of icon container
      iconElement.style.display = iconElement.dataset.originalDisplay;
      button.classList.remove(CLASSES.LOADING);
    }
  }

  // Expose functions globally for use in other scripts
  window.FastEditorCustomizeButtonUtils = {
    setButtonState,
    setButtonLoadingIcon,
  };
})();

