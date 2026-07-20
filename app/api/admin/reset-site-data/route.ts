import { getChatGPTUser } from "../../../chatgpt-auth";
import { feedbackAdminAccess } from "../../../feedback-admin-auth";
import { getSiteDataCounts, resetSiteData } from "../../../../db/reset-site-data";

const CONFIRMATION = "RESET_FIGSIGNAL_PRODUCTION_DATA";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function authorize() {
  const user = await getChatGPTUser();
  if (!user) return { error: json({ error: "authentication_required" }, 401) };

  const access = feedbackAdminAccess(user.email);
  if (!access.configured || !access.allowed) {
    return { error: json({ error: "admin_access_required" }, 403) };
  }

  return { user };
}

export async function GET() {
  const authorization = await authorize();
  if ("error" in authorization) return authorization.error;

  return json({ counts: await getSiteDataCounts() });
}

export async function POST(request: Request) {
  const authorization = await authorize();
  if ("error" in authorization) return authorization.error;

  let body: { confirm?: unknown };
  try {
    body = (await request.json()) as { confirm?: unknown };
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (body.confirm !== CONFIRMATION) {
    return json({ error: "confirmation_mismatch" }, 400);
  }

  return json(await resetSiteData());
}
