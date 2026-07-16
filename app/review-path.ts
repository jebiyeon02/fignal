export type ReviewPath = "case_comparison" | "additional_review" | "more_photos_needed" | "unsupported";
export type ResultTone = "safe" | "caution" | "danger" | "neutral";

export const reviewPathCopy: Record<ReviewPath, {
  label: string;
  eyebrow: string;
  summary: string;
  tone: ResultTone;
}> = {
  case_comparison: {
    label: "사례 비교 완료",
    eyebrow: "비교 사례 있음",
    summary: "등록된 제품별 사례와 현재 사진의 공통점과 차이점을 비교했습니다.",
    tone: "safe",
  },
  additional_review: {
    label: "추가 검토 필요",
    eyebrow: "새로운 검증 사례",
    summary: "사진은 분석할 수 있지만 제품별 비교 사례가 없어 최종 결론을 보류합니다.",
    tone: "caution",
  },
  more_photos_needed: {
    label: "사진 추가 필요",
    eyebrow: "중요 정보 부족",
    summary: "정확한 비교에 필요한 사진이나 식별 정보를 더 확인해야 합니다.",
    tone: "neutral",
  },
  unsupported: {
    label: "지원 범위 밖",
    eyebrow: "현재 검토 어려움",
    summary: "공식 제품 정보와 기준 자료가 없어 신뢰할 수 있는 수준으로 검토하기 어렵습니다.",
    tone: "neutral",
  },
};

export function resolveReviewPath({
  supported,
  evidenceReady,
  analysisNeedsPhotos,
  hasComparisonCases,
}: {
  supported: boolean;
  evidenceReady: boolean;
  analysisNeedsPhotos: boolean;
  hasComparisonCases: boolean;
}): ReviewPath {
  if (!supported) return "unsupported";
  if (!evidenceReady || analysisNeedsPhotos) return "more_photos_needed";
  return hasComparisonCases ? "case_comparison" : "additional_review";
}
