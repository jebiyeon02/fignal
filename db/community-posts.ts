import { env } from "cloudflare:workers";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import type { CommunityPost, CommunityPostStatus } from "../app/community";
import { getDb } from ".";
import { communityPosts, verificationHistory, verificationReportImages } from "./schema";
import { getVerificationHistoryById } from "./verification-history";

let schemaReady: Promise<void> | null = null;

async function ensureCommunitySchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS community_posts (
      id text PRIMARY KEY NOT NULL,
      verification_id text NOT NULL,
      title text NOT NULL,
      body text DEFAULT '' NOT NULL,
      status text DEFAULT 'collecting' NOT NULL,
      helpful_count integer DEFAULT 0 NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS community_posts_verification_idx ON community_posts (verification_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON community_posts (created_at)"),
  ]).then(() => undefined);
  await schemaReady;
}

function isPostStatus(value: string): value is CommunityPostStatus {
  return value === "collecting" || value === "supplemented" || value === "reviewed";
}

export async function hashCommunityPublishToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function createCommunityPost(input: {
  verificationId: string;
  publishToken: string;
  title: string;
  body: string;
}): Promise<{ post: CommunityPost | null; reason?: "invalid_verification" | "forbidden" | "already_published" }> {
  await ensureCommunitySchema();
  const db = getDb();
  const [verificationRow] = await db
    .select({ tokenHash: verificationHistory.communityPublishTokenHash })
    .from(verificationHistory)
    .where(eq(verificationHistory.id, input.verificationId))
    .limit(1);
  if (!verificationRow) return { post: null, reason: "invalid_verification" };

  const suppliedHash = await hashCommunityPublishToken(input.publishToken);
  if (!verificationRow.tokenHash || suppliedHash !== verificationRow.tokenHash) {
    return { post: null, reason: "forbidden" };
  }

  const [existing] = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.verificationId, input.verificationId))
    .limit(1);
  if (existing) {
    return { post: await getCommunityPostById(existing.id), reason: "already_published" };
  }

  const id = crypto.randomUUID();
  await db.insert(communityPosts).values({
    id,
    verificationId: input.verificationId,
    title: input.title,
    body: input.body,
    status: "collecting",
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  });
  return { post: await getCommunityPostById(id) };
}

async function hydrateCommunityPosts(rows: Array<typeof communityPosts.$inferSelect>): Promise<CommunityPost[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const verificationIds = rows.map((row) => row.verificationId);
  const verificationRows = await db.select().from(verificationHistory).where(inArray(verificationHistory.id, verificationIds));
  const imageRows = await db.select().from(verificationReportImages).where(inArray(verificationReportImages.verificationId, verificationIds));

  return rows.flatMap((row) => {
    const verificationRow = verificationRows.find((item) => item.id === row.verificationId);
    if (!verificationRow || !isPostStatus(row.status)) return [];
    try {
      const analysis = JSON.parse(verificationRow.analysisJson);
      const verification = {
        id: verificationRow.id,
        productId: verificationRow.productId,
        productName: verificationRow.productName,
        productNumber: verificationRow.productNumber,
        productMaker: verificationRow.productMaker,
        productImage: verificationRow.productImage,
        productOfficialUrl: verificationRow.productOfficialUrl,
        verdict: verificationRow.verdict,
        summary: verificationRow.summary,
        evidenceCompleteness: verificationRow.evidenceCompleteness,
        photoCount: verificationRow.photoCount,
        riskSignalCount: verificationRow.riskSignalCount,
        matchedCaseCount: verificationRow.matchedCaseCount,
        analysis,
        images: imageRows
          .filter((image) => image.verificationId === verificationRow.id)
          .map((image) => ({ evidenceKey: image.evidenceKey, url: `/api/verifications/${encodeURIComponent(verificationRow.id)}/images/${encodeURIComponent(image.evidenceKey)}` })),
        createdAt: verificationRow.createdAt,
      } as CommunityPost["verification"];
      return [{
        id: row.id,
        verificationId: row.verificationId,
        title: row.title,
        body: row.body,
        status: row.status,
        helpfulCount: row.helpfulCount,
        createdAt: row.createdAt,
        verification,
      }];
    } catch {
      return [];
    }
  });
}

export async function listCommunityPosts(limit = 24): Promise<CommunityPost[]> {
  await ensureCommunitySchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = await getDb().select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(safeLimit);
  return hydrateCommunityPosts(rows);
}

export async function listCommunityPostsForProduct(input: {
  productId: string;
  excludeVerificationId?: string;
  limit?: number;
}): Promise<CommunityPost[]> {
  await ensureCommunitySchema();
  const safeLimit = Math.min(Math.max(Math.trunc(input.limit ?? 3), 1), 6);
  const conditions = [eq(verificationHistory.productId, input.productId)];
  if (input.excludeVerificationId) {
    conditions.push(ne(communityPosts.verificationId, input.excludeVerificationId));
  }
  const joinedRows = await getDb()
    .select({ post: communityPosts })
    .from(communityPosts)
    .innerJoin(verificationHistory, eq(communityPosts.verificationId, verificationHistory.id))
    .where(and(...conditions))
    .orderBy(desc(communityPosts.createdAt))
    .limit(safeLimit);
  return hydrateCommunityPosts(joinedRows.map((row) => row.post));
}

export async function getCommunityPostById(id: string): Promise<CommunityPost | null> {
  await ensureCommunitySchema();
  const [row] = await getDb().select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  if (!row || !isPostStatus(row.status)) return null;
  const verification = await getVerificationHistoryById(row.verificationId);
  if (!verification) return null;
  return {
    id: row.id,
    verificationId: row.verificationId,
    title: row.title,
    body: row.body,
    status: row.status,
    helpfulCount: row.helpfulCount,
    createdAt: row.createdAt,
    verification,
  };
}
