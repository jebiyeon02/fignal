import { notFound, redirect } from "next/navigation";
import { getSiteDataCounts, resetSiteData } from "../../../db/reset-site-data";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { feedbackAdminAccess } from "../../feedback-admin-auth";

export const dynamic = "force-dynamic";

export default async function DatabaseMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await requireChatGPTUser("/feedback-admin/database-maintenance");
  const access = feedbackAdminAccess(user.email);
  if (!access.configured || !access.allowed) notFound();

  const counts = await getSiteDataCounts();
  const resetComplete = (await searchParams).reset === "complete";

  async function resetProductionData() {
    "use server";

    const actionUser = await requireChatGPTUser(
      "/feedback-admin/database-maintenance",
    );
    const actionAccess = feedbackAdminAccess(actionUser.email);
    if (!actionAccess.configured || !actionAccess.allowed) notFound();

    await resetSiteData();
    redirect("/feedback-admin/database-maintenance?reset=complete");
  }

  return (
    <main style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px" }}>
      <h1>운영 DB 초기화</h1>
      {resetComplete ? <p>초기화가 완료되었습니다.</p> : null}
      <pre
        style={{
          margin: "24px 0",
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        {JSON.stringify(counts, null, 2)}
      </pre>
      <form action={resetProductionData}>
        <button
          type="submit"
          style={{
            padding: "14px 20px",
            border: 0,
            borderRadius: 10,
            color: "white",
            background: "#b42318",
            fontWeight: 700,
          }}
        >
          운영 데이터 전체 삭제
        </button>
      </form>
    </main>
  );
}
