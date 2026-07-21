import { env } from "cloudflare:workers";

export const adminTableKeys = [
  "verification_history",
  "verification_report_images",
  "community_posts",
  "community_comments",
  "site_feedback",
  "site_events",
] as const;

export type AdminTableKey = (typeof adminTableKeys)[number];

type AdminColumn = {
  key: string;
  label: string;
};

export type AdminTableDefinition = {
  key: AdminTableKey;
  label: string;
  description: string;
  idColumn: string;
  columns: AdminColumn[];
};

const adminTableDefinitions: Record<AdminTableKey, AdminTableDefinition> = {
  verification_history: {
    key: "verification_history",
    label: "검증 기록",
    description: "AI 분석 결과와 상품별 검증 이력",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "product_name", label: "상품" },
      { key: "product_number", label: "번호" },
      { key: "product_maker", label: "제조사" },
      { key: "verdict", label: "판정" },
      { key: "evidence_completeness", label: "자료 충족도" },
      { key: "photo_count", label: "사진" },
      { key: "risk_signal_count", label: "위험 신호" },
      { key: "matched_case_count", label: "사례 일치" },
      { key: "prompt_version", label: "프롬프트" },
      { key: "created_at", label: "생성일" },
    ],
  },
  verification_report_images: {
    key: "verification_report_images",
    label: "검증 사진",
    description: "R2에 저장된 검증 사진의 메타데이터",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "verification_id", label: "검증 ID" },
      { key: "evidence_key", label: "사진 종류" },
      { key: "object_key", label: "저장 키" },
      { key: "content_type", label: "형식" },
      { key: "byte_size", label: "크기" },
      { key: "created_at", label: "생성일" },
    ],
  },
  community_posts: {
    key: "community_posts",
    label: "커뮤니티 글",
    description: "검증 결과를 공유한 커뮤니티 게시글",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "verification_id", label: "검증 ID" },
      { key: "title", label: "제목" },
      { key: "body", label: "본문" },
      { key: "status", label: "상태" },
      { key: "helpful_count", label: "도움됨" },
      { key: "created_at", label: "생성일" },
    ],
  },
  community_comments: {
    key: "community_comments",
    label: "댓글",
    description: "커뮤니티 게시글에 작성된 의견",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "post_id", label: "게시글 ID" },
      { key: "nickname", label: "닉네임" },
      { key: "body", label: "내용" },
      { key: "created_at", label: "생성일" },
    ],
  },
  site_feedback: {
    key: "site_feedback",
    label: "사용자 피드백",
    description: "서비스 화면에서 접수된 익명 의견",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "message", label: "내용" },
      { key: "page_path", label: "화면" },
      { key: "page_context", label: "맥락" },
      { key: "created_at", label: "생성일" },
    ],
  },
  site_events: {
    key: "site_events",
    label: "행동 이벤트",
    description: "최근 90일간 수집된 익명 사용 흐름",
    idColumn: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "event_name", label: "이벤트" },
      { key: "page_path", label: "화면" },
      { key: "page_context", label: "맥락" },
      { key: "product_id", label: "상품 ID" },
      { key: "verification_id", label: "검증 ID" },
      { key: "created_at", label: "생성일" },
    ],
  },
};

function d1() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable");
  return env.DB;
}

export function isAdminTableKey(value: string): value is AdminTableKey {
  return adminTableKeys.includes(value as AdminTableKey);
}

export function getAdminTableDefinition(table: AdminTableKey) {
  return adminTableDefinitions[table];
}

export function listAdminTableDefinitions() {
  return adminTableKeys.map((key) => adminTableDefinitions[key]);
}

export async function getAdminTableCounts() {
  const results = await d1().batch(
    adminTableKeys.map((table) => d1().prepare(`SELECT COUNT(*) AS count FROM ${table}`)),
  );
  return Object.fromEntries(
    adminTableKeys.map((table, index) => [
      table,
      Number((results[index].results[0] as Record<string, unknown> | undefined)?.count ?? 0),
    ]),
  ) as Record<AdminTableKey, number>;
}

export async function listAdminTableRows(table: AdminTableKey, page = 1, pageSize = 50) {
  const definition = getAdminTableDefinition(table);
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.min(Math.max(1, Math.trunc(pageSize)), 100);
  const offset = (safePage - 1) * safePageSize;
  const columns = definition.columns.map((column) => column.key).join(", ");
  const result = await d1()
    .prepare(`SELECT ${columns} FROM ${table} ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`)
    .bind(safePageSize, offset)
    .all();
  return result.results as Array<Record<string, unknown>>;
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportAdminTableCsv(table: AdminTableKey) {
  const definition = getAdminTableDefinition(table);
  const columns = definition.columns.map((column) => column.key);
  const result = await d1()
    .prepare(`SELECT ${columns.join(", ")} FROM ${table} ORDER BY created_at DESC`)
    .all();
  const lines = [
    definition.columns.map((column) => csvCell(column.label)).join(","),
    ...(result.results as Array<Record<string, unknown>>).map((row) =>
      columns.map((column) => csvCell(row[column])).join(","),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

function cleanRecordId(value: unknown) {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id && id.length <= 200 ? id : null;
}

async function deleteReportObjects(objectKeys: string[]) {
  if (objectKeys.length === 0) return;
  const bucket = (env as unknown as { REPORT_IMAGES?: R2Bucket }).REPORT_IMAGES;
  if (!bucket) throw new Error("Cloudflare R2 binding `REPORT_IMAGES` is unavailable");
  await bucket.delete(objectKeys);
}

async function cleanUpReportObjects(objectKeys: string[]) {
  try {
    await deleteReportObjects(objectKeys);
  } catch (error) {
    console.error("Failed to clean up deleted verification report objects", error);
  }
}

export async function deleteAdminRecord(table: AdminTableKey, rawId: unknown) {
  const id = cleanRecordId(rawId);
  if (!id) return false;
  const database = d1();

  if (table === "verification_history") {
    const imageRows = await database
      .prepare("SELECT object_key FROM verification_report_images WHERE verification_id = ?1")
      .bind(id)
      .all();
    const objectKeys = (imageRows.results as Array<Record<string, unknown>>)
      .map((row) => String(row.object_key ?? ""))
      .filter(Boolean);
    const result = await database.batch([
      database.prepare("DELETE FROM community_comments WHERE post_id IN (SELECT id FROM community_posts WHERE verification_id = ?1)").bind(id),
      database.prepare("DELETE FROM community_posts WHERE verification_id = ?1").bind(id),
      database.prepare("DELETE FROM verification_report_images WHERE verification_id = ?1").bind(id),
      database.prepare("DELETE FROM verification_history WHERE id = ?1").bind(id),
    ]);
    const deleted = Number(result[3].meta.changes ?? 0) > 0;
    if (deleted) await cleanUpReportObjects(objectKeys);
    return deleted;
  }

  if (table === "verification_report_images") {
    if (!/^\d+$/.test(id)) return false;
    const [row] = (await database
      .prepare("SELECT object_key FROM verification_report_images WHERE id = ?1")
      .bind(Number(id))
      .all()).results as Array<Record<string, unknown>>;
    if (!row) return false;
    const result = await database.prepare("DELETE FROM verification_report_images WHERE id = ?1").bind(Number(id)).run();
    if (Number(result.meta.changes ?? 0) > 0) await cleanUpReportObjects([String(row.object_key)]);
    return Number(result.meta.changes ?? 0) > 0;
  }

  if (table === "community_posts") {
    const result = await database.batch([
      database.prepare("DELETE FROM community_comments WHERE post_id = ?1").bind(id),
      database.prepare("DELETE FROM community_posts WHERE id = ?1").bind(id),
    ]);
    return Number(result[1].meta.changes ?? 0) > 0;
  }

  const definition = getAdminTableDefinition(table);
  const result = await database
    .prepare(`DELETE FROM ${table} WHERE ${definition.idColumn} = ?1`)
    .bind(id)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}
