import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [schemaSource, commentStoreSource, commentRouteSource, commentManageRouteSource, passwordSource, commentUiSource] = await Promise.all([
  readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  readFile(new URL("../db/community-comments.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/posts/[id]/comments/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/posts/[id]/comments/[commentId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../db/comment-password.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/community/[id]/comments.tsx", import.meta.url), "utf8"),
]);

test("community opinions are stored against a real verification post", () => {
  assert.match(schemaSource, /communityComments = sqliteTable/);
  assert.match(schemaSource, /postId: text\("post_id"\)\.notNull\(\)/);
  assert.match(commentStoreSource, /where\(eq\(communityPosts\.id, input\.postId\)\)/);
  assert.match(commentStoreSource, /if \(!post\) return null/);
});

test("comment writing has length, password, and rate limits", () => {
  assert.match(commentRouteSource, /RATE_LIMIT_COMMENTS = 5/);
  assert.match(commentRouteSource, /nickname\.length < 2/);
  assert.match(commentRouteSource, /body\.length < 2/);
  assert.match(commentRouteSource, /MAX_COMMENT_LENGTH = 500/);
  assert.match(commentRouteSource, /MIN_PASSWORD_LENGTH = 4/);
});

test("comment passwords are salted and hashed instead of stored as plain text", () => {
  assert.match(schemaSource, /passwordHash: text\("password_hash"\)/);
  assert.match(schemaSource, /passwordSalt: text\("password_salt"\)/);
  assert.match(passwordSource, /PBKDF2/);
  assert.match(passwordSource, /PASSWORD_HASH_ITERATIONS = 100_000/);
  assert.match(passwordSource, /crypto\.getRandomValues/);
  assert.match(commentStoreSource, /hashCommentPassword\(input\.password\)/);
  assert.doesNotMatch(commentStoreSource, /password: input\.password/);
});

test("comment owners can update or delete with the configured password", () => {
  assert.match(commentManageRouteSource, /export async function PATCH/);
  assert.match(commentManageRouteSource, /export async function DELETE/);
  assert.match(commentManageRouteSource, /verifyCommentPassword/);
  assert.match(commentManageRouteSource, /비밀번호가 일치하지 않습니다/);
  assert.match(commentUiSource, /댓글 수정/);
  assert.match(commentUiSource, /댓글 삭제/);
});

test("post detail exposes a concise password-protected comment composer", () => {
  assert.match(commentUiSource, /댓글 쓰기/);
  assert.match(commentUiSource, /수정·삭제용 4자 이상/);
  assert.doesNotMatch(commentUiSource, /댓글 수가 AI 판정을 바꾸지는 않습니다/);
  assert.doesNotMatch(commentUiSource, /사진이나 판본 차이에 대한 근거를 남겨주세요/);
  assert.doesNotMatch(commentUiSource, /로그인 없이 작성할 수 있어요/);
  assert.doesNotMatch(commentUiSource, /community-comment-number/);
  assert.doesNotMatch(commentUiSource, /padStart/);
});

test("comment composer follows the comment list like a community board", () => {
  const listIndex = commentUiSource.indexOf('className="community-comment-list"');
  const emptyIndex = commentUiSource.indexOf('className="community-comments-empty"');
  const formIndex = commentUiSource.indexOf('className="community-comment-form"');

  assert.ok(listIndex > -1 && emptyIndex > -1 && formIndex > listIndex && formIndex > emptyIndex);
  assert.match(commentUiSource, /전체 댓글 <em>\{comments\.length\}<\/em>개/);
});
