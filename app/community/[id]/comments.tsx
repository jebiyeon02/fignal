"use client";

import { MessageCircle, Send, UserRound } from "lucide-react";
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
    && typeof comment.createdAt === "string"
    ? comment as CommunityComment
    : null;
}

export function CommunityComments({ postId, initialComments }: {
  postId: string;
  initialComments: CommunityComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nickname.trim().length < 2 || body.trim().length < 2 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, body }),
      });
      const payload = await response.json().catch(() => null) as { comment?: unknown; error?: string } | null;
      const comment = parseComment(payload?.comment);
      if (!response.ok || !comment) throw new Error(payload?.error || "의견을 등록하지 못했습니다.");
      setComments((current) => [...current, comment]);
      setBody("");
      setIsSubmitting(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "의견을 등록하지 못했습니다.");
      setIsSubmitting(false);
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
        <div className="community-comments-empty"><MessageCircle size={22} /><strong>아직 등록된 댓글이 없어요</strong><p>이 검증 결과에서 놓친 부분이나 판본 정보를 첫 번째로 남겨주세요.</p></div>
      ) : (
        <div className="community-comment-list">
          {comments.map((comment, index) => (
            <article key={comment.id}>
              <span className="community-comment-avatar">{comment.nickname.slice(0, 1).toUpperCase()}</span>
              <div className="community-comment-copy">
                <header>
                  <strong>{comment.nickname}</strong>
                  <span className="community-comment-number">#{String(index + 1).padStart(2, "0")}</span>
                  <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                </header>
                <p>{comment.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <form className="community-comment-form" onSubmit={(event) => void submitComment(event)}>
        <div className="community-comment-form-head"><span><UserRound size={16} /> 댓글 쓰기</span><small>로그인 없이 작성할 수 있어요</small></div>
        <div className="community-comment-fields">
          <label><span>닉네임</span><input value={nickname} maxLength={20} onChange={(event) => setNickname(event.target.value)} placeholder="2~20자" /></label>
          <label><span>댓글</span><textarea value={body} maxLength={500} onChange={(event) => setBody(event.target.value)} placeholder="예: 이 제품은 재판판에서 박스 씰 위치가 달라진 것으로 알고 있어요. 받침대 각인 사진도 확인해 보면 좋겠습니다." /></label>
        </div>
        <div className="community-comment-form-footer">
          <span>{error || "판매자 개인정보나 단정적인 비방은 작성하지 마세요."}</span>
          <em>{body.length}/500</em>
          <button type="submit" disabled={nickname.trim().length < 2 || body.trim().length < 2 || isSubmitting}><Send size={15} /> {isSubmitting ? "등록 중" : "등록"}</button>
        </div>
      </form>
    </section>
  );
}
