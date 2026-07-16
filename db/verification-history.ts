import { env } from "cloudflare:workers";
import { desc } from "drizzle-orm";
import type { AnalysisResult } from "../app/api/analyze/analysis-contract";
import {
  sanitizeAnalysisForHistory,
  type VerificationHistoryItem,
} from "../app/verification-history";
import { getDb } from ".";
import { verificationHistory } from "./schema";

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
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS verification_history_created_at_idx ON verification_history (created_at)"),
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

function toHistoryItem(row: typeof verificationHistory.$inferSelect): VerificationHistoryItem | null {
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
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

export async function saveVerificationHistory(input: {
  product: VerificationProduct;
  analysis: AnalysisResult;
  promptVersion: string;
}): Promise<VerificationHistoryItem> {
  await ensureVerificationHistorySchema();
  const createdAt = new Date().toISOString();
  const analysis = sanitizeAnalysisForHistory(input.analysis);
  const [row] = await getDb().insert(verificationHistory).values({
    id: crypto.randomUUID(),
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
    createdAt,
  }).returning();

  const historyItem = toHistoryItem(row);
  if (!historyItem) throw new Error("Saved verification history could not be read");
  return historyItem;
}

export async function listRecentVerificationHistory(limit = 6): Promise<VerificationHistoryItem[]> {
  await ensureVerificationHistorySchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 12);
  const rows = await getDb()
    .select()
    .from(verificationHistory)
    .orderBy(desc(verificationHistory.createdAt))
    .limit(safeLimit);

  return rows.flatMap((row) => {
    const item = toHistoryItem(row);
    return item ? [item] : [];
  });
}
