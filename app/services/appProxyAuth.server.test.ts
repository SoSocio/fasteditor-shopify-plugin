import assert from "node:assert/strict";
import test from "node:test";
import {authenticateAppProxyShop} from "./appProxyAuth.server";

test("uses the shop returned by Shopify's validated App Proxy context", async () => {
  const request = new Request(
    "https://example.com/app/smartlink?shop=attacker.myshopify.com",
  );

  const shop = await authenticateAppProxyShop(request, async () => ({
    session: {shop: "verified.myshopify.com"},
  }));

  assert.equal(shop, "verified.myshopify.com");
});

test("rejects App Proxy requests without an installed-shop session", async () => {
  await assert.rejects(
    authenticateAppProxyShop(
      new Request("https://example.com/app/smartlink"),
      async () => ({}),
    ),
    (error: unknown) => error instanceof Response && error.status === 401,
  );
});

test("propagates signature-validation failures from Shopify", async () => {
  const invalidSignature = new Response("Invalid HMAC", {status: 401});

  await assert.rejects(
    authenticateAppProxyShop(
      new Request("https://example.com/app/smartlink"),
      async () => {
        throw invalidSignature;
      },
    ),
    (error: unknown) => error === invalidSignature,
  );
});
