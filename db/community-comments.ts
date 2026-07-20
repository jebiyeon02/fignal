import { env } from "cloudflare:workers";
import { and, asc, eq } from "drizzle-orm";
import type { CommunityComment } from "../app/community";
import { getDb } from ".";
import { hashCommentPassword } from "./comment-password";
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
      password_hash text,
      password_salt text,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS community_comments_post_created_at_idx ON community_comments (post_id, created_at)"),
  ]).then(() => undefined);
  await schemaReady;
}

export async function listCommunityComments(postId: string, limit = 100): Promise<CommunityComment[]> {
  await ensureCommunityCommentsSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const comments = await getDb()
    .select({
      id: communityComments.id,
      postId: communityComments.postId,
      nickname: communityComments.nickname,
      body: communityComments.body,
      passwordHash: communityComments.passwordHash,
      passwordSalt: communityComments.passwordSalt,
      createdAt: communityComments.createdAt,
    })
    .from(communityComments)
    .where(eq(communityComments.postId, postId))
    .orderBy(asc(communityComments.createdAt))
    .limit(safeLimit);
  return comments.map(({ passwordHash, passwordSalt, ...comment }) => ({
    ...comment,
    canManage: Boolean(passwordHash && passwordSalt),
  }));
}

export async function createCommunityComment(input: {
  postId: string;
  nickname: string;
  body: string;
  password: string;
}): Promise<CommunityComment | null> {
  await ensureCommunityCommentsSchema();
  const db = getDb();
  const [post] = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.id, input.postId))
    .limit(1);
  if (!post) return null;

  const password = await hashCommentPassword(input.password);
  const comment = {
    id: crypto.randomUUID(),
    postId: input.postId,
    nickname: input.nickname,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  await db.insert(communityComments).values({ ...comment, ...password });
  return { ...comment, canManage: true };
}

export async function getCommunityCommentForManagement(postId: string, commentId: string) {
  await ensureCommunityCommentsSchema();
  const [comment] = await getDb()
    .select()
    .from(communityComments)
    .where(and(eq(communityComments.postId, postId), eq(communityComments.id, commentId)))
    .limit(1);
  return comment ?? null;
}

export async function updateCommunityComment(postId: string, commentId: string, body: string): Promise<CommunityComment | null> {
  await ensureCommunityCommentsSchema();
  const db = getDb();
  await db
    .update(communityComments)
    .set({ body })
    .where(and(eq(communityComments.postId, postId), eq(communityComments.id, commentId)));
  const comment = await getCommunityCommentForManagement(postId, commentId);
  return comment ? {
    id: comment.id,
    postId: comment.postId,
    nickname: comment.nickname,
    body: comment.body,
    canManage: Boolean(comment.passwordHash && comment.passwordSalt),
    createdAt: comment.createdAt,
  } : null;
}

export async function deleteCommunityComment(postId: string, commentId: string) {
  await ensureCommunityCommentsSchema();
  const result = await getDb()
    .delete(communityComments)
    .where(and(eq(communityComments.postId, postId), eq(communityComments.id, commentId)));
  return result.meta.changes > 0;
}
