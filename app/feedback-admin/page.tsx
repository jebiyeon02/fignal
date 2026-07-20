import { Activity, ArrowLeft, BarChart3, Inbox, LockKeyhole, LogOut, MessageSquareText, MousePointerClick, Users } from "lucide-react";
import Link from "next/link";
import { siteEventLabels, type SiteEventName } from "../analytics-contract";
import { BrandMark } from "../brand-mark";
import { expandedProducts } from "../catalog";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { feedbackAdminAccess } from "../feedback-admin-auth";
import { listSiteFeedback } from "../../db/site-feedback";
import { getSiteAnalytics } from "../../db/site-events";
import styles from "./feedback-admin.module.css";

export const dynamic = "force-dynamic";

const contextLabels: Record<string, string> = {
  search: "제품 찾기",
  photos: "사진 확인",
  result: "판정 결과",
  community: "커뮤니티",
  report: "검증 리포트",
  feedback_admin: "피드백 관리",
  other: "기타 화면",
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

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
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

  const [feedback, analytics] = await Promise.all([listSiteFeedback(), getSiteAnalytics(30)]);
  const eventCounts = new Map(analytics.eventCounts.map((item) => [item.eventName, item]));
  const eventCount = (eventName: SiteEventName) => eventCounts.get(eventName)?.count ?? 0;
  const eventSessions = (eventName: SiteEventName) => eventCounts.get(eventName)?.sessions ?? 0;
  const analysisStarted = eventCount("analysis_started");
  const analysisCompleted = eventCount("analysis_completed");
  const resultSessions = eventSessions("result_viewed");
  const sourceClickSessions = eventSessions("case_source_clicked");
  const funnelEvents: SiteEventName[] = [
    "search_performed",
    "product_selected",
    "photo_upload_started",
    "analysis_started",
    "analysis_completed",
    "result_viewed",
    "case_source_clicked",
    "report_opened",
  ];
  const funnelMax = Math.max(1, ...funnelEvents.map(eventSessions));
  const dailyMax = Math.max(1, ...analytics.daily.slice(-14).map((item) => Math.max(item.sessions, item.completed)));
  const productsById = new Map(expandedProducts.map((product) => [product.id, product]));

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" aria-label="FIGSIGNAL 메인"><BrandMark /></Link>
        <span>서비스 인사이트</span>
        <a href={chatGPTSignOutPath("/")}><LogOut size={15} /> 로그아웃</a>
      </header>

      <section className={styles.shell}>
        <section className={styles.analytics} aria-labelledby="analytics-title">
          <header className={styles.analyticsHeading}>
            <div><span>IMPLICIT FEEDBACK · 최근 30일</span><h1 id="analytics-title">사용 행동 통계</h1><p>검색어나 사진, IP를 저장하지 않고 익명 행동 흐름만 집계합니다.</p></div>
            <strong><Activity size={17} /> 이벤트 {analytics.totalEvents.toLocaleString("ko-KR")}건</strong>
          </header>

          <div className={styles.metricGrid}>
            <article><span><Users size={16} /> 익명 세션</span><strong>{analytics.uniqueSessions.toLocaleString("ko-KR")}</strong><small>24시간 단위 익명 이용 흐름</small></article>
            <article><span><BarChart3 size={16} /> 검증 완료</span><strong>{analysisCompleted.toLocaleString("ko-KR")}</strong><small>완료율 {percentage(analysisCompleted, analysisStarted)}%</small></article>
            <article><span><MousePointerClick size={16} /> 근거 확인</span><strong>{eventCount("case_source_clicked").toLocaleString("ko-KR")}</strong><small>결과 세션 대비 {percentage(sourceClickSessions, resultSessions)}%</small></article>
            <article><span><Activity size={16} /> 분석 실패</span><strong>{eventCount("analysis_failed").toLocaleString("ko-KR")}</strong><small>시작 대비 {percentage(eventCount("analysis_failed"), analysisStarted)}%</small></article>
          </div>

          <div className={styles.analyticsGrid}>
            <article className={styles.funnelCard}>
              <header><div><strong>검증 퍼널</strong><small>각 행동을 한 익명 세션 수</small></div><span>30 DAYS</span></header>
              <ol>
                {funnelEvents.map((eventName) => {
                  const sessions = eventSessions(eventName);
                  return (
                    <li key={eventName}>
                      <div><span>{siteEventLabels[eventName]}</span><strong>{sessions}</strong></div>
                      <span className={styles.funnelTrack}><i style={{ width: sessions > 0 ? `${Math.max(2, (sessions / funnelMax) * 100)}%` : "0%" }} /></span>
                    </li>
                  );
                })}
              </ol>
            </article>

            <article className={styles.dailyCard}>
              <header><div><strong>최근 이용 흐름</strong><small>최근 14일 세션과 검증 완료</small></div><span>DAILY</span></header>
              {analytics.totalEvents === 0 ? (
                <div className={styles.analyticsEmpty}>첫 행동 이벤트가 쌓이면 일별 흐름이 표시됩니다.</div>
              ) : (
                <div className={styles.dailyChart}>
                  {analytics.daily.slice(-14).map((item) => (
                    <div key={item.date} title={`${item.date} · 세션 ${item.sessions} · 완료 ${item.completed}`}>
                      <span><i style={{ height: `${Math.max(4, (item.sessions / dailyMax) * 100)}%` }} /><em style={{ height: `${Math.max(item.completed > 0 ? 4 : 0, (item.completed / dailyMax) * 100)}%` }} /></span>
                      <small>{item.date.slice(5).replace("-", "/")}</small>
                    </div>
                  ))}
                </div>
              )}
              <footer><span><i /> 익명 세션</span><span><i /> 검증 완료</span></footer>
            </article>
          </div>

          <article className={styles.productCard}>
            <header><div><strong>많이 확인한 제품</strong><small>선택부터 분석 완료, 사례 원문 확인까지 비교합니다.</small></div><span>TOP 8</span></header>
            {analytics.products.length === 0 ? (
              <div className={styles.analyticsEmpty}>아직 제품별 행동 데이터가 없습니다.</div>
            ) : (
              <div className={styles.productTable}>
                <div><span>제품</span><span>선택</span><span>분석 시작</span><span>완료</span><span>원문 클릭</span></div>
                {analytics.products.map((item) => {
                  const product = productsById.get(item.productId);
                  return <div key={item.productId}><strong>{product?.name ?? item.productId}<small>{product ? `No.${product.number}` : "직접 입력 제품"}</small></strong><span>{item.selected}</span><span>{item.started}</span><span>{item.completed}</span><span>{item.sourceClicks}</span></div>;
                })}
              </div>
            )}
          </article>
        </section>

        <header className={styles.heading}>
          <div><span>USER FEEDBACK</span><h1>받은 피드백</h1><p>서비스 모든 화면의 빠른 입력창으로 접수된 익명 의견입니다.</p></div>
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
