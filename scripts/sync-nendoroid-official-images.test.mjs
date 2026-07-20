import assert from "node:assert/strict";
import test from "node:test";
import { extractOfficialProductImage } from "./sync-nendoroid-official-images.mjs";

test("extracts the matching Good Smile product image instead of a related product", () => {
  const html = `
    <script>{"image":"\\/gsc-webrevo-sdk-storage-prd\\/product\\/image\\/1140602\\/primary.jpg"}</script>
    <img src="/gsc-webrevo-sdk-storage-prd/product/image/999/related.jpg">
  `;

  assert.equal(
    extractOfficialProductImage(html, "1140602"),
    "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1140602/primary.jpg",
  );
});

test("uses the official Open Graph image when the product image path is absent", () => {
  const html = '<meta property="og:image" content="https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/42/social.jpg">';

  assert.equal(
    extractOfficialProductImage(html, "42"),
    "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/42/social.jpg",
  );
});

test("extracts migrated legacy product image paths", () => {
  const html = '<script>{"image":"/gsc-webrevo-sdk-storage-prd/product/image/product/2009/390/large/legacy.jpg"}</script>';

  assert.equal(
    extractOfficialProductImage(html, "126"),
    "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/2009/390/large/legacy.jpg",
  );
});

test("rejects images hosted outside the official domain", () => {
  const html = '<meta property="og:image" content="https://example.com/copied.jpg">';
  assert.equal(extractOfficialProductImage(html, "42"), "");
});
