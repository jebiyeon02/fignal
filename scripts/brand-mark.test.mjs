import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const brandMark = await readFile("app/brand-mark.tsx", "utf8");
const metadata = await readFile("app/layout.tsx", "utf8");
const shareSource = await readFile("app/page.tsx", "utf8");

test("서비스명을 FIGNAL로 통일하고 BETA 상태를 표시한다", () => {
  assert.match(brandMark, />FIGNAL</);
  assert.match(brandMark, />BETA</);
  assert.match(metadata, /FIGNAL BETA — 피규어 검증/);
  assert.match(shareSource, /FIGNAL BETA 추가 검토 요청/);
  assert.doesNotMatch(`${brandMark}\n${metadata}\n${shareSource}`, /FIGSIGNAL/);
});
