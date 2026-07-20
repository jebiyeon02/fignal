import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contract = await readFile("app/analytics-contract.ts", "utf8");
const client = await readFile("app/analytics.ts", "utf8");
const page = await readFile("app/page.tsx", "utf8");
const report = await readFile("app/reports/[id]/page.tsx", "utf8");
const api = await readFile("app/api/events/route.ts", "utf8");
const admin = await readFile("app/feedback-admin/page.tsx", "utf8");

test("암묵적 피드백은 정확히 열 가지 허용 이벤트만 수집한다", () => {
  const eventNames = [...contract.matchAll(/^\s+"([a-z_]+)",$/gm)].map((match) => match[1]);
  assert.equal(eventNames.length, 10);
  assert.equal(new Set(eventNames).size, 10);
  for (const eventName of eventNames) {
    assert.match(`${page}\n${report}`, new RegExp(`(?:trackSiteEvent\\(|eventName=)"${eventName}"`));
  }
  assert.match(api, /siteEventNameSet\.has\(eventName\)/);
});

test("행동 통계는 검색어와 IP 대신 익명 세션 해시를 저장한다", () => {
  assert.match(page, /query_length/);
  assert.doesNotMatch(page, /query:\s*trimmedQuery/);
  assert.match(api, /SHA-256/);
  assert.doesNotMatch(api, /cf-connecting-ip|x-forwarded-for/i);
  assert.match(api, /cleanPagePath/);
});

test("관리자 화면은 익명 행동 퍼널과 제품별 통계를 조회한다", () => {
  assert.match(admin, /getSiteAnalytics\(30\)/);
  assert.match(admin, /검증 퍼널/);
  assert.match(admin, /많이 확인한 제품/);
  assert.match(admin, /검색어나 사진, IP를 저장하지 않고/);
});
