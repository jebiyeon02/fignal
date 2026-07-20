import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layout = await readFile("app/layout.tsx", "utf8");
const rail = await readFile("app/floating-utility-rail.tsx", "utf8");
const styles = await readFile("app/floating-utility-rail.module.css", "utf8");

test("모든 화면의 베타 패널에 한계와 서비스 개선 방향을 안내한다", () => {
  assert.match(layout, /\{children\}[\s\S]*<FloatingUtilityRail \/>/);
  assert.match(rail, /함께 정확해지는 검증을 만들고 있어요/);
  assert.match(rail, /사진 품질과 촬영 환경에 따라 AI 분석이 부정확할 수 있어요/);
  assert.match(rail, /일부 제품은 확인 가능한 공식 대표 이미지가 없어요/);
  assert.match(rail, /제품별 가품 비교 사례를 계속 보완하고 있어요/);
  assert.match(rail, /검증 자료와 커뮤니티 피드백을 바탕으로/);
  assert.match(rail, /검색어·사진·IP 없이 익명 행동 통계를 최대 90일 보관/);
  assert.match(rail, /분석 결과는 정품 보증이나 제조사 판정을 대신하지 않습니다/);
  assert.doesNotMatch(rail, /업로드.*(?:즉시|자동).*학습/);
});

test("베타 안내는 데스크톱과 모바일에서 화면 가장자리에 고정된다", () => {
  assert.match(styles, /\.rail \{[\s\S]*position: fixed;[\s\S]*right: 20px;[\s\S]*top: 50%;/);
  assert.match(styles, /\.betaPanel \{[\s\S]*right: calc\(100% \+ 9px\);/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*\.rail \{ right: 10px; bottom: 12px;/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*\.betaPanel \{ width: min\(318px, calc\(100vw - 20px\)\); \}/);
});
