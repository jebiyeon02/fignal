"use client";

import { MessageCircle, Pencil, Send, Trash2, UserRound, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { CommunityComment } from "../../community";

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseComment(value: unknown): CommunityComment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const comment = value as Record<string, unknown>;
  return typeof comment.id === "string"
    && typeof comment.postId === "string"
    && typeof comment.nickname === "string"
    && typeof comment.body === "string"
    && typeof comment.canManage === "boolean"
    && typeof comment.createdAt === "string"
    ? comment as CommunityComment
    : null;
}

type ManageMode = "edit" | "delete";

export function CommunityComments({ postId, initialComments }: {
  postId: string;
  initialComments: CommunityComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manageTarget, setManageTarget] = useState<{ id: string; mode: ManageMode } | null>(null);
  const [manageBody, setManageBody] = useState("");
  const [managePassword, setManagePassword] = useState("");
  const [manageError, setManageError] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  const closeManager = () => {
    if (isManaging) return;
    setManageTarget(null);
    setManageBody("");
    setManagePassword("");
    setManageError("");
  };

  const openManager = (comment: CommunityComment, mode: ManageMode) => {
    setManageTarget({ id: comment.id, mode });
    setManageBody(comment.body);
    setManagePassword("");
    setManageError("");
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nickname.trim().length < 2 || password.length < 4 || body.trim().length < 2 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password, body }),
      });
      const payload = await response.json().catch(() => null) as { comment?: unknown; error?: string } | null;
      const comment = parseComment(payload?.comment);
      if (!response.ok || !comment) throw new Error(payload?.error || "의견을 등록하지 못했습니다.");
      setComments((current) => [...current, comment]);
      setPassword("");
      setBody("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "의견을 등록하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manageTarget || manageTarget.mode !== "edit" || manageBody.trim().length < 2 || managePassword.length < 4 || isManaging) return;
    setIsManaging(true);
    setManageError("");
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(manageTarget.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: manageBody, password: managePassword }),
      });
      const payload = await response.json().catch(() => null) as { comment?: unknown; error?: string } | null;
      const updated = parseComment(payload?.comment);
      if (!response.ok || !updated) throw new Error(payload?.error || "댓글을 수정하지 못했습니다.");
      setComments((current) => current.map((comment) => comment.id === updated.id ? updated : comment));
      setManageTarget(null);
      setManageBody("");
      setManagePassword("");
    } catch (updateError) {
      setManageError(updateError instanceof Error ? updateError.message : "댓글을 수정하지 못했습니다.");
    } finally {
      setIsManaging(false);
    }
  };

  const removeComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manageTarget || manageTarget.mode !== "delete" || managePassword.length < 4 || isManaging) return;
    setIsManaging(true);
    setManageError("");
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(manageTarget.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: managePassword }),
      });
      const payload = await response.json().catch(() => null) as { deleted?: boolean; error?: string } | null;
      if (!response.ok || !payload?.deleted) throw new Error(payload?.error || "댓글을 삭제하지 못했습니다.");
      setComments((current) => current.filter((comment) => comment.id !== manageTarget.id));
      setManageTarget(null);
      setManagePassword("");
    } catch (deleteError) {
      setManageError(deleteError instanceof Error ? deleteError.message : "댓글을 삭제하지 못했습니다.");
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <section className="community-comments" id="community-comments" aria-labelledby="community-comments-title">
      <header>
        <span><MessageCircle size={20} /><h2 id="community-comments-title">댓글</h2></span>
      </header>

      <div className="community-comment-toolbar">
        <strong>전체 댓글 <em>{comments.length}</em>개</strong>
        <span>등록순</span>
      </div>

      {comments.length === 0 ? (
        <div className="community-comments-empty"><MessageCircle size={22} /><strong>아직 등록된 댓글이 없어요</strong></div>
      ) : (
        <div className="community-comment-list">
          {comments.map((comment) => (
            <article key={comment.id}>
              <span className="community-comment-avatar">{comment.nickname.slice(0, 1).toUpperCase()}</span>
              <div className="community-comment-copy">
                <header>
                  <strong>{comment.nickname}</strong>
                  <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                  {comment.canManage ? (
                    <span className="community-comment-actions">
                      <button type="button" onClick={() => openManager(comment, "edit")} aria-label={`${comment.nickname} 댓글 수정`}><Pencil size={12} /> 수정</button>
                      <button type="button" onClick={() => openManager(comment, "delete")} aria-label={`${comment.nickname} 댓글 삭제`}><Trash2 size={12} /> 삭제</button>
                    </span>
                  ) : null}
                </header>
                <p>{comment.body}</p>
                {manageTarget?.id === comment.id && manageTarget.mode === "edit" ? (
                  <form className="community-comment-manager" onSubmit={(event) => void updateComment(event)}>
                    <label><span>댓글</span><textarea value={manageBody} maxLength={500} onChange={(event) => setManageBody(event.target.value)} /></label>
                    <label><span>비밀번호</span><input type="password" value={managePassword} minLength={4} maxLength={64} autoComplete="current-password" onChange={(event) => setManagePassword(event.target.value)} placeholder="작성할 때 설정한 비밀번호" /></label>
                    <div><span>{manageError}</span><button type="button" onClick={closeManager}><X size={12} /> 취소</button><button type="submit" disabled={manageBody.trim().length < 2 || managePassword.length < 4 || isManaging}>{isManaging ? "저장 중" : "저장"}</button></div>
                  </form>
                ) : null}
                {manageTarget?.id === comment.id && manageTarget.mode === "delete" ? (
                  <form className="community-comment-manager delete" onSubmit={(event) => void removeComment(event)}>
                    <label><span>비밀번호</span><input type="password" value={managePassword} minLength={4} maxLength={64} autoComplete="current-password" onChange={(event) => setManagePassword(event.target.value)} placeholder="작성할 때 설정한 비밀번호" /></label>
                    <div><span>{manageError}</span><button type="button" onClick={closeManager}><X size={12} /> 취소</button><button type="submit" disabled={managePassword.length < 4 || isManaging}>{isManaging ? "삭제 중" : "삭제"}</button></div>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <form className="community-comment-form" onSubmit={(event) => void submitComment(event)}>
        <div className="community-comment-form-head"><span><UserRound size={16} /> 댓글 쓰기</span></div>
        <div className="community-comment-fields">
          <label><span>닉네임</span><input value={nickname} maxLength={20} onChange={(event) => setNickname(event.target.value)} placeholder="2~20자" /></label>
          <label><span>비밀번호</span><input type="password" value={password} minLength={4} maxLength={64} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} placeholder="수정·삭제용 4자 이상" /></label>
          <label><span>댓글</span><textarea value={body} maxLength={500} onChange={(event) => setBody(event.target.value)} placeholder="댓글을 입력해 주세요." /></label>
        </div>
        <div className="community-comment-form-footer">
          <span>{error}</span>
          <em>{body.length}/500</em>
          <button type="submit" disabled={nickname.trim().length < 2 || password.length < 4 || body.trim().length < 2 || isSubmitting}><Send size={15} /> {isSubmitting ? "등록 중" : "등록"}</button>
        </div>
      </form>
    </section>
  );
}
