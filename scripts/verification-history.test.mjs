import assert from "node:assert/strict";
import test from "node:test";

import {
  parseVerificationHistoryItem,
  sanitizeAnalysisForHistory,
} from "../app/verification-history.ts";

const analysis = {
  verdict: "no_obvious_risk_signals",
  evidenceCompleteness: 63,
  summary: "제공된 사진에서 뚜렷한 가품 위험 신호는 확인되지 않았습니다.",
  findings: [],
  caseMatches: [],
  caveat: "사진 기반 위험 신호 점검 결과이며 정품 보증이나 제조사 판정이 아닙니다.",
};

function historyItem(overrides = {}) {
  return {
    id: "verification-1",
    productId: "nendoroid-1528",
    productName: "넨도로이드 고죠 사토루",
    productNumber: "1528",
    productMaker: "Good Smile Company",
    productImage: "https://example.com/product.jpg",
    productOfficialUrl: "https://example.com/product",
    verdict: "no_obvious_risk_signals",
    summary: analysis.summary,
    evidenceCompleteness: 63,
    photoCount: 5,
    riskSignalCount: 0,
    matchedCaseCount: 0,
    analysis,
    createdAt: "2026-07-17T03:00:00.000Z",
    ...overrides,
  };
}

test("recent verification history accepts a complete non-identifying result", () => {
  assert.deepEqual(parseVerificationHistoryItem(historyItem()), historyItem());
});

test("recent verification history rejects unknown verdicts and malformed analysis", () => {
  assert.equal(parseVerificationHistoryItem(historyItem({ verdict: "authentic" })), null);
  assert.equal(parseVerificationHistoryItem(historyItem({ analysis: null })), null);
});

test("recent verification history rejects negative counts", () => {
  assert.equal(parseVerificationHistoryItem(historyItem({ riskSignalCount: -1 })), null);
});

test("purchase proof details are redacted before history persistence", () => {
  const purchaseProof = {
    key: "purchaseProof",
    status: "match",
    textIntegrity: "not_applicable",
    title: "구매내역",
    reason: "홍길동의 주문번호 1234를 확인했습니다.",
    visibleEvidence: "seller@example.com에서 구매했습니다.",
    userAction: "주문번호를 다시 확인하세요.",
  };
  const sanitized = sanitizeAnalysisForHistory({ ...analysis, findings: [purchaseProof] });

  assert.equal(sanitized.findings[0].status, "match");
  assert.doesNotMatch(JSON.stringify(sanitized), /홍길동|1234|seller@example\.com/);
  assert.match(sanitized.findings[0].visibleEvidence, /저장하지 않았습니다/);
});
