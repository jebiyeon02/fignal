import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile("app/page.tsx", "utf8");

test("AI 분석 중에는 전체 화면의 상호작용을 잠근다", () => {
  assert.match(pageSource, /inert=\{isAnalyzing \? true : undefined\}/);
  assert.match(pageSource, /className="analysis-interaction-lock"/);
  assert.match(pageSource, /aria-modal="true"/);
  assert.match(pageSource, /사진 추가·삭제와 페이지 이동을 잠시 막아두었습니다/);
});

test("사진 변경 핸들러도 분석 중 요청을 거부한다", () => {
  assert.match(pageSource, /const handleFile[\s\S]*?if \(isAnalyzing\)/);
  assert.match(pageSource, /const pasteFromClipboard[\s\S]*?if \(isAnalyzing\) return/);
  assert.match(pageSource, /const removeEvidence[\s\S]*?if \(isAnalyzing\) return/);
  assert.match(pageSource, /const resetAll[\s\S]*?if \(isAnalyzing\) return/);
});
