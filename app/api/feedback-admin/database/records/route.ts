import { deleteAdminRecord, isAdminTableKey } from "../../../../../db/admin-database";
import { feedbackAdminRequestAccess } from "../../../../feedback-admin-auth";

export async function DELETE(request: Request) {
  const access = await feedbackAdminRequestAccess();
  if (!access.allowed) return Response.json({ error: "관리자 권한이 필요합니다." }, { status: access.status });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const table = typeof payload?.table === "string" ? payload.table : "";
  if (!isAdminTableKey(table)) return Response.json({ error: "지원하지 않는 테이블입니다." }, { status: 400 });
  if (payload?.confirmation !== "DELETE") return Response.json({ error: "삭제 확인이 필요합니다." }, { status: 400 });

  try {
    const deleted = await deleteAdminRecord(table, payload?.id);
    if (!deleted) return Response.json({ error: "삭제할 레코드를 찾지 못했습니다." }, { status: 404 });
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to delete admin database record", error);
    return Response.json({ error: "레코드를 삭제하지 못했습니다." }, { status: 500 });
  }
}
