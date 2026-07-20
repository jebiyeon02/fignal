import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [schemaSource, commentStoreSource, commentRouteSource, commentUiSource] = await Promise.all([
  readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  readFile(new URL("../db/community-comments.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/posts/[id]/comments/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/community/[id]/comments.tsx", import.meta.url), "utf8"),
]);

test("community opinions are stored against a real verification post", () => {
  assert.match(schemaSource, /communityComments = sqliteTable/);
  assert.match(schemaSource, /postId: text\("post_id"\)\.notNull\(\)/);
  assert.match(commentStoreSource, /where\(eq\(communityPosts\.id, input\.postId\)\)/);
  assert.match(commentStoreSource, /if \(!post\) return null/);
});

test("anonymous comment writing has length and rate limits", () => {
  assert.match(commentRouteSource, /RATE_LIMIT_COMMENTS = 5/);
  assert.match(commentRouteSource, /nickname\.length < 2/);
  assert.match(commentRouteSource, /body\.length < 2/);
  assert.match(commentRouteSource, /MAX_COMMENT_LENGTH = 500/);
});

test("post detail exposes a comment composer and explains verdict separation", () => {
  assert.match(commentUiSource, /의견 등록/);
  assert.match(commentUiSource, /댓글 수가 AI 판정을 바꾸지는 않습니다/);
  assert.match(commentUiSource, /판매자 개인정보나 단정적인 비방/);
});
