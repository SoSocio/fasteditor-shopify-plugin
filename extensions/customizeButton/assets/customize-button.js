window.addEventListener("load", function () {
  const button = document.querySelector(".fasteditor__button");
  if (!button) return;

  const shop = button.dataset.shop;
  const sku = button.dataset.sku;

  const quantityInput = document.querySelector('input[name="quantity"]');
  const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

  button.addEventListener("click", async function () {
    try {
      const response = await fetch("/apps/fasteditor-app/app/smartlink", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          shop: shop,
          sku: sku,
          custom_attributes: ["myattributes"],
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (data.ok && data.body?.url) {
        window.location.href = data.body.url;
      } else {
        console.error("SmartLink error:", data);
      }
    } catch (error) {
      console.error("SmartLink request failed:", error);
    }
  });
});
