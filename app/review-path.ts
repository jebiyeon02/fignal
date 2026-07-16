export type ReviewPath =
  | "risk_detected"
  | "case_comparison"
  | "general_analysis"
  | "additional_review"
  | "more_photos_needed"
  | "unsupported";
export type ResultTone = "safe" | "caution" | "danger" | "neutral";

export const reviewPathCopy: Record<ReviewPath, {
  label: string;
  eyebrow: string;
  summary: string;
  tone: ResultTone;
}> = {
  risk_detected: {
    label: "가품 가능성 높음",
    eyebrow: "명확한 비정상 신호 감지",
    summary: "제품별 비교 사례 유무와 관계없이 설명하기 어려운 비정상 신호가 확인됐습니다.",
    tone: "danger",
  },
  case_comparison: {
    label: "사례 비교 완료",
    eyebrow: "비교 사례 있음",
    summary: "등록된 제품별 사례와 현재 사진의 공통점과 차이점을 비교했습니다.",
    tone: "safe",
  },
  general_analysis: {
    label: "범용 사례 분석 완료",
    eyebrow: "전문가 패턴 분석",
    summary: "제품별 사례가 없어도 공식·검수 사례에서 정리한 범용 위험 패턴으로 사진을 분석했습니다.",
    tone: "safe",
  },
  additional_review: {
    label: "추가 검토 필요",
    eyebrow: "근거 충돌 또는 판본 불명",
    summary: "명확한 비정상 신호는 없지만 판본 차이 또는 서로 충돌하는 근거를 추가로 확인해야 합니다.",
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
  analysisNeedsReview,
  hasRiskSignals,
  hasComparisonCases,
}: {
  supported: boolean;
  evidenceReady: boolean;
  analysisNeedsPhotos: boolean;
  analysisNeedsReview: boolean;
  hasRiskSignals: boolean;
  hasComparisonCases: boolean;
}): ReviewPath {
  if (!supported) return "unsupported";
  if (hasRiskSignals) return "risk_detected";
  if (!evidenceReady || analysisNeedsPhotos) return "more_photos_needed";
  if (analysisNeedsReview) return "additional_review";
  return hasComparisonCases ? "case_comparison" : "general_analysis";
}
