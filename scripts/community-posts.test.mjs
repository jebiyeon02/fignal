import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [schemaSource, postStoreSource, postRouteSource, analysisRouteSource] = await Promise.all([
  readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  readFile(new URL("../db/community-posts.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/community/posts/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/analyze/route.ts", import.meta.url), "utf8"),
]);

test("community posts require a stored verification and its private publish token", () => {
  assert.match(postRouteSource, /!verificationId \|\| !publishToken/);
  assert.match(postStoreSource, /verificationHistory\.communityPublishTokenHash/);
  assert.match(postStoreSource, /suppliedHash !== verificationRow\.tokenHash/);
  assert.match(analysisRouteSource, /communityPublishTokenHash: await hashCommunityPublishToken/);
});

test("one verification can produce at most one community post", () => {
  assert.match(schemaSource, /uniqueIndex\("community_posts_verification_idx"\)\.on\(table\.verificationId\)/);
  assert.match(postStoreSource, /already_published/);
});

test("related posts are selected by the exact catalog product id", () => {
  assert.match(postStoreSource, /eq\(verificationHistory\.productId, input\.productId\)/);
  assert.match(postStoreSource, /ne\(communityPosts\.verificationId, input\.excludeVerificationId\)/);
});
