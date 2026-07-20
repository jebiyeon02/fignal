import { createCommunityPost, listCommunityPostsForProduct } from "../../../../db/community-posts";

const MAX_TITLE_LENGTH = 80;
const MAX_BODY_LENGTH = 600;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const productId = cleanText(searchParams.get("productId"), 100);
  const excludeVerificationId = cleanText(searchParams.get("excludeVerificationId"), 80);
  if (!productId) {
    return Response.json({ error: "제품 정보가 필요합니다." }, { status: 400 });
  }

  try {
    const posts = await listCommunityPostsForProduct({
      productId,
      excludeVerificationId: excludeVerificationId || undefined,
      limit: 3,
    });
    return Response.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load related community posts", error);
    return Response.json({ error: "같은 제품의 커뮤니티 글을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const verificationId = cleanText(payload?.verificationId, 80);
  const publishToken = cleanText(payload?.publishToken, 100);
  const title = cleanText(payload?.title, MAX_TITLE_LENGTH);
  const body = cleanText(payload?.body, MAX_BODY_LENGTH);

  if (!verificationId || !publishToken) {
    return Response.json({ error: "검증을 완료한 결과에서만 게시할 수 있습니다." }, { status: 403 });
  }
  if (title.length < 5) {
    return Response.json({ error: "제목을 5자 이상 입력해 주세요." }, { status: 400 });
  }

  try {
    const result = await createCommunityPost({ verificationId, publishToken, title, body });
    if (result.reason === "invalid_verification") {
      return Response.json({ error: "저장된 검증 결과를 찾지 못했습니다." }, { status: 404 });
    }
    if (result.reason === "forbidden") {
      return Response.json({ error: "이 검증을 완료한 화면에서만 게시할 수 있습니다." }, { status: 403 });
    }
    if (result.reason === "already_published") {
      return Response.json({ error: "이미 커뮤니티에 게시된 검증입니다.", post: result.post }, { status: 409 });
    }
    if (!result.post) throw new Error("Community post was not created");
    return Response.json({ post: result.post }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to create community post", error);
    return Response.json({ error: "커뮤니티 글을 게시하지 못했습니다." }, { status: 500 });
  }
}
