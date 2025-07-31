function setButtonState(button, text, disabled = true) {
  if (!button) return;
  button.textContent = text;
  if (disabled) button.setAttribute("disabled", "true");
  else button.removeAttribute("disabled");
}

async function handleFastEditorRedirect(button, originalText) {
  const shop = button.dataset.shop;
  const productHandle = button.dataset.handle;
  const variantId = document.querySelector('input[name="id"]')?.value;
  const quantityInput = document.querySelector('input[name="quantity"]');
  const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

  try {
    setButtonState(button, "Loading...");
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
    setButtonState(button, originalText, false);
  }
}
