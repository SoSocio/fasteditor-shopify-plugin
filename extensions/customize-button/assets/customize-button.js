window.addEventListener("load", function () {
  const button = document.querySelector(".fasteditor__button");
  if (!button) return;

  const shop = button.dataset.shop;
  const productHandle = button.dataset.handle;

  button.addEventListener("click", async function () {
    const variantId = document.querySelector('[name="id"]')?.value;
    const quantityInput = document.querySelector('input[name="quantity"]');
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    try {
      const response = await fetch("/apps/embedded/app/smartlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({shop, variantId, quantity, productHandle}),
      });

      const responseData = await response.json();

      if (response.ok && responseData.data?.url) {
        window.location.href = responseData.data.url;
      } else {
        console.error("FastEditor error response:", responseData);
      }
    } catch (error) {
      console.error("FastEditor request failed:", error);
    }
  });
});
