import { createCommunityComment, listCommunityComments } from "../../../../../../db/community-comments";

const MAX_NICKNAME_LENGTH = 20;
const MAX_COMMENT_LENGTH = 500;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 64;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_COMMENTS = 5;
const commentRequestLog = new Map<string, number[]>();

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
}

function isRateLimited(request: Request, postId: string) {
  const now = Date.now();
  const key = `${postId}:${clientAddress(request)}`;
  const recent = (commentRequestLog.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_COMMENTS) {
    commentRequestLog.set(key, recent);
    return true;
  }
  commentRequestLog.set(key, [...recent, now]);
  return false;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const comments = await listCommunityComments(id);
    return Response.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load community comments", error);
    return Response.json({ error: "의견을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isRateLimited(request, id)) {
    return Response.json({ error: "의견을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const nickname = cleanText(payload?.nickname, MAX_NICKNAME_LENGTH);
  const body = cleanText(payload?.body, MAX_COMMENT_LENGTH);
  const password = typeof payload?.password === "string" ? payload.password.slice(0, MAX_PASSWORD_LENGTH + 1) : "";
  if (nickname.length < 2) {
    return Response.json({ error: "닉네임을 2자 이상 입력해 주세요." }, { status: 400 });
  }
  if (body.length < 2) {
    return Response.json({ error: "의견을 2자 이상 입력해 주세요." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return Response.json({ error: "비밀번호를 4~64자로 입력해 주세요." }, { status: 400 });
  }

  try {
    const comment = await createCommunityComment({ postId: id, nickname, body, password });
    if (!comment) return Response.json({ error: "게시글을 찾지 못했습니다." }, { status: 404 });
    return Response.json({ comment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to create community comment", error);
    return Response.json({ error: "의견을 등록하지 못했습니다." }, { status: 500 });
  }
}
