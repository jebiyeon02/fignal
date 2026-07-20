import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/page.tsx", "utf8");
const styles = await readFile("app/globals.css", "utf8");

test("검색 화면에 베타 한계와 서비스 개선 방향을 안내한다", () => {
  const noticeStart = page.indexOf('<aside className="beta-notice"');
  const noticeEnd = page.indexOf('<div className="product-search">', noticeStart);
  const notice = page.slice(noticeStart, noticeEnd);

  assert.ok(noticeStart > page.indexOf('<div className="intro">'));
  assert.ok(noticeEnd > noticeStart);
  assert.match(notice, /함께 정확해지는 피규어 검증을 만들고 있어요/);
  assert.match(notice, /AI 분석은 사진 품질과 촬영 환경에 따라 부정확할 수 있습니다/);
  assert.match(notice, /일부 제품은 확인 가능한 공식 대표 이미지가 없습니다/);
  assert.match(notice, /일부 제품은 비교할 수 있는 가품 사례가 아직 부족합니다/);
  assert.match(notice, /권리와 활용 동의가 확인된 검증 자료와 커뮤니티 피드백/);
  assert.match(notice, /분석 결과는 정품 보증이나 제조사 판정을 대신하지 않습니다/);
  assert.doesNotMatch(notice, /업로드.*(?:즉시|자동).*학습/);
});

test("베타 안내는 데스크톱 3열과 모바일 1열 레이아웃을 제공한다", () => {
  assert.match(styles, /\.beta-notice-points \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*\.beta-notice-points \{ grid-template-columns: 1fr; \}/);
});
