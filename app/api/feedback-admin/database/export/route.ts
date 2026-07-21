import { exportAdminTableCsv, isAdminTableKey } from "../../../../../db/admin-database";
import { feedbackAdminRequestAccess } from "../../../../feedback-admin-auth";

export async function GET(request: Request) {
  const access = await feedbackAdminRequestAccess();
  if (!access.allowed) return Response.json({ error: "관리자 권한이 필요합니다." }, { status: access.status });

  const table = new URL(request.url).searchParams.get("table") ?? "";
  if (!isAdminTableKey(table)) return Response.json({ error: "지원하지 않는 테이블입니다." }, { status: 400 });

  try {
    const csv = await exportAdminTableCsv(table);
    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="figsignal-${table}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to export admin database table", error);
    return Response.json({ error: "CSV를 만들지 못했습니다." }, { status: 500 });
  }
}
