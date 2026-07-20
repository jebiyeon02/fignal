import { deleteCommunityComment, getCommunityCommentForManagement, updateCommunityComment } from "../../../../../../../db/community-comments";
import { verifyCommentPassword } from "../../../../../../../db/comment-password";

const MAX_COMMENT_LENGTH = 500;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 64;

function cleanBody(value: unknown) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, MAX_COMMENT_LENGTH) : "";
}

function cleanPassword(value: unknown) {
  return typeof value === "string" ? value.slice(0, MAX_PASSWORD_LENGTH + 1) : "";
}

async function authorizeComment(postId: string, commentId: string, password: string) {
  const comment = await getCommunityCommentForManagement(postId, commentId);
  if (!comment) return { error: "댓글을 찾지 못했습니다.", status: 404 } as const;
  if (!comment.passwordHash || !comment.passwordSalt) {
    return { error: "기존 댓글은 수정하거나 삭제할 수 없습니다.", status: 403 } as const;
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { error: "비밀번호를 4~64자로 입력해 주세요.", status: 400 } as const;
  }
  const verified = await verifyCommentPassword(password, comment.passwordHash, comment.passwordSalt);
  return verified ? { comment } as const : { error: "비밀번호가 일치하지 않습니다.", status: 403 } as const;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const body = cleanBody(payload?.body);
  const password = cleanPassword(payload?.password);
  if (body.length < 2) return Response.json({ error: "의견을 2자 이상 입력해 주세요." }, { status: 400 });

  try {
    const authorization = await authorizeComment(id, commentId, password);
    if ("error" in authorization) return Response.json({ error: authorization.error }, { status: authorization.status });
    const comment = await updateCommunityComment(id, commentId, body);
    if (!comment) return Response.json({ error: "댓글을 찾지 못했습니다." }, { status: 404 });
    return Response.json({ comment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to update community comment", error);
    return Response.json({ error: "댓글을 수정하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const password = cleanPassword(payload?.password);

  try {
    const authorization = await authorizeComment(id, commentId, password);
    if ("error" in authorization) return Response.json({ error: authorization.error }, { status: authorization.status });
    const deleted = await deleteCommunityComment(id, commentId);
    if (!deleted) return Response.json({ error: "댓글을 찾지 못했습니다." }, { status: 404 });
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to delete community comment", error);
    return Response.json({ error: "댓글을 삭제하지 못했습니다." }, { status: 500 });
  }
}
