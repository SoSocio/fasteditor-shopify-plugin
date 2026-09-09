import assert from "node:assert/strict";
import test from "node:test";
import {parseAndValidateRequest} from "./smartlinkValidation.server";

test("ignores the shop supplied in a storefront SmartLink payload", async () => {
  const request = new Request("https://example.com/app/smartlink", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      shop: "attacker.myshopify.com",
      variantId: "123",
      productHandle: "custom-product",
      quantity: 2,
      userId: "visitor-1",
    }),
  });

  const payload = await parseAndValidateRequest(request);

  assert.deepEqual(payload, {
    variantId: "123",
    productHandle: "custom-product",
    quantity: 2,
    userId: "visitor-1",
  });
  assert.equal("shop" in payload, false);
});

test("rejects a SmartLink payload without a product variant", async () => {
  const request = new Request("https://example.com/app/smartlink", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({productHandle: "custom-product", quantity: 1}),
  });

  await assert.rejects(
    parseAndValidateRequest(request),
    (error: unknown) => (
      error instanceof Response
      && error.status === 400
    ),
  );
});
