import {
  isAnalysisResult,
  type AnalysisResult,
  type AnalysisVerdict,
} from "./api/analyze/analysis-contract.ts";

export type VerificationHistoryItem = {
  id: string;
  productId: string;
  productName: string;
  productNumber: string;
  productMaker: string;
  productImage: string;
  productOfficialUrl: string;
  verdict: AnalysisVerdict;
  summary: string;
  evidenceCompleteness: number;
  photoCount: number;
  riskSignalCount: number;
  matchedCaseCount: number;
  analysis: AnalysisResult;
  createdAt: string;
};

const verdicts = new Set<AnalysisVerdict>([
  "no_obvious_risk_signals",
  "needs_review",
  "counterfeit_suspected",
  "insufficient_photos",
]);

export function parseVerificationHistoryItem(value: unknown): VerificationHistoryItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const verdict = typeof item.verdict === "string" ? item.verdict as AnalysisVerdict : null;
  if (!verdict || !verdicts.has(verdict) || !isAnalysisResult(item.analysis)) return null;

  const strings = [
    "id",
    "productId",
    "productName",
    "productNumber",
    "productMaker",
    "productImage",
    "productOfficialUrl",
    "summary",
    "createdAt",
  ] as const;
  if (strings.some((key) => typeof item[key] !== "string")) return null;

  const integers = [
    "evidenceCompleteness",
    "photoCount",
    "riskSignalCount",
    "matchedCaseCount",
  ] as const;
  if (integers.some((key) => !Number.isInteger(item[key]) || Number(item[key]) < 0)) return null;

  return item as VerificationHistoryItem;
}

export const verificationVerdictCopy: Record<AnalysisVerdict, { label: string; tone: string }> = {
  no_obvious_risk_signals: { label: "뚜렷한 위험 신호 미확인", tone: "safe" },
  needs_review: { label: "추가 검토 필요", tone: "caution" },
  counterfeit_suspected: { label: "가품 가능성 높음", tone: "danger" },
  insufficient_photos: { label: "사진이 더 필요함", tone: "neutral" },
};

export function sanitizeAnalysisForHistory(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    findings: analysis.findings.map((finding) => finding.key === "purchaseProof" ? {
      ...finding,
      reason: "구매내역 항목의 판정 상태만 저장했습니다.",
      visibleEvidence: "판매처, 주문번호 등 개인정보가 포함될 수 있는 내용은 저장하지 않았습니다.",
      userAction: "구매내역 원본은 사용자 기기에서만 직접 확인해 주세요.",
    } : finding),
  };
}
