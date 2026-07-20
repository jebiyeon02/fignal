import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "app/page.tsx",
  "app/community/page.tsx",
  "app/community/[id]/page.tsx",
  "app/reports/[id]/page.tsx",
];

const decorativeEnglishHeadings = [
  "FIGURE CHECK",
  "RECENT CHECKS",
  "AUTHENTICITY STANDARD",
  "VERIFICATION CASE BOARD",
  "VERIFICATION COMMUNITY POST",
  "VERIFICATION RESULT",
  "VERIFICATION REPORT",
];

test("화면 위계용 영문 소제목을 노출하지 않는다", async () => {
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const source = sources.join("\n");

  for (const heading of decorativeEnglishHeadings) {
    assert.equal(source.includes(heading), false, `${heading} 문구가 남아 있습니다.`);
  }

  assert.equal(source.includes("FIGSIGNAL"), true, "서비스 로고는 유지해야 합니다.");
});
