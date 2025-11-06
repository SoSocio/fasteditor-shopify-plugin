function setButtonState(button, text, disabled = true) {
  if (!button) return;
  const textElement = button.querySelector('.fasteditor__button-text');
  if (textElement) {
    textElement.textContent = text;
  } else {
    button.textContent = text;
  }
  if (disabled) button.setAttribute("disabled", "true");
  else button.removeAttribute("disabled");
}

function setButtonLoadingIcon(button, isLoading) {
  if (!button) return;
  const iconElement = button.querySelector('.fasteditor__button-icon');
  if (!iconElement) return;

  const mainIcon = iconElement.querySelector('.fasteditor__button-icon-main');
  const loadingIcon = iconElement.querySelector('.fasteditor__button-icon-loading');

  if (isLoading) {
    // Показуємо loading іконку і приховуємо основну
    if (mainIcon) mainIcon.style.display = 'none';
    if (loadingIcon) loadingIcon.style.display = 'block';
    button.classList.add('fasteditor__button--loading');
  } else {
    // Показуємо основну іконку і приховуємо loading
    if (mainIcon) mainIcon.style.display = 'block';
    if (loadingIcon) loadingIcon.style.display = 'none';
    button.classList.remove('fasteditor__button--loading');
  }
}

async function handleFastEditorRedirect(button, originalText) {
  const shop = button.dataset.shop;
  const productHandle = button.dataset.handle;
  const variantId = document.querySelector('input[name="id"]')?.value;
  const quantityInput = document.querySelector('input[name="quantity"]');
  const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
  const loadingText = button.dataset.loadingText || "Loading...";

  try {
    setButtonState(button, loadingText);
    setButtonLoadingIcon(button, true);
    const response = await fetch("/apps/embedded/app/smartlink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({shop, variantId, quantity, productHandle}),
    });

    const responseData = await response.json();
    if (!response.ok || !responseData.data?.url) {
      throw new Error("Unexpected response from server");
    }

    window.location.href = responseData.data.url;
  } catch (error) {
    console.error("[FastEditor] Redirect error:", error);
  } finally {
    setButtonLoadingIcon(button, false);
    setButtonState(button, originalText, false);
  }
}
