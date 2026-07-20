import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("result footer keeps only share and community publish actions", () => {
  const start = pageSource.indexOf('<div className="result-actions">');
  const end = pageSource.indexOf("{criteriaOpen", start);
  const actions = start >= 0 && end > start ? pageSource.slice(start, end) : "";
  assert.match(actions, /> 공유<\/button>/);
  assert.match(actions, /> 커뮤니티에 게시<\/button>/);
  assert.doesNotMatch(actions, /새 검증|읽기 전용 리포트|검증 사례로 게시/);
});

test("share action combines link copy and opening the read-only report", () => {
  assert.match(pageSource, /<strong>링크 복사<\/strong>/);
  assert.match(pageSource, /<strong>리포트 열기<\/strong>/);
  assert.match(pageSource, /navigator\.clipboard\.writeText\(reportUrl\)/);
});
