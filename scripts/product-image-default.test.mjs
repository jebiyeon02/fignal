import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/page.tsx", "utf8");
const reportImage = await readFile("app/reports/[id]/report-product-image.tsx", "utf8");
const defaultImage = await readFile("app/product-image-default.ts", "utf8");

test("공식 이미지가 없으면 한국어 표기가 있는 대체 이미지를 사용한다", async () => {
  assert.match(defaultImage, /DEFAULT_PRODUCT_IMAGE_LABEL = "대체 이미지"/);
  assert.match(page, /\[product\.image, DEFAULT_PRODUCT_IMAGE\]/);
  assert.match(page, /공식 이미지가 없어 표시한 대체 이미지/);
  assert.match(reportImage, /\[\.\.\.sources\.filter\(Boolean\), DEFAULT_PRODUCT_IMAGE\]/);
  assert.match(reportImage, /DEFAULT_PRODUCT_IMAGE_LABEL/);

  const image = await stat("public/images/default-product-image.jpg");
  assert.ok(image.size > 100_000);
});
