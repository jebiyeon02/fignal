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

test("legacy catalog uses product-detail hero images instead of listing thumbnails", () => {
  const productsWithImages = officialOneToFiveHundred.filter((product) => product.image);
  assert.equal(productsWithImages.length, 480);

  for (const product of productsWithImages) {
    assert.match(product.image, /\/large\//, `${product.id} should use a large product image`);
    assert.doesNotMatch(product.image, /\/medium\//);
  }

  for (const product of officialOneToFiveHundred) {
    if (!product.officialUrl) continue;
    assert.match(product.officialUrl, /^https:\/\/www\.goodsmile\.info\/en\/product\//);
    assert.doesNotMatch(product.officialUrl, /\/support\/eng\/fake\/|\.pdf$/i);
  }
});

test("Bloody Regina and Kiriko keep distinct official images and pages", () => {
  const bloodyRegina = catalog.find((product) => product.id === "nendoroid-1672-b");
  const kiriko = catalog.find((product) => product.id === "nendoroid-2225");

  assert.ok(bloodyRegina);
  assert.ok(kiriko);
  assert.notEqual(bloodyRegina.image, kiriko.image);
  assert.notEqual(bloodyRegina.officialUrl, kiriko.officialUrl);
  assert.match(bloodyRegina.image, /\/20220304\/12431\/96172\/large\//);
  assert.match(bloodyRegina.officialUrl, /goodsmile\.info\/en\/product\/12431\/Nendoroid\+Vladilena/);
});

test("runtime catalog has no GSInfo network dependency or fallback image field", () => {
  assert.doesNotMatch(catalogSource, /gsinfoproject/i);
  assert.doesNotMatch(catalogSource, /fallbackImage/);
  assert.doesNotMatch(catalogSource, /catalog-fallback/);
  assert.doesNotMatch(
    catalogSource,
    /officialUrl:\s*["'][^"']*(?:\/support\/eng\/fake\/|english_nenmore_clip-kyuban_taiou\.pdf)/i,
  );
});
