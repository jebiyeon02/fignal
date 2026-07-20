import { listRecentVerificationHistory } from "../../../db/verification-history";

export async function GET(request: Request) {
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 10;

  try {
    const verifications = await listRecentVerificationHistory(limit);
    return Response.json(
      { verifications },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load verification history", error);
    return Response.json(
      { error: "최근 검증 사례를 불러오지 못했습니다." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
