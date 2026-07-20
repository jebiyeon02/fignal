import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [pageSource, listSource, homeSource] = await Promise.all([
  readFile(new URL("../app/community/[id]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/community/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
]);

test("community post keeps the result summary inside the post card", () => {
  const articleStart = pageSource.indexOf('<article className="community-post-article">');
  const articleEnd = pageSource.indexOf("</article>", articleStart);
  const article = pageSource.slice(articleStart, articleEnd);
  assert.match(article, /community-inline-result/);
  assert.match(article, /검증 결과 · No\./);
  assert.doesNotMatch(article, /검증 결과 연결됨/);
});

test("community post omits redundant origin copy and collection status", () => {
  assert.doesNotMatch(pageSource, /검증 완료 결과로 작성한 게시글/);
  assert.doesNotMatch(pageSource, /의견 수집 중|communityPostStatusCopy/);
  assert.doesNotMatch(listSource, /의견 수집 중|communityPostStatusCopy/);
  assert.doesNotMatch(homeSource, /의견 수집 중|communityPostStatusCopy/);
});

test("full evidence is shown only through the report tab", () => {
  assert.match(pageSource, /tab === "report"/);
  assert.match(pageSource, />게시글 <span>/);
  assert.match(pageSource, />검증 리포트<\/Link>/);
  assert.match(pageSource, /reportTabActive \? \(/);
  assert.match(pageSource, /<CommunityComments postId=\{post\.id}/);
});
