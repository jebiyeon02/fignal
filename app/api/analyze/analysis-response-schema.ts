const NO_REGISTERED_CASE_ID = "__no_registered_case__";

export const GEMINI_ANALYSIS_MAX_OUTPUT_TOKENS = 4096;

export function buildAnalysisResponseSchema(
  uploadedKeys: readonly string[],
  allowedCaseIds: readonly string[],
) {
  const uniqueUploadedKeys = [...new Set(uploadedKeys)];
  const uniqueCaseIds = [...new Set(allowedCaseIds)];

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: {
        type: "string",
        enum: ["no_obvious_risk_signals", "needs_review", "counterfeit_suspected", "insufficient_photos"],
        description: "사진 전체를 종합한 위험 신호 판정",
      },
      findings: {
        type: "array",
        minItems: uniqueUploadedKeys.length,
        maxItems: uniqueUploadedKeys.length,
        description: "업로드된 evidence_key마다 정확히 하나씩 작성한 관찰 결과",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string", enum: uniqueUploadedKeys },
            status: { type: "string", enum: ["match", "concern", "unclear"] },
            textIntegrity: {
              type: "string",
              enum: ["not_applicable", "coherent", "limited_anomaly", "garbled", "unclear"],
              description: "포장 문자 무결성. 비포장 사진에는 not_applicable 사용",
            },
            title: { type: "string" },
            reason: { type: "string" },
            visibleEvidence: { type: "string" },
            userAction: { type: "string" },
          },
          required: ["key", "status", "textIntegrity", "title", "reason", "visibleEvidence", "userAction"],
        },
      },
      caseMatches: {
        type: "array",
        minItems: 0,
        maxItems: uniqueCaseIds.length,
        description: "서버가 제공한 동일 제품 사례와 구체적으로 겹칠 때만 작성",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            caseId: {
              type: "string",
              enum: uniqueCaseIds.length > 0 ? uniqueCaseIds : [NO_REGISTERED_CASE_ID],
            },
            similarity: { type: "string", enum: ["high", "medium", "low"] },
            reason: { type: "string" },
            evidenceKeys: {
              type: "array",
              minItems: 1,
              maxItems: uniqueUploadedKeys.length,
              items: { type: "string", enum: uniqueUploadedKeys },
            },
          },
          required: ["caseId", "similarity", "reason", "evidenceKeys"],
        },
      },
    },
    required: ["verdict", "findings", "caseMatches"],
  };
}

export function buildGeminiAnalysisGenerationConfig(schema: unknown) {
  return {
    maxOutputTokens: GEMINI_ANALYSIS_MAX_OUTPUT_TOKENS,
    temperature: 0.1,
    responseFormat: {
      text: {
        mimeType: "application/json",
        schema,
      },
    },
  };
}

export function extractGeminiCandidate(payload: unknown) {
  if (!payload || typeof payload !== "object") return { text: null, finishReason: null };
  const record = payload as Record<string, unknown>;
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const firstCandidate = candidates[0];
  if (!firstCandidate || typeof firstCandidate !== "object") return { text: null, finishReason: null };

  const candidateRecord = firstCandidate as Record<string, unknown>;
  const finishReason = typeof candidateRecord.finishReason === "string" ? candidateRecord.finishReason : null;
  const content = candidateRecord.content;
  if (!content || typeof content !== "object") return { text: null, finishReason };
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return { text: null, finishReason };

  const text = parts
    .map((part) => part && typeof part === "object" ? (part as Record<string, unknown>).text : null)
    .filter((value): value is string => typeof value === "string")
    .join("");

  return { text: text || null, finishReason };
}
