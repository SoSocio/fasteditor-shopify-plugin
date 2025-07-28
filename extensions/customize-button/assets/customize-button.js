function setButtonState(button, text, disabled = true) {
  if (!button) return;
  button.textContent = text;
  if (disabled) button.setAttribute("disabled", "true");
  else button.removeAttribute("disabled");
}

async function handleFastEditorRedirect(button, originalText) {
  const shop = button.dataset.shop;
  const productHandle = button.dataset.handle;
  const variantId = document.querySelector('[name="id"]')?.value;
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
      throw new Error("Invalid response from server");
    }

    window.location.href = responseData.data.url;

    setButtonState(button, originalText, false);
  } catch (error) {
    console.error("FastEditor redirect error:", error);
    setButtonState(button, "Error");
  }
}

window.addEventListener("load", () => {
  const button = document.querySelector(".fasteditor__button");
  if (!button) return;

  const originalText = button.innerText;

  button.addEventListener("click", () => {
    handleFastEditorRedirect(button, originalText);
  });
});
