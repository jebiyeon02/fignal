import { createSiteFeedback } from "../../../db/site-feedback";

const MAX_FEEDBACK_LENGTH = 600;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_SUBMISSIONS = 5;
const feedbackRequestLog = new Map<string, number[]>();
const VALID_CONTEXTS = new Set(["search", "photos", "result"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

function cleanPagePath(value: unknown) {
  const candidate = cleanText(value, 240);
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  try {
    const url = new URL(candidate, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}` : "/";
  } catch {
    return "/";
  }
}

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = clientAddress(request);
  const recent = (feedbackRequestLog.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_SUBMISSIONS) {
    feedbackRequestLog.set(key, recent);
    return true;
  }
  feedbackRequestLog.set(key, [...recent, now]);
  return false;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return Response.json({ error: "피드백을 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (cleanText(payload?.website, 100)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const message = cleanText(payload?.message, MAX_FEEDBACK_LENGTH);
  const pagePath = cleanPagePath(payload?.pagePath);
  const pageContextValue = cleanText(payload?.pageContext, 20);
  const pageContext = VALID_CONTEXTS.has(pageContextValue) ? pageContextValue : "search";

  if (message.length < 2) {
    return Response.json({ error: "피드백을 2자 이상 입력해 주세요." }, { status: 400 });
  }

  try {
    await createSiteFeedback({ message, pagePath, pageContext });
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to save site feedback", error);
    return Response.json({ error: "피드백을 저장하지 못했습니다." }, { status: 500 });
  }
}
