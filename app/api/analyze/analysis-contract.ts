export const evidenceKeys = [
  "boxFront",
  "boxBack",
  "barcode",
  "baseMark",
  "facePaint",
  "figureFull",
  "parts",
  "purchaseProof",
] as const;

export const essentialEvidenceKeys = [
  "boxFront",
  "boxBack",
  "barcode",
  "baseMark",
  "facePaint",
] as const;

export type EvidenceKey = (typeof evidenceKeys)[number];
export type AnalysisVerdict =
  | "no_obvious_risk_signals"
  | "needs_review"
  | "counterfeit_suspected"
  | "insufficient_photos";

export type AnalysisFinding = {
  key: EvidenceKey;
  status: "match" | "concern" | "unclear";
  textIntegrity: "not_applicable" | "coherent" | "limited_anomaly" | "garbled" | "unclear";
  title: string;
  reason: string;
  visibleEvidence: string;
  userAction: string;
};

export type AnalysisCaseMatch = {
  caseId: string;
  similarity: "high" | "medium" | "low";
  reason: string;
  evidenceKeys: EvidenceKey[];
};

export type AnalysisResult = {
  verdict: AnalysisVerdict;
  evidenceCompleteness: number;
  summary: string;
  findings: AnalysisFinding[];
  caseMatches: AnalysisCaseMatch[];
  caveat: string;
};

const evidenceKeySet = new Set<string>(evidenceKeys);
const verdictSet = new Set<string>([
  "no_obvious_risk_signals",
  "needs_review",
  "counterfeit_suspected",
  "insufficient_photos",
]);
const findingStatusSet = new Set<string>(["match", "concern", "unclear"]);
const textIntegritySet = new Set<string>([
  "not_applicable",
  "coherent",
  "limited_anomaly",
  "garbled",
  "unclear",
]);
const similaritySet = new Set<string>(["high", "medium", "low"]);
const packagingEvidenceKeySet = new Set<string>(["boxFront", "boxBack", "barcode"]);

const resultSummaries: Record<AnalysisVerdict, string> = {
  no_obvious_risk_signals: "제공된 사진에서 뚜렷한 가품 위험 신호는 확인되지 않았습니다.",
  needs_review: "명확한 비정상 신호는 없지만 판본 또는 근거가 충돌해 추가 검토가 필요합니다.",
  counterfeit_suspected: "제공된 사진에서 하나 이상의 명확한 가품 위험 신호가 관찰됐습니다.",
  insufficient_photos: "핵심 표기를 충분히 읽지 못해 위험 신호를 판단하기 어렵습니다.",
};

const fixedCaveat = "사진 기반 위험 신호 점검 결과이며 정품 보증이나 제조사 판정이 아닙니다.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength = 800) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function normalizeFinding(value: unknown, uploadedKeySet: Set<string>): AnalysisFinding | null {
  if (!isRecord(value)) return null;
  const key = typeof value.key === "string" ? value.key : "";
  const rawStatus = typeof value.status === "string" ? value.status : "";
  const textIntegrity = typeof value.textIntegrity === "string" ? value.textIntegrity : "";
  if (!evidenceKeySet.has(key) || !uploadedKeySet.has(key) || !findingStatusSet.has(rawStatus)) return null;
  if (!textIntegritySet.has(textIntegrity)) return null;
  if (packagingEvidenceKeySet.has(key) === (textIntegrity === "not_applicable")) return null;

  let status = rawStatus as AnalysisFinding["status"];
  if (textIntegrity === "limited_anomaly" || textIntegrity === "garbled") status = "concern";
  else if (textIntegrity === "unclear") status = "unclear";

  const title = boundedString(value.title, 120);
  const reason = boundedString(value.reason);
  const visibleEvidence = boundedString(value.visibleEvidence);
  const userAction = boundedString(value.userAction);
  if (!title || !reason || !visibleEvidence || !userAction) return null;

  return {
    key: key as EvidenceKey,
    status,
    textIntegrity: textIntegrity as AnalysisFinding["textIntegrity"],
    title,
    reason,
    visibleEvidence,
    userAction,
  };
}

function normalizeCaseMatch(
  value: unknown,
  uploadedKeySet: Set<string>,
  allowedCaseIdSet: Set<string>,
): AnalysisCaseMatch | null {
  if (!isRecord(value)) return null;
  const caseId = boundedString(value.caseId, 160);
  const similarity = typeof value.similarity === "string" ? value.similarity : "";
  const reason = boundedString(value.reason);
  if (!caseId || !allowedCaseIdSet.has(caseId) || !similaritySet.has(similarity) || !reason) return null;
  if (!Array.isArray(value.evidenceKeys) || value.evidenceKeys.length === 0) return null;

  const normalizedKeys = value.evidenceKeys.filter(
    (key): key is EvidenceKey => typeof key === "string" && evidenceKeySet.has(key) && uploadedKeySet.has(key),
  );
  if (normalizedKeys.length !== value.evidenceKeys.length || new Set(normalizedKeys).size !== normalizedKeys.length) return null;

  return {
    caseId,
    similarity: similarity as AnalysisCaseMatch["similarity"],
    reason,
    evidenceKeys: normalizedKeys,
  };
}

function calculateEvidenceCompleteness(findings: AnalysisFinding[]) {
  const points = findings.reduce((sum, finding) => sum + (finding.status === "unclear" ? 0.5 : 1), 0);
  return Math.round((points / evidenceKeys.length) * 100);
}

export function normalizeAnalysisOutput(
  value: unknown,
  context: { uploadedKeys: readonly EvidenceKey[]; allowedCaseIds: readonly string[] },
): AnalysisResult | null {
  if (!isRecord(value)) return null;
  const uploadedKeys = [...new Set(context.uploadedKeys)];
  const uploadedKeySet = new Set<string>(uploadedKeys);
  if (uploadedKeys.length === 0 || uploadedKeys.some((key) => !evidenceKeySet.has(key))) return null;

  const verdictValue = typeof value.verdict === "string" ? value.verdict : "";
  if (!verdictSet.has(verdictValue)) return null;
  if (!Array.isArray(value.findings) || !Array.isArray(value.caseMatches)) return null;

  const findings = value.findings.map((finding) => normalizeFinding(finding, uploadedKeySet));
  if (findings.some((finding) => finding === null)) return null;
  const normalizedFindings = findings as AnalysisFinding[];
  if (normalizedFindings.length !== uploadedKeys.length) return null;
  if (new Set(normalizedFindings.map((finding) => finding.key)).size !== uploadedKeys.length) return null;
  if (uploadedKeys.some((key) => !normalizedFindings.some((finding) => finding.key === key))) return null;

  const allowedCaseIdSet = new Set(context.allowedCaseIds);
  const caseMatches = value.caseMatches.map((match) => normalizeCaseMatch(match, uploadedKeySet, allowedCaseIdSet));
  if (caseMatches.some((match) => match === null)) return null;
  const normalizedCaseMatches = caseMatches as AnalysisCaseMatch[];
  if (new Set(normalizedCaseMatches.map((match) => match.caseId)).size !== normalizedCaseMatches.length) return null;

  let verdict = verdictValue as AnalysisVerdict;
  const concernCount = normalizedFindings.filter((finding) => finding.status === "concern").length;
  const readableEssentialCount = normalizedFindings.filter(
    (finding) => essentialEvidenceKeys.includes(finding.key as (typeof essentialEvidenceKeys)[number])
      && finding.status !== "unclear",
  ).length;

  if (concernCount > 0) verdict = "counterfeit_suspected";
  else if (readableEssentialCount < 4) verdict = "insufficient_photos";
  else if (verdict === "counterfeit_suspected" && concernCount === 0) verdict = "needs_review";

  return {
    verdict,
    evidenceCompleteness: calculateEvidenceCompleteness(normalizedFindings),
    summary: resultSummaries[verdict],
    findings: normalizedFindings,
    caseMatches: normalizedCaseMatches,
    caveat: fixedCaveat,
  };
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value)) return false;
  return verdictSet.has(typeof value.verdict === "string" ? value.verdict : "")
    && Number.isInteger(value.evidenceCompleteness)
    && Number(value.evidenceCompleteness) >= 0
    && Number(value.evidenceCompleteness) <= 100
    && typeof value.summary === "string"
    && Array.isArray(value.findings)
    && Array.isArray(value.caseMatches)
    && typeof value.caveat === "string";
}
