import { env } from "cloudflare:workers";
import type { SiteEventName } from "../app/analytics-contract";

export type SiteEventCount = {
  eventName: SiteEventName;
  count: number;
  sessions: number;
};

export type SiteAnalytics = {
  days: number;
  totalEvents: number;
  uniqueSessions: number;
  eventCounts: SiteEventCount[];
  daily: Array<{ date: string; sessions: number; completed: number; failed: number }>;
  products: Array<{ productId: string; selected: number; started: number; completed: number; sourceClicks: number }>;
};

let schemaReady: Promise<void> | null = null;
let lastCleanupAt = 0;

async function ensureSiteEventSchema() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_events (
      id text PRIMARY KEY NOT NULL,
      session_hash text NOT NULL,
      event_name text NOT NULL,
      page_path text DEFAULT '/' NOT NULL,
      page_context text DEFAULT 'other' NOT NULL,
      product_id text,
      verification_id text,
      properties_json text DEFAULT '{}' NOT NULL,
      created_at text NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS site_events_created_at_idx ON site_events (created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS site_events_event_created_at_idx ON site_events (event_name, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS site_events_session_created_at_idx ON site_events (session_hash, created_at)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS site_events_product_created_at_idx ON site_events (product_id, created_at)"),
  ]).then(() => undefined);
  await schemaReady;
}

async function cleanupExpiredEvents() {
  const now = Date.now();
  if (now - lastCleanupAt < 60 * 60 * 1000) return;
  lastCleanupAt = now;
  const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("DELETE FROM site_events WHERE created_at < ?1").bind(cutoff).run();
}

export async function createSiteEvent(input: {
  sessionHash: string;
  eventName: SiteEventName;
  pagePath: string;
  pageContext: string;
  productId: string | null;
  verificationId: string | null;
  properties: Record<string, string | number | boolean | null>;
}) {
  await ensureSiteEventSchema();
  await cleanupExpiredEvents();
  await env.DB.prepare(`INSERT INTO site_events (
    id, session_hash, event_name, page_path, page_context, product_id, verification_id, properties_json, created_at
  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`)
    .bind(
      crypto.randomUUID(),
      input.sessionHash,
      input.eventName,
      input.pagePath,
      input.pageContext,
      input.productId,
      input.verificationId,
      JSON.stringify(input.properties),
      new Date().toISOString(),
    )
    .run();
}

export async function getSiteAnalytics(days = 30): Promise<SiteAnalytics> {
  await ensureSiteEventSchema();
  const safeDays = Math.min(Math.max(Math.trunc(days), 1), 90);
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const [summary, eventCounts, daily, products] = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) AS total_events, COUNT(DISTINCT session_hash) AS unique_sessions
      FROM site_events WHERE created_at >= ?1`).bind(since),
    env.DB.prepare(`SELECT event_name, COUNT(*) AS event_count, COUNT(DISTINCT session_hash) AS session_count
      FROM site_events WHERE created_at >= ?1 GROUP BY event_name ORDER BY event_count DESC`).bind(since),
    env.DB.prepare(`SELECT date(created_at, '+9 hours') AS event_date,
      COUNT(DISTINCT session_hash) AS session_count,
      SUM(CASE WHEN event_name = 'analysis_completed' THEN 1 ELSE 0 END) AS completed_count,
      SUM(CASE WHEN event_name = 'analysis_failed' THEN 1 ELSE 0 END) AS failed_count
      FROM site_events WHERE created_at >= ?1 GROUP BY event_date ORDER BY event_date ASC`).bind(since),
    env.DB.prepare(`SELECT product_id,
      SUM(CASE WHEN event_name = 'product_selected' THEN 1 ELSE 0 END) AS selected_count,
      SUM(CASE WHEN event_name = 'analysis_started' THEN 1 ELSE 0 END) AS started_count,
      SUM(CASE WHEN event_name = 'analysis_completed' THEN 1 ELSE 0 END) AS completed_count,
      SUM(CASE WHEN event_name = 'case_source_clicked' THEN 1 ELSE 0 END) AS source_click_count
      FROM site_events WHERE created_at >= ?1 AND product_id IS NOT NULL
      GROUP BY product_id ORDER BY completed_count DESC, selected_count DESC LIMIT 8`).bind(since),
  ]);

  const summaryRow = summary.results[0] as Record<string, unknown> | undefined;
  const dailyRows = (daily.results as Array<Record<string, unknown>>).map((row) => ({
    date: String(row.event_date),
    sessions: Number(row.session_count ?? 0),
    completed: Number(row.completed_count ?? 0),
    failed: Number(row.failed_count ?? 0),
  }));
  const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
  const koreaOffsetMs = 9 * 60 * 60 * 1000;
  const completeDaily = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(Date.now() + koreaOffsetMs - (safeDays - index - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return dailyByDate.get(date) ?? { date, sessions: 0, completed: 0, failed: 0 };
  });
  return {
    days: safeDays,
    totalEvents: Number(summaryRow?.total_events ?? 0),
    uniqueSessions: Number(summaryRow?.unique_sessions ?? 0),
    eventCounts: (eventCounts.results as Array<Record<string, unknown>>).map((row) => ({
      eventName: String(row.event_name) as SiteEventName,
      count: Number(row.event_count ?? 0),
      sessions: Number(row.session_count ?? 0),
    })),
    daily: completeDaily,
    products: (products.results as Array<Record<string, unknown>>).map((row) => ({
      productId: String(row.product_id),
      selected: Number(row.selected_count ?? 0),
      started: Number(row.started_count ?? 0),
      completed: Number(row.completed_count ?? 0),
      sourceClicks: Number(row.source_click_count ?? 0),
    })),
  };
}
