import { env } from "cloudflare:workers";

const TABLES = [
  "community_comments",
  "community_posts",
  "verification_report_images",
  "verification_history",
  "site_feedback",
  "site_events",
] as const;

export type SiteDataCounts = Record<(typeof TABLES)[number], number>;

export async function getSiteDataCounts(): Promise<SiteDataCounts> {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");

  const results = await env.DB.batch(
    TABLES.map((table) =>
      env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`),
    ),
  );

  return Object.fromEntries(
    TABLES.map((table, index) => [
      table,
      Number((results[index].results?.[0] as { count?: number } | undefined)?.count ?? 0),
    ]),
  ) as SiteDataCounts;
}

export async function resetSiteData(): Promise<{
  before: SiteDataCounts;
  after: SiteDataCounts;
}> {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");

  const before = await getSiteDataCounts();
  await env.DB.batch(TABLES.map((table) => env.DB.prepare(`DELETE FROM ${table}`)));
  const after = await getSiteDataCounts();

  return { before, after };
}
