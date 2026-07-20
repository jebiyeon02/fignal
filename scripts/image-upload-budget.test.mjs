import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_UPLOAD_TARGET_BYTES,
  allocateImageByteBudgets,
  totalImageBytes,
} from "../app/image-upload-budget.ts";

test("keeps image sizes unchanged when the request is already safe", () => {
  const sizes = [400_000, 500_000, 600_000, 700_000, 800_000];
  assert.deepEqual(allocateImageByteBudgets(sizes), sizes);
});

test("reduces a five-image request below the client upload target", () => {
  const sizes = Array.from({ length: 5 }, () => 2 * 1024 * 1024);
  const budgets = allocateImageByteBudgets(sizes);

  assert.ok(totalImageBytes(budgets) < CLIENT_UPLOAD_TARGET_BYTES);
  assert.ok(budgets.every((size) => size < 2 * 1024 * 1024));
});

test("preserves small images and assigns the remaining budget to large images", () => {
  const sizes = [120_000, 180_000, 3_000_000, 3_000_000, 3_000_000];
  const budgets = allocateImageByteBudgets(sizes, 6_000_000);

  assert.equal(budgets[0], sizes[0]);
  assert.equal(budgets[1], sizes[1]);
  assert.ok(totalImageBytes(budgets) < 6_000_000);
});
