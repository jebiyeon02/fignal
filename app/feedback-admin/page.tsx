import { ArrowLeft, Inbox, LockKeyhole, LogOut, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../brand-mark";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { feedbackAdminAccess } from "../feedback-admin-auth";
import { listSiteFeedback } from "../../db/site-feedback";
import styles from "./feedback-admin.module.css";

export const dynamic = "force-dynamic";

const contextLabels: Record<string, string> = {
  search: "제품 찾기",
  photos: "사진 확인",
  result: "판정 결과",
};

function formatFeedbackDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function FeedbackAdminPage() {
  const user = await requireChatGPTUser("/feedback-admin");
  const access = feedbackAdminAccess(user.email);

  if (!access.allowed) {
    return (
      <main className={styles.accessPage}>
        <div className={styles.accessCard}>
          <span><LockKeyhole size={22} /></span>
          <BrandMark />
          <h1>{access.configured ? "관리자 계정이 아니에요" : "관리자 설정이 필요해요"}</h1>
          <p>{access.configured ? "허용된 계정으로 다시 로그인해 주세요." : "FEEDBACK_ADMIN_EMAILS에 관리자 ChatGPT 이메일을 등록하면 이 화면에서 피드백을 확인할 수 있습니다."}</p>
          <small>현재 로그인: {user.email}</small>
          <div><Link href="/"><ArrowLeft size={15} /> 메인으로</Link><a href={chatGPTSignOutPath("/feedback-admin")}><LogOut size={15} /> 다른 계정</a></div>
        </div>
      </main>
    );
  }

  const feedback = await listSiteFeedback();

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" aria-label="FIGSIGNAL 메인"><BrandMark /></Link>
        <span>피드백 관리</span>
        <a href={chatGPTSignOutPath("/")}><LogOut size={15} /> 로그아웃</a>
      </header>

      <section className={styles.shell}>
        <header className={styles.heading}>
          <div><span>USER FEEDBACK</span><h1>받은 피드백</h1><p>메인 화면의 빠른 입력창으로 접수된 익명 의견입니다.</p></div>
          <strong><MessageSquareText size={18} /> {feedback.length}건</strong>
        </header>

        {feedback.length === 0 ? (
          <div className={styles.empty}><Inbox size={24} /><strong>아직 받은 피드백이 없어요</strong><p>새 의견이 접수되면 최신순으로 표시됩니다.</p></div>
        ) : (
          <div className={styles.list}>
            {feedback.map((item, index) => (
              <article key={item.id}>
                <span className={styles.number}>#{String(feedback.length - index).padStart(3, "0")}</span>
                <div className={styles.copy}>
                  <header><strong>{contextLabels[item.pageContext] ?? "메인 화면"}</strong><time dateTime={item.createdAt}>{formatFeedbackDate(item.createdAt)}</time></header>
                  <p>{item.message}</p>
                  <a href={item.pagePath}>접수 화면 열기 · {item.pagePath}</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
