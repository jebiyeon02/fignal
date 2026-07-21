import { env } from "cloudflare:workers";
import { getChatGPTUser } from "./chatgpt-auth";

function configuredAdminEmails() {
  const value = (env as unknown as Record<string, unknown>).FEEDBACK_ADMIN_EMAILS;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function feedbackAdminAccess(email: string) {
  const adminEmails = configuredAdminEmails();
  return {
    configured: adminEmails.length > 0,
    allowed: adminEmails.includes(email.trim().toLowerCase()),
  };
}

export async function feedbackAdminRequestAccess() {
  const user = await getChatGPTUser();
  if (!user) return { allowed: false, status: 401 as const };
  const access = feedbackAdminAccess(user.email);
  return access.allowed
    ? { allowed: true, status: 200 as const, user }
    : { allowed: false, status: 403 as const };
}
