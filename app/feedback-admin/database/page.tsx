import { ArrowLeft, ChevronLeft, ChevronRight, Database, Download, LockKeyhole, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../../brand-mark";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import { feedbackAdminAccess } from "../../feedback-admin-auth";
import {
  getAdminTableCounts,
  getAdminTableDefinition,
  isAdminTableKey,
  listAdminTableDefinitions,
  listAdminTableRows,
  type AdminTableKey,
} from "../../../db/admin-database";
import { DeleteRecordButton } from "./delete-record-button";
import styles from "./database.module.css";

export const dynamic = "force-dynamic";

function displayValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return <span className={styles.emptyValue}>—</span>;
  if (key === "byte_size") return `${Math.max(0, Number(value) / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 1 })} KB`;
  if (key === "evidence_completeness") return `${value}%`;
  if (key === "created_at") {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }
  return String(value);
}

function pageHref(table: AdminTableKey, page: number) {
  return `/feedback-admin/database?table=${encodeURIComponent(table)}&page=${page}`;
}

export default async function FeedbackAdminDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; page?: string }>;
}) {
  const user = await requireChatGPTUser("/feedback-admin/database");
  const access = feedbackAdminAccess(user.email);

  if (!access.allowed) {
    return (
      <main className={styles.accessPage}>
        <div className={styles.accessCard}>
          <span><LockKeyhole size={22} /></span>
          <BrandMark />
          <h1>{access.configured ? "관리자 계정이 아니에요" : "관리자 설정이 필요해요"}</h1>
          <p>{access.configured ? "허용된 계정으로 다시 로그인해 주세요." : "관리자 이메일을 등록해야 데이터베이스를 관리할 수 있습니다."}</p>
          <small>현재 로그인: {user.email}</small>
          <div><Link href="/"><ArrowLeft size={15} /> 메인으로</Link><a href={chatGPTSignOutPath("/feedback-admin/database")}><LogOut size={15} /> 다른 계정</a></div>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const table: AdminTableKey = isAdminTableKey(params.table ?? "") ? params.table as AdminTableKey : "verification_history";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const definitions = listAdminTableDefinitions();
  const [counts, rows] = await Promise.all([
    getAdminTableCounts(),
    listAdminTableRows(table, currentPage),
  ]);
  const definition = getAdminTableDefinition(table);
  const totalPages = Math.max(1, Math.ceil(counts[table] / 50));

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" aria-label="FIGSIGNAL 메인"><BrandMark /></Link>
        <nav><Link href="/feedback-admin">서비스 인사이트</Link><strong>데이터베이스</strong></nav>
        <a href={chatGPTSignOutPath("/")}><LogOut size={15} /> 로그아웃</a>
      </header>

      <section className={styles.shell}>
        <header className={styles.heading}>
          <div><span>ADMIN DATABASE</span><h1>운영 데이터 관리</h1><p>민감한 인증값을 제외한 운영 데이터를 조회하고 필요한 레코드만 정리할 수 있습니다.</p></div>
          <strong><Database size={18} /> D1</strong>
        </header>

        <aside className={styles.warning}>
          <ShieldAlert size={18} />
          <div><strong>삭제한 데이터는 복구할 수 없습니다.</strong><p>검증 기록이나 커뮤니티 글을 삭제하면 연결된 댓글과 사진도 함께 정리됩니다. 먼저 CSV를 내려받아 보관하는 것을 권장합니다.</p></div>
        </aside>

        <nav className={styles.tableCards} aria-label="데이터베이스 테이블">
          {definitions.map((item) => (
            <Link key={item.key} href={pageHref(item.key, 1)} className={item.key === table ? styles.activeCard : undefined}>
              <span>{item.label}</span><strong>{counts[item.key].toLocaleString("ko-KR")}</strong><small>{item.description}</small>
            </Link>
          ))}
        </nav>

        <section className={styles.dataSection} aria-labelledby="database-table-title">
          <header className={styles.dataHeading}>
            <div><span>{definition.key}</span><h2 id="database-table-title">{definition.label}</h2><p>{definition.description} · 최신순 50개씩 표시</p></div>
            <a href={`/api/feedback-admin/database/export?table=${encodeURIComponent(table)}`}><Download size={14} /> CSV 내보내기</a>
          </header>

          {rows.length === 0 ? (
            <div className={styles.noRows}><Database size={22} /><strong>저장된 레코드가 없습니다.</strong></div>
          ) : (
            <div className={styles.tableScroll}>
              <table>
                <thead><tr>{definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>관리</th></tr></thead>
                <tbody>
                  {rows.map((row) => {
                    const recordId = String(row[definition.idColumn]);
                    return (
                      <tr key={recordId}>
                        {definition.columns.map((column) => {
                          const value = displayValue(row[column.key], column.key);
                          return <td key={column.key} title={typeof value === "string" ? value : undefined}><span>{value}</span></td>;
                        })}
                        <td><DeleteRecordButton table={table} tableLabel={definition.label} recordId={recordId} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className={styles.pagination}>
            <span>전체 {counts[table].toLocaleString("ko-KR")}개 · {currentPage}/{totalPages} 페이지</span>
            <div>
              {currentPage > 1 ? <Link href={pageHref(table, currentPage - 1)}><ChevronLeft size={14} /> 이전</Link> : <span><ChevronLeft size={14} /> 이전</span>}
              {currentPage < totalPages ? <Link href={pageHref(table, currentPage + 1)}>다음 <ChevronRight size={14} /></Link> : <span>다음 <ChevronRight size={14} /></span>}
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}
