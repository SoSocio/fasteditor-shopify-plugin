import assert from "node:assert/strict";
import test from "node:test";
import {resolveCurrentSubscription, shouldTrackWebhookSubscription} from "./subscriptionState";

const PLAN = "Monthly subscription";

const active = {id: "gid://shopify/AppSubscription/1", name: PLAN, status: "ACTIVE", createdAt: "2026-10-21T08:00:00Z"};
const expired = {id: "gid://shopify/AppSubscription/2", name: PLAN, status: "EXPIRED", createdAt: "2026-10-21T08:05:00Z"};

test("keeps the stored subscription while it is active", () => {
  assert.equal(resolveCurrentSubscription([active, expired], active.id, PLAN), active);
});

test("falls back to the active subscription when the stored one expired", () => {
  assert.equal(resolveCurrentSubscription([active, expired], expired.id, PLAN), active);
});

test("picks the newest active subscription for the plan", () => {
  const newer = {...active, id: "gid://shopify/AppSubscription/3", createdAt: "2026-10-25T08:00:00Z"};
  const otherPlan = {...active, id: "gid://shopify/AppSubscription/4", name: "Other", createdAt: "2026-10-30T08:00:00Z"};
  assert.equal(resolveCurrentSubscription([active, newer, otherPlan], null, PLAN), newer);
});

test("returns the stored subscription when nothing is active", () => {
  assert.equal(resolveCurrentSubscription([expired], expired.id, PLAN), expired);
});

test("ignores webhooks about other non-active subscriptions", () => {
  assert.equal(shouldTrackWebhookSubscription(expired.id, "EXPIRED", active.id), false);
  assert.equal(shouldTrackWebhookSubscription(expired.id, "DECLINED", active.id), false);
});

test("tracks webhooks about the stored or a newly active subscription", () => {
  assert.equal(shouldTrackWebhookSubscription(active.id, "CANCELLED", active.id), true);
  assert.equal(shouldTrackWebhookSubscription(expired.id, "ACTIVE", active.id), true);
  assert.equal(shouldTrackWebhookSubscription(expired.id, "PENDING", null), true);
});
