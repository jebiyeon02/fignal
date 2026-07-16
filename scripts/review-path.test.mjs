import assert from "node:assert/strict";
import test from "node:test";

import { resolveReviewPath } from "../app/review-path.ts";

const baseInput = {
  supported: true,
  evidenceReady: true,
  analysisNeedsPhotos: false,
  analysisNeedsReview: false,
  hasRiskSignals: false,
  hasComparisonCases: false,
};

test("명확한 위험 신호 하나는 사진 부족과 제품별 사례 부재보다 우선한다", () => {
  assert.equal(resolveReviewPath({
    ...baseInput,
    evidenceReady: false,
    analysisNeedsPhotos: true,
    hasRiskSignals: true,
  }), "risk_detected");
});

test("제품별 사례가 없어도 범용 전문가 분석을 완료한다", () => {
  assert.equal(resolveReviewPath(baseInput), "general_analysis");
});

test("제품별 사례가 있고 위험 신호가 없으면 사례 비교 경로를 선택한다", () => {
  assert.equal(resolveReviewPath({ ...baseInput, hasComparisonCases: true }), "case_comparison");
});

test("명확한 위험은 없지만 근거가 충돌할 때만 추가 검토를 선택한다", () => {
  assert.equal(resolveReviewPath({ ...baseInput, analysisNeedsReview: true }), "additional_review");
});

test("위험 신호 없이 필수 사진이 부족하면 사진 보완을 요청한다", () => {
  assert.equal(resolveReviewPath({ ...baseInput, evidenceReady: false }), "more_photos_needed");
  assert.equal(resolveReviewPath({ ...baseInput, analysisNeedsPhotos: true }), "more_photos_needed");
});

test("공식 지원 범위 밖 제품은 다른 조건보다 지원 여부를 우선한다", () => {
  assert.equal(resolveReviewPath({ ...baseInput, supported: false, hasRiskSignals: true }), "unsupported");
});
