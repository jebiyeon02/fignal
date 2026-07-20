import { env } from "cloudflare:workers";

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
