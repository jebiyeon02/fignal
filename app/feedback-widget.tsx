"use client";

import { Check, LoaderCircle, MessageSquarePlus, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./feedback-widget.module.css";

const MAX_FEEDBACK_LENGTH = 600;

function currentFeedbackContext(pathname: string) {
  const pageContext = document.querySelector<HTMLElement>("[data-feedback-context]")?.dataset.feedbackContext;
  if (pageContext === "search" || pageContext === "photos" || pageContext === "result") return pageContext;
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/reports")) return "report";
  if (pathname.startsWith("/feedback-admin")) return "feedback_admin";
  return pathname === "/" ? "search" : "other";
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && status !== "success") textareaRef.current?.focus();
  }, [isOpen, status]);

  const close = () => {
    setIsOpen(false);
    if (status === "error") {
      setStatus("idle");
      setError("");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = message.trim();
    if (body.length < 2 || status === "submitting") return;
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body,
          pagePath: `${window.location.pathname}${window.location.search}`,
          pageContext: currentFeedbackContext(window.location.pathname),
          website: "",
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "피드백을 보내지 못했습니다.");
      setMessage("");
      setStatus("success");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "피드백을 보내지 못했습니다.");
    }
  };

  return (
    <aside className={styles.widget} aria-label="서비스 피드백">
      {!isOpen ? (
        <button className={styles.trigger} type="button" onClick={() => setIsOpen(true)} aria-expanded="false">
          <MessageSquarePlus size={17} />
          <span>피드백</span>
        </button>
      ) : (
        <div className={styles.panel}>
          <header>
            <span><MessageSquarePlus size={17} /><strong>빠른 피드백</strong></span>
            <button type="button" onClick={close} aria-label="피드백 창 닫기"><X size={16} /></button>
          </header>

          {status === "success" ? (
            <div className={styles.success} role="status">
              <span><Check size={18} /></span>
              <strong>의견을 보냈어요</strong>
              <p>확인하고 더 나은 검증 경험에 반영할게요.</p>
              <button type="button" onClick={() => setStatus("idle")}>하나 더 보내기</button>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)}>
              <label htmlFor="quick-feedback-message">불편한 점이나 필요한 기능을 알려주세요.</label>
              <textarea
                ref={textareaRef}
                id="quick-feedback-message"
                value={message}
                maxLength={MAX_FEEDBACK_LENGTH}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="예: 사진 예시가 더 크게 보이면 좋겠어요."
              />
              <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className={styles.meta}>
                <span className={status === "error" ? styles.error : ""}>{error || "익명으로 전달됩니다."}</span>
                <em>{message.length}/{MAX_FEEDBACK_LENGTH}</em>
              </div>
              <button className={styles.submit} type="submit" disabled={message.trim().length < 2 || status === "submitting"}>
                {status === "submitting" ? <LoaderCircle className={styles.spin} size={15} /> : <Send size={15} />}
                {status === "submitting" ? "보내는 중" : "보내기"}
              </button>
            </form>
          )}
        </div>
      )}
    </aside>
  );
}
