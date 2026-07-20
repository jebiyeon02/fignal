import { env } from "cloudflare:workers";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { AnalysisResult } from "../app/api/analyze/analysis-contract";
import {
  sanitizeAnalysisForHistory,
  type VerificationReportImage,
  type VerificationHistoryItem,
} from "../app/verification-history";
import { getDb } from ".";
import { verificationHistory, verificationReportImages } from "./schema";

let schemaReady: Promise<void> | null = null;

async function ensureVerificationHistorySchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS verification_history (
      id text PRIMARY KEY NOT NULL,
      product_id text NOT NULL,
      product_name text NOT NULL,
      product_number text NOT NULL,
      product_maker text NOT NULL,
      product_image text DEFAULT '' NOT NULL,
      product_official_url text DEFAULT '' NOT NULL,
      verdict text NOT NULL,
      summary text NOT NULL,
      evidence_completeness integer NOT NULL,
      photo_count integer NOT NULL,
      risk_signal_count integer NOT NULL,
      matched_case_count integer NOT NULL,
      analysis_json text NOT NULL,
      prompt_version text NOT NULL,
      community_publish_token_hash text DEFAULT '' NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS verification_history_created_at_idx ON verification_history (created_at)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS verification_report_images (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      verification_id text NOT NULL,
      evidence_key text NOT NULL,
      object_key text NOT NULL,
      content_type text NOT NULL,
      byte_size integer NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS verification_report_images_verification_evidence_idx ON verification_report_images (verification_id, evidence_key)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS verification_report_images_object_key_idx ON verification_report_images (object_key)"),
  ]).then(() => undefined);
  await schemaReady;
}

type VerificationProduct = {
  id: string;
  name: string;
  number: string;
  maker: string;
  image: string;
  officialUrl: string;
};

type StoredReportImage = {
  evidenceKey: VerificationReportImage["evidenceKey"];
  objectKey: string;
  contentType: string;
  byteSize: number;
};

function publicReportImage(verificationId: string, evidenceKey: VerificationReportImage["evidenceKey"]): VerificationReportImage {
  return {
    evidenceKey,
    url: `/api/verifications/${encodeURIComponent(verificationId)}/images/${encodeURIComponent(evidenceKey)}`,
  };
}

function toHistoryItem(
  row: typeof verificationHistory.$inferSelect,
  imageRows: Array<typeof verificationReportImages.$inferSelect>,
): VerificationHistoryItem | null {
  try {
    const analysis = JSON.parse(row.analysisJson) as AnalysisResult;
    return {
      id: row.id,
      productId: row.productId,
      productName: row.productName,
      productNumber: row.productNumber,
      productMaker: row.productMaker,
      productImage: row.productImage,
      productOfficialUrl: row.productOfficialUrl,
      verdict: row.verdict as AnalysisResult["verdict"],
      summary: row.summary,
      evidenceCompleteness: row.evidenceCompleteness,
      photoCount: row.photoCount,
      riskSignalCount: row.riskSignalCount,
      matchedCaseCount: row.matchedCaseCount,
      analysis,
      images: imageRows.map((image) => publicReportImage(row.id, image.evidenceKey as VerificationReportImage["evidenceKey"])),
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

export async function saveVerificationHistory(input: {
  id: string;
  product: VerificationProduct;
  analysis: AnalysisResult;
  promptVersion: string;
  communityPublishTokenHash: string;
  images: StoredReportImage[];
}): Promise<VerificationHistoryItem> {
  await ensureVerificationHistorySchema();
  const createdAt = new Date().toISOString();
  const analysis = sanitizeAnalysisForHistory(input.analysis);
  const historyValues = {
    id: input.id,
    productId: input.product.id,
    productName: input.product.name,
    productNumber: input.product.number,
    productMaker: input.product.maker,
    productImage: input.product.image,
    productOfficialUrl: input.product.officialUrl,
    verdict: analysis.verdict,
    summary: analysis.summary,
    evidenceCompleteness: analysis.evidenceCompleteness,
    photoCount: analysis.findings.length,
    riskSignalCount: analysis.findings.filter((finding) => finding.status === "concern").length,
    matchedCaseCount: analysis.caseMatches.length,
    analysisJson: JSON.stringify(analysis),
    promptVersion: input.promptVersion,
    communityPublishTokenHash: input.communityPublishTokenHash,
    createdAt,
  };

  const db = getDb();
  if (input.images.length > 0) {
    await db.batch([
      db.insert(verificationHistory).values(historyValues),
      db.insert(verificationReportImages).values(input.images.map((image) => ({
        verificationId: input.id,
        evidenceKey: image.evidenceKey,
        objectKey: image.objectKey,
        contentType: image.contentType,
        byteSize: image.byteSize,
        createdAt,
      }))),
    ]);
  } else {
    await db.insert(verificationHistory).values(historyValues);
  }

  const historyItem = await getVerificationHistoryById(input.id);
  if (!historyItem) throw new Error("Saved verification history could not be read");
  return historyItem;
}

export async function listRecentVerificationHistory(limit = 6): Promise<VerificationHistoryItem[]> {
  await ensureVerificationHistorySchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 12);
  const db = getDb();
  const rows = await db
    .select()
    .from(verificationHistory)
    .orderBy(desc(verificationHistory.createdAt))
    .limit(safeLimit);

  const imageRows = rows.length > 0
    ? await db.select().from(verificationReportImages).where(inArray(verificationReportImages.verificationId, rows.map((row) => row.id)))
    : [];

  return rows.flatMap((row) => {
    const item = toHistoryItem(row, imageRows.filter((image) => image.verificationId === row.id));
    return item ? [item] : [];
  });
}

export async function getVerificationHistoryById(id: string): Promise<VerificationHistoryItem | null> {
  await ensureVerificationHistorySchema();
  const db = getDb();
  const [row] = await db.select().from(verificationHistory).where(eq(verificationHistory.id, id)).limit(1);
  if (!row) return null;
  const imageRows = await db.select().from(verificationReportImages).where(eq(verificationReportImages.verificationId, id));
  return toHistoryItem(row, imageRows);
}

export async function getVerificationReportImageMetadata(id: string, evidenceKey: string) {
  await ensureVerificationHistorySchema();
  const [row] = await getDb()
    .select()
    .from(verificationReportImages)
    .where(and(
      eq(verificationReportImages.verificationId, id),
      eq(verificationReportImages.evidenceKey, evidenceKey),
    ))
    .limit(1);
  if (!row) return null;
  return row;
}
