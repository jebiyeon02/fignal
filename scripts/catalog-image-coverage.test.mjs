import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [officialOneToFiveHundred, catalog, catalogSource] = await Promise.all([
  readFile(new URL("../app/data/nendoroids-1-500.generated.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/data/nendoroids-catalog.generated.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/catalog.ts", import.meta.url), "utf8"),
]);

test("full catalog keeps its product coverage without GSInfo image URLs", () => {
  assert.equal(officialOneToFiveHundred.length, 535);
  assert.equal(catalog.length, 3201);
  assert.doesNotMatch(JSON.stringify(catalog), /gsinfoproject/i);
  for (const product of [...officialOneToFiveHundred, ...catalog]) {
    if (!product.image) continue;
    const hostname = new URL(product.image).hostname;
    assert.ok(hostname === "www.goodsmile.com" || hostname === "images.goodsmile.info" || hostname.endsWith(".goodsmile.info"));
  }
});

test("runtime catalog has no GSInfo network dependency or fallback image field", () => {
  assert.doesNotMatch(catalogSource, /gsinfoproject/i);
  assert.doesNotMatch(catalogSource, /fallbackImage/);
  assert.doesNotMatch(catalogSource, /catalog-fallback/);
});
