import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile("app/feedback-admin/database/page.tsx", "utf8");
const database = await readFile("db/admin-database.ts", "utf8");
const auth = await readFile("app/feedback-admin-auth.ts", "utf8");
const recordsApi = await readFile("app/api/feedback-admin/database/records/route.ts", "utf8");
const exportApi = await readFile("app/api/feedback-admin/database/export/route.ts", "utf8");

test("database admin page requires ChatGPT login and the explicit admin allowlist", () => {
  assert.match(page, /requireChatGPTUser\("\/feedback-admin\/database"\)/);
  assert.match(page, /feedbackAdminAccess\(user\.email\)/);
  assert.match(auth, /getChatGPTUser\(\)/);
  assert.match(recordsApi, /feedbackAdminRequestAccess\(\)/);
  assert.match(exportApi, /feedbackAdminRequestAccess\(\)/);
});

test("database admin exposes only fixed tables and redacted columns", () => {
  for (const table of ["verification_history", "verification_report_images", "community_posts", "community_comments", "site_feedback", "site_events"]) {
    assert.match(database, new RegExp(`"${table}"`));
  }
  const columnDefinitions = database.slice(database.indexOf("const adminTableDefinitions"), database.indexOf("function d1"));
  assert.doesNotMatch(columnDefinitions, /analysis_json|community_publish_token_hash|password_hash|password_salt|session_hash|properties_json/);
});

test("database admin requires explicit confirmation and cascades linked deletes", () => {
  assert.match(recordsApi, /confirmation !== "DELETE"/);
  assert.match(database, /DELETE FROM community_comments WHERE post_id IN/);
  assert.match(database, /DELETE FROM community_posts WHERE verification_id/);
  assert.match(database, /DELETE FROM verification_report_images WHERE verification_id/);
  assert.match(database, /deleteReportObjects/);
});

test("database CSV export uses the same fixed redacted table definition", () => {
  assert.match(exportApi, /isAdminTableKey\(table\)/);
  assert.match(exportApi, /exportAdminTableCsv\(table\)/);
  assert.match(database, /definition\.columns/);
});
