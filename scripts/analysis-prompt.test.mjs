import assert from "node:assert/strict";
import test from "node:test";

import {
  analysisPromptVersion,
  buildNendoroidAnalysisPrompt,
  evidenceRoleInspectionInstructions,
  expertCalibrationExamples,
  expertDecisionInstructions,
  expertEvidenceHierarchyInstructions,
  expertFinalAuditInstructions,
  officialCasePatternInstructions,
  packagingTextInspectionInstructions,
} from "../app/api/analyze/analysis-prompt.ts";

test("packaging prompt inspects body text even when copied headings look normal", () => {
  assert.match(packagingTextInspectionInstructions, /로고와 제품명만 확인하지 말고/);
  assert.match(packagingTextInspectionInstructions, /정상인 짧은 표기와 깨진 긴 본문/);
  assert.match(packagingTextInspectionInstructions, /경고·주의·법적 고지/);
  assert.match(packagingTextInspectionInstructions, /다국어 안내/);
});

test("packaging prompt separates unreadable photos from printed gibberish", () => {
  assert.match(packagingTextInspectionInstructions, /OCR이 실패한 경우/);
  assert.match(packagingTextInspectionInstructions, /status=unclear/);
  assert.match(packagingTextInspectionInstructions, /status=concern/);
  assert.match(packagingTextInspectionInstructions, /textIntegrity=garbled/);
  assert.match(packagingTextInspectionInstructions, /counterfeit_suspected/);
});

test("analysis prompt keeps the packaging safety rules and output contract", () => {
  const prompt = buildNendoroidAnalysisPrompt("도메인 지식", { required: ["verdict"] });

  assert.match(prompt, /도메인 지식/);
  assert.ok(prompt.includes(packagingTextInspectionInstructions));
  assert.match(prompt, /내부 판정 기준 전체나 공식 정답 문자열 전체는 공개하지 마세요/);
  assert.match(prompt, /출력 JSON 구조:.*verdict/);
});

test("expert prompt carries the collected cross-product inspection knowledge", () => {
  const prompt = buildNendoroidAnalysisPrompt("도메인 지식", { required: ["verdict"] });

  assert.match(prompt, new RegExp(analysisPromptVersion.replaceAll(".", "\\.")));
  assert.ok(prompt.includes(expertEvidenceHierarchyInstructions));
  assert.ok(prompt.includes(evidenceRoleInspectionInstructions));
  assert.ok(prompt.includes(officialCasePatternInstructions));
  assert.match(prompt, /부품 수·분할·조립 순서/);
  assert.match(prompt, /나사·자석·핀/);
  assert.match(prompt, /MOCK, TEST, SAMPLE, DATA/);
  assert.match(prompt, /정상 공정 편차/);
});

test("expert prompt makes one clear anomaly decisive without a product case", () => {
  assert.match(expertDecisionInstructions, /명확한 비정상 신호가 하나라도/);
  assert.match(expertDecisionInstructions, /등록 사례가 0건이어도 verdict=counterfeit_suspected/);
  assert.match(expertDecisionInstructions, /concern이 하나라도 있으면 다른 사진이 흐리거나/);
  assert.match(expertDecisionInstructions, /제품별 사례가 없다는 이유만으로 needs_review/);
});

test("expert prompt calibrates weak models with positive and negative examples", () => {
  assert.match(expertCalibrationExamples, /MOCK TEST DATA/);
  assert.match(expertCalibrationExamples, /MADE IN CHINA/);
  assert.match(expertCalibrationExamples, /작은 도색 편차/);
  assert.match(expertCalibrationExamples, /정상 로고가 우려 신호를 상쇄하지 않으며/);
  assert.match(expertFinalAuditInstructions, /concern 개수가 1개 이상이면 verdict가 반드시 counterfeit_suspected/);
  assert.match(expertFinalAuditInstructions, /제품별 사례 부재.*낮추지 마세요/);
});
