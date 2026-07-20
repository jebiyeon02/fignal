import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [catalog, catalogSource] = await Promise.all([
  readFile(new URL("../app/data/nendoroids-1-500.generated.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/catalog.ts", import.meta.url), "utf8"),
]);

test("generated catalog images use only Good Smile hosts or stay empty", () => {
  assert.equal(catalog.length, 535);
  for (const product of catalog) {
    if (!product.image) continue;
    const hostname = new URL(product.image).hostname;
    assert.ok(hostname === "www.goodsmile.com" || hostname === "images.goodsmile.info" || hostname.endsWith(".goodsmile.info"));
  }
});

test("runtime catalog has no GSInfo dependency or fallback image field", () => {
  assert.doesNotMatch(catalogSource, /gsinfoproject/i);
  assert.doesNotMatch(catalogSource, /fallbackImage/);
  assert.doesNotMatch(catalogSource, /catalog-fallback/);
});
