import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [report, community, lightbox, styles] = await Promise.all([
  readFile("app/reports/[id]/page.tsx", "utf8"),
  readFile("app/community/[id]/page.tsx", "utf8"),
  readFile("app/reports/[id]/report-finding-image.tsx", "utf8"),
  readFile("app/globals.css", "utf8"),
]);

test("리포트의 공개 검증 사진을 원본 비율 라이트박스로 연다", () => {
  assert.match(report, /<ReportFindingImage src=\{imageUrl\} title=\{finding\.title\} \/>/);
  assert.match(community, /<ReportFindingImage src=\{imageUrl\} title=\{finding\.title\} \/>/);
  assert.match(lightbox, /role="dialog"/);
  assert.match(lightbox, /aria-modal="true"/);
  assert.match(lightbox, /원본 사진 닫기/);
  assert.match(lightbox, /event\.key === "Escape"/);
  assert.match(styles, /\.case-lightbox-stage > img[^}]*object-fit: contain;/);
});
