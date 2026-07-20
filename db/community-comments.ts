import { env } from "cloudflare:workers";
import { asc, eq } from "drizzle-orm";
import type { CommunityComment } from "../app/community";
import { getDb } from ".";
import { communityComments, communityPosts } from "./schema";

let schemaReady: Promise<void> | null = null;

async function ensureCommunityCommentsSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS community_comments (
      id text PRIMARY KEY NOT NULL,
      post_id text NOT NULL,
      nickname text NOT NULL,
      body text NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS community_comments_post_created_at_idx ON community_comments (post_id, created_at)"),
  ]).then(() => undefined);
  await schemaReady;
}

export async function listCommunityComments(postId: string, limit = 100): Promise<CommunityComment[]> {
  await ensureCommunityCommentsSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  return getDb()
    .select()
    .from(communityComments)
    .where(eq(communityComments.postId, postId))
    .orderBy(asc(communityComments.createdAt))
    .limit(safeLimit);
}

export async function createCommunityComment(input: {
  postId: string;
  nickname: string;
  body: string;
}): Promise<CommunityComment | null> {
  await ensureCommunityCommentsSchema();
  const db = getDb();
  const [post] = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.id, input.postId))
    .limit(1);
  if (!post) return null;

  const comment: CommunityComment = {
    id: crypto.randomUUID(),
    postId: input.postId,
    nickname: input.nickname,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  await db.insert(communityComments).values(comment);
  return comment;
}
