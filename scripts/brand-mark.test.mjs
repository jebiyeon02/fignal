import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const brandMark = await readFile("app/brand-mark.tsx", "utf8");
const metadata = await readFile("app/layout.tsx", "utf8");
const shareSource = await readFile("app/page.tsx", "utf8");
const styles = await readFile("app/globals.css", "utf8");

test("서비스명을 FIGNAL로 통일하고 BETA 상태를 표시한다", () => {
  assert.match(brandMark, /className="brand-symbol"/);
  assert.match(brandMark, />FIGNAL</);
  assert.match(brandMark, />BETA</);
  assert.match(metadata, /FIGNAL BETA — 피규어 검증/);
  assert.match(metadata, /DEFAULT_PRODUCT_IMAGE/);
  assert.match(metadata, /\/images\/brand-character-icon\.png/);
  assert.doesNotMatch(metadata, /\/og\.png/);
  assert.match(styles, /\.brand-symbol \{ width: 38px; height: 38px;[^}]*brand-character-icon\.png/);
  assert.match(shareSource, /FIGNAL BETA 추가 검토 요청/);
  assert.doesNotMatch(`${brandMark}\n${metadata}\n${shareSource}`, /FIGSIGNAL/);
});

test("메인 검색 제목은 넨도로이드에 맞추고 중복 상단 문구를 숨긴다", () => {
  assert.match(shareSource, /넨도로이드 이름을<br \/>검색해보세요/);
  assert.doesNotMatch(shareSource, /<span>넨도로이드 검증<\/span>/);
});
