import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAnalysisOutput } from "../app/api/analyze/analysis-contract.ts";

const uploadedKeys = ["boxFront", "boxBack", "barcode", "baseMark"];

function finding(key, status = "match") {
  return {
    key,
    status,
    textIntegrity: ["boxFront", "boxBack", "barcode"].includes(key) ? "coherent" : "not_applicable",
    title: `${key} 확인`,
    reason: "사진에서 읽을 수 있는 범위만 확인했습니다.",
    visibleEvidence: "표기와 형태가 보입니다.",
    userAction: "원본 사진을 함께 보관하세요.",
  };
}

function output(overrides = {}) {
  return {
    verdict: "no_obvious_risk_signals",
    findings: uploadedKeys.map((key) => finding(key)),
    caseMatches: [],
    confidence: 99,
    summary: "모델이 만든 이 문장은 사용하지 않아야 합니다.",
    ...overrides,
  };
}

const context = { uploadedKeys, allowedCaseIds: ["official-case-1"] };

test("server calculates evidence completeness and replaces model claims", () => {
  const result = normalizeAnalysisOutput(output(), context);
  assert.equal(result?.verdict, "no_obvious_risk_signals");
  assert.equal(result?.evidenceCompleteness, 50);
  assert.equal(result?.summary, "제공된 사진에서 뚜렷한 가품 위험 신호는 확인되지 않았습니다.");
  assert.match(result?.caveat ?? "", /정품 보증이나 제조사 판정이 아닙니다/);
});

test("one concern forces counterfeit suspicion", () => {
  const findings = uploadedKeys.map((key) => finding(key, key === "barcode" ? "concern" : "match"));
  const result = normalizeAnalysisOutput(output({ findings }), context);
  assert.equal(result?.verdict, "counterfeit_suspected");
});

test("clearly garbled packaging text forces counterfeit suspicion", () => {
  const findings = uploadedKeys.map((key) => ({
    ...finding(key),
    ...(key === "boxBack" ? { textIntegrity: "garbled", status: "match" } : {}),
  }));
  const result = normalizeAnalysisOutput(output({ findings }), context);

  assert.equal(result?.findings.find((item) => item.key === "boxBack")?.status, "concern");
  assert.equal(result?.verdict, "counterfeit_suspected");
});

test("a clearly visible limited text anomaly still forces a high-risk verdict", () => {
  const findings = uploadedKeys.map((key) => ({
    ...finding(key),
    ...(key === "boxBack" ? { textIntegrity: "limited_anomaly" } : {}),
  }));
  const result = normalizeAnalysisOutput(output({ findings }), context);

  assert.equal(result?.verdict, "counterfeit_suspected");
});

test("an intrinsic base-mark anomaly overrides other unreadable evidence", () => {
  const findings = uploadedKeys.map((key) => ({
    ...finding(key, key === "boxBack" ? "unclear" : key === "baseMark" ? "concern" : "match"),
    ...(key === "boxBack" ? { textIntegrity: "unclear" } : {}),
    ...(key === "baseMark" ? {
      title: "받침대 각인의 무관한 테스트 문구",
      visibleEvidence: "저작권 각인 하단에 MOCK TEST DATA가 선명하게 보입니다.",
    } : {}),
  }));
  const result = normalizeAnalysisOutput(output({ verdict: "insufficient_photos", findings }), context);

  assert.equal(result?.verdict, "counterfeit_suspected");
  assert.match(result?.summary ?? "", /하나 이상의 명확한/);
});

test("unreadable essential evidence forces insufficient photos", () => {
  const findings = uploadedKeys.map((key) => ({
    ...finding(key, key === "boxBack" ? "unclear" : "match"),
    ...(key === "boxBack" ? { textIntegrity: "unclear" } : {}),
  }));
  const result = normalizeAnalysisOutput(output({ findings }), context);
  assert.equal(result?.verdict, "insufficient_photos");
  assert.equal(result?.evidenceCompleteness, 44);
});

test("counterfeit suspicion requires an observed concern", () => {
  const result = normalizeAnalysisOutput(output({ verdict: "counterfeit_suspected" }), context);
  assert.equal(result?.verdict, "needs_review");
});

test("unknown case ids and incomplete findings are rejected", () => {
  const unknownCase = output({
    caseMatches: [{
      caseId: "invented-case",
      similarity: "high",
      reason: "등록되지 않은 사례입니다.",
      evidenceKeys: ["boxFront"],
    }],
  });
  assert.equal(normalizeAnalysisOutput(unknownCase, context), null);
  assert.equal(normalizeAnalysisOutput(output({ findings: [finding("boxFront")] }), context), null);
});

test("packaging findings cannot skip text integrity inspection", () => {
  const findings = uploadedKeys.map((key) => ({
    ...finding(key),
    ...(key === "boxBack" ? { textIntegrity: "not_applicable" } : {}),
  }));
  assert.equal(normalizeAnalysisOutput(output({ findings }), context), null);
});
