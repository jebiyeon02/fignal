import assert from "node:assert/strict";
import test from "node:test";

import { resolveReviewPath } from "../app/review-path.ts";

test("공식 지원 제품과 충분한 사진, 비교 사례가 있으면 사례 비교 경로를 선택한다", () => {
  assert.equal(resolveReviewPath({
    supported: true,
    evidenceReady: true,
    analysisNeedsPhotos: false,
    hasComparisonCases: true,
  }), "case_comparison");
});

test("비교 사례만 없으면 추가 검토 경로를 선택한다", () => {
  assert.equal(resolveReviewPath({
    supported: true,
    evidenceReady: true,
    analysisNeedsPhotos: false,
    hasComparisonCases: false,
  }), "additional_review");
});

test("필수 사진이 부족하면 사례 유무보다 사진 보완을 우선한다", () => {
  assert.equal(resolveReviewPath({
    supported: true,
    evidenceReady: false,
    analysisNeedsPhotos: false,
    hasComparisonCases: true,
  }), "more_photos_needed");
});

test("AI가 사진을 판독하지 못하면 업로드 수와 무관하게 사진 보완을 요청한다", () => {
  assert.equal(resolveReviewPath({
    supported: true,
    evidenceReady: true,
    analysisNeedsPhotos: true,
    hasComparisonCases: true,
  }), "more_photos_needed");
});

test("공식 지원 범위 밖 제품은 다른 조건보다 지원 여부를 우선한다", () => {
  assert.equal(resolveReviewPath({
    supported: false,
    evidenceReady: true,
    analysisNeedsPhotos: false,
    hasComparisonCases: true,
  }), "unsupported");
});
