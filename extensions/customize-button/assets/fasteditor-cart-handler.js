document.addEventListener("DOMContentLoaded", async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fasteditorCartUrl = urlParams.get("fe_cart_url");

    if (!fasteditorCartUrl) throw new Error("Missing fe_cart_url parameter");

    const url = new URL("/apps/embedded/app/fasteditor/product", window.location.origin);
    url.searchParams.set("url", fasteditorCartUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to resolve product.");
    }

    const responseData = await response.json();

    const {variantId, quantity, projectKey, imageUrl} = responseData.data || {};

    if (!variantId || !quantity || !projectKey || !imageUrl) throw new Error("Invalid product data from server");

    const formData = {
      items: [{
        id: variantId,
        quantity,
        properties: {
          _fasteditor_project_key: projectKey,
          _fasteditor_image_url: imageUrl,
        },
      }],
    };

    const addResponse = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(formData),
    });

    if (!addResponse.ok) {
      const error = await addResponse.text();
      throw new Error("Failed to add item to cart: " + error);
    }

    window.location.href = "/cart";

  } catch (error) {
    console.error("[FastEditor cart init error]", error);
  }
});
