import { env } from "cloudflare:workers";
import { desc } from "drizzle-orm";
import { getDb } from ".";
import { siteFeedback } from "./schema";

export type SiteFeedbackItem = {
  id: string;
  message: string;
  pagePath: string;
  pageContext: string;
  createdAt: string;
};

let schemaReady: Promise<void> | null = null;

async function ensureSiteFeedbackSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_feedback (
      id text PRIMARY KEY NOT NULL,
      message text NOT NULL,
      page_path text DEFAULT '/' NOT NULL,
      page_context text DEFAULT 'search' NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS site_feedback_created_at_idx ON site_feedback (created_at)"),
  ]).then(() => undefined);
  await schemaReady;
}

export async function createSiteFeedback(input: {
  message: string;
  pagePath: string;
  pageContext: string;
}): Promise<SiteFeedbackItem> {
  await ensureSiteFeedbackSchema();
  const feedback = {
    id: crypto.randomUUID(),
    message: input.message,
    pagePath: input.pagePath,
    pageContext: input.pageContext,
    createdAt: new Date().toISOString(),
  };
  await getDb().insert(siteFeedback).values(feedback);
  return feedback;
}

export async function listSiteFeedback(limit = 200): Promise<SiteFeedbackItem[]> {
  await ensureSiteFeedbackSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  return getDb()
    .select()
    .from(siteFeedback)
    .orderBy(desc(siteFeedback.createdAt))
    .limit(safeLimit);
}
