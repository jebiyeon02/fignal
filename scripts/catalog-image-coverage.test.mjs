import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [catalog, officialImagePayload] = await Promise.all([
  readFile(new URL("../app/data/nendoroids-all.generated.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/data/nendoroid-official-images.generated.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("every GSInfo catalog product retains a displayable fallback image", () => {
  assert.ok(catalog.length >= 3201);
  for (const product of catalog) {
    assert.match(product.image, /^https:\/\/gsinfoproject\.com\/api\/images\/thumbnail\/.+\.webp$/);
    assert.match(product.catalogSourceUrl, /^https:\/\/gsinfoproject\.com\/ko\/category\/detail\?/);
  }
});

test("official product records cover the complete known official id set", () => {
  const targets = catalog.filter((product) => product.officialProductId);
  const records = officialImagePayload.records;
  const recordsById = new Map(records.map((record) => [record.id, record]));

  assert.equal(records.length, targets.length);
  for (const product of targets) {
    const record = recordsById.get(product.id);
    assert.ok(record, `${product.id} official image record is missing`);
    assert.equal(record.officialProductId, product.officialProductId);
  }
});

test("cached official images only point to Good Smile product image storage", () => {
  for (const record of officialImagePayload.records) {
    assert.ok(["available", "unavailable"].includes(record.status));
    if (record.status === "available") {
      assert.match(record.image, /^https:\/\/www\.goodsmile\.com\/gsc-webrevo-sdk-storage-prd\/product\/image\//);
    } else {
      assert.equal(record.image, "");
    }
  }
});
