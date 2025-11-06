function setButtonState(button, text, disabled = true) {
  if (!button) return;
  button.textContent = text;
  if (disabled) button.setAttribute("disabled", "true");
  else button.removeAttribute("disabled");
}

async function addItemToCart(variantId, quantity, projectKey, imageUrl) {
  const formData = {
    items: [{
      id: variantId,
      quantity,
      properties: {
        _fasteditor_project_key: projectKey,
        _fasteditor_image_url: imageUrl,
        "Customized": "Yes",
      },
    }],
  };

  const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error("Failed to add item to cart: " + error);
  }
}

async function handleFastEditorAutoAddToCart(button) {
  const urlParams = new URLSearchParams(window.location.search);
  const fasteditorCartUrl = urlParams.get("fe_cart_url");
  const textElement = button.querySelector('.fasteditor__button-text');
  const originalText = textElement ? textElement.textContent : button.innerText;
  const enableCartRedirect = button.dataset.redirect === "true";
  const addingToCartText = button.dataset.addingToCartText || "Adding to cart...";
  const addedToCartText = button.dataset.addedToCartText || "Added to cart";
  const errorText = button.dataset.errorText || "Error";

  if (!fasteditorCartUrl) return;

  console.log("enableCartRedirect", enableCartRedirect);

  try {
    setButtonState(button, addingToCartText);
    setButtonLoadingIcon(button, true);

    const url = new URL("/apps/embedded/app/fasteditor/product", window.location.origin);
    url.searchParams.set("url", fasteditorCartUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
    });

    const {data} = await response.json();

    if (!response.ok || !data?.variantId || !data?.quantity || !data?.projectKey || !data?.imageUrl) {
      throw new Error("Invalid product data from server");
    }

    await addItemToCart(data.variantId, data.quantity, data.projectKey, data.imageUrl);

    setButtonLoadingIcon(button, false);
    setButtonState(button, addedToCartText);

    urlParams.delete("fe_cart_url");
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, "", newUrl);

    setTimeout(() => {
      setButtonState(button, originalText, false);
    }, 3000);

    if (enableCartRedirect) {
      console.log("enableCartRedirect yes", enableCartRedirect);
      window.location.href = "/cart";
    } else {
      console.log("enableCartRedirect no", enableCartRedirect);
      location.reload();
    }

  } catch (error) {
    console.error("[FastEditor cart init error]", error);
    setButtonLoadingIcon(button, false);
    setButtonState(button, errorText);
  }
}
