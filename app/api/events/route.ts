import { siteEventNameSet, type SiteEventName } from "../../analytics-contract";
import { createSiteEvent } from "../../../db/site-events";

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_EVENTS = 120;
const eventRequestLog = new Map<string, number[]>();
const validContexts = new Set(["search", "photos", "result", "community", "report", "feedback_admin", "other"]);
const allowedPropertyKeys = new Set([
  "query_length", "result_count", "had_results", "selection_position", "verified",
  "upload_method", "evidence_key", "photo_count", "evidence_ready", "duration_ms", "failure_code",
  "verdict", "risk_signal_count", "case_match_count", "report_saved", "review_path",
  "has_ai_analysis", "case_id", "source_kind", "source_locale", "source_name",
  "from_stage", "had_result",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanPagePath(value: unknown) {
  const candidate = cleanText(value, 240);
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  try {
    const url = new URL(candidate, "https://app.local");
    return url.origin === "https://app.local" ? url.pathname : "/";
  } catch {
    return "/";
  }
}

function cleanProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, property] of Object.entries(value as Record<string, unknown>)) {
    if (!allowedPropertyKeys.has(key)) continue;
    if (typeof property === "string") cleaned[key] = property.slice(0, 80);
    if (typeof property === "number" && Number.isFinite(property)) cleaned[key] = Math.max(-1_000_000_000, Math.min(property, 1_000_000_000));
    if (typeof property === "boolean" || property === null) cleaned[key] = property;
  }
  return cleaned;
}

function isRateLimited(sessionId: string) {
  const now = Date.now();
  const recent = (eventRequestLog.get(sessionId) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_EVENTS) {
    eventRequestLog.set(sessionId, recent);
    return true;
  }
  eventRequestLog.set(sessionId, [...recent, now]);
  return false;
}

async function hashSessionId(sessionId: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionId));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "요청이 너무 큽니다." }, { status: 413 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const eventName = cleanText(payload?.eventName, 40);
  const sessionId = cleanText(payload?.sessionId, 100);
  if (!siteEventNameSet.has(eventName) || sessionId.length < 12) {
    return Response.json({ error: "유효하지 않은 이벤트입니다." }, { status: 400 });
  }
  if (isRateLimited(sessionId)) return Response.json({ ok: true }, { status: 202 });

  const pageContextValue = cleanText(payload?.pageContext, 20);
  try {
    await createSiteEvent({
      sessionHash: await hashSessionId(sessionId),
      eventName: eventName as SiteEventName,
      pagePath: cleanPagePath(payload?.pagePath),
      pageContext: validContexts.has(pageContextValue) ? pageContextValue : "other",
      productId: cleanText(payload?.productId, 100) || null,
      verificationId: cleanText(payload?.verificationId, 100) || null,
      properties: cleanProperties(payload?.properties),
    });
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to save site event", error);
    return Response.json({ error: "이벤트를 저장하지 못했습니다." }, { status: 500 });
  }
}
