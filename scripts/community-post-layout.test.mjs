import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/community/[id]/page.tsx", import.meta.url), "utf8");

test("community post keeps the result summary inside the post card", () => {
  const articleStart = pageSource.indexOf('<article className="community-post-article">');
  const articleEnd = pageSource.indexOf("</article>", articleStart);
  const article = pageSource.slice(articleStart, articleEnd);
  assert.match(article, /community-inline-result/);
  assert.match(article, /검증 결과 · No\./);
  assert.doesNotMatch(article, /검증 결과 연결됨/);
});

test("full evidence is shown only through the report tab", () => {
  assert.match(pageSource, /tab === "report"/);
  assert.match(pageSource, />게시글 <span>/);
  assert.match(pageSource, />검증 리포트<\/Link>/);
  assert.match(pageSource, /reportTabActive \? \(/);
  assert.match(pageSource, /<CommunityComments postId=\{post\.id}/);
});
