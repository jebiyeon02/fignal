import { env } from "cloudflare:workers";

import { expandedProducts } from "../../catalog";
import { counterfeitCases } from "../../counterfeit-cases";
import { getProductVerificationNotes } from "../../product-verification";
import {
  essentialEvidenceKeys,
  evidenceKeys,
  normalizeAnalysisOutput,
  type EvidenceKey,
} from "./analysis-contract";
import { buildNendoroidAnalysisPrompt } from "./analysis-prompt";
import { nendoroidAnalysisDomainKnowledge } from "./domain-knowledge";

const MAX_FILES = 8;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 6;

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type ProductPayload = {
  id: string;
};

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const requestLog = new Map<string, number[]>();

function runtimeVariable(key: string) {
  const binding = (env as unknown as Record<string, unknown>)[key];
  if (typeof binding === "string" && binding.trim()) return binding.trim();
  return process.env[key]?.trim() ?? "";
}

function jsonError(message: string, status: number, code: string) {
  return Response.json(
    { error: message, code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function safeParse<T>(value: FormDataEntryValue | null): T | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = clientAddress(request);
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_REQUESTS) {
    requestLog.set(key, recent);
    return true;
  }
  requestLog.set(key, [...recent, now]);
  return false;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function fileToGeminiPart(file: File): Promise<GeminiPart> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    inlineData: {
      mimeType: file.type,
      data: bytesToBase64(bytes),
    },
  };
}

function extractGeminiOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const firstCandidate = candidates[0];
  if (!firstCandidate || typeof firstCandidate !== "object") return null;
  const content = (firstCandidate as Record<string, unknown>).content;
  if (!content || typeof content !== "object") return null;
  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((part) => part && typeof part === "object" ? (part as Record<string, unknown>).text : null)
    .filter((value): value is string => typeof value === "string")
    .join("");
  return text || null;
}

function parseGeminiJson(text: string) {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced) as unknown;
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("JSON object not found");
    return JSON.parse(unfenced.slice(start, end + 1)) as unknown;
  }
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return jsonError("잠시 후 다시 분석해 주세요.", 429, "RATE_LIMITED");
  }

  const apiKey = runtimeVariable("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonError("AI 분석 연결이 아직 준비되지 않았습니다.", 503, "AI_NOT_CONFIGURED");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("사진 요청을 읽지 못했습니다.", 400, "INVALID_FORM");
  }

  const productRequest = safeParse<ProductPayload>(formData.get("product"));
  const product = expandedProducts.find((candidate) => candidate.id === productRequest?.id && candidate.verified);
  if (!product) {
    return jsonError("제품 정보가 올바르지 않습니다.", 400, "INVALID_PRODUCT");
  }
  const cases = counterfeitCases
    .filter((counterfeitCase) => counterfeitCase.productId === product.id && counterfeitCase.verdictImpact !== "none")
    .slice(0, 3);

  const uploaded: Array<{ key: EvidenceKey; file: File }> = [];
  let totalBytes = 0;
  for (const key of evidenceKeys) {
    const value = formData.get(`evidence:${key}`);
    if (!(value instanceof File) || value.size === 0) continue;
    if (!supportedImageTypes.has(value.type.toLowerCase())) {
      return jsonError("JPG, PNG, WEBP, HEIC 사진만 분석할 수 있습니다.", 400, "INVALID_FILE_TYPE");
    }
    if (value.size > MAX_FILE_BYTES) {
      return jsonError("사진 한 장은 6MB 이하로 올려주세요.", 413, "FILE_TOO_LARGE");
    }
    totalBytes += value.size;
    uploaded.push({ key, file: value });
  }

  if (uploaded.length === 0) {
    return jsonError("분석할 사진을 한 장 이상 올려주세요.", 400, "NO_IMAGES");
  }
  if (uploaded.length > MAX_FILES || totalBytes > MAX_TOTAL_BYTES) {
    return jsonError("한 번에 올릴 수 있는 사진 용량을 초과했습니다.", 413, "PAYLOAD_TOO_LARGE");
  }
  const uploadedKeySet = new Set(uploaded.map((item) => item.key));
  const essentialUploadCount = essentialEvidenceKeys.filter((key) => uploadedKeySet.has(key)).length;
  if (essentialUploadCount < 4) {
    return jsonError("박스, 바코드, 각인, 얼굴 중 핵심 사진을 4장 이상 올려주세요.", 400, "INSUFFICIENT_EVIDENCE");
  }

  const content: GeminiPart[] = [
    {
      text: [
        `검증 대상: ${product.name} (${product.englishName || product.name})`,
        `제품번호: ${product.number}`,
        `작품: ${[product.seriesName, product.englishSeriesName].filter(Boolean).join(" / ") || "미확인"}`,
        `제조사: ${product.maker}`,
        "공식 카탈로그 등록 여부: 등록됨",
        ...(getProductVerificationNotes(product).length
          ? [`제품별 확인 메모:\n- ${getProductVerificationNotes(product).join("\n- ")}`]
          : []),
        "아래에는 서버에서 선택한 알려진 가품 특징과 사용자가 올린 증거 사진이 제공됩니다.",
        "외부 참고 이미지는 권리 확인 전이므로 이 분석에 제공되지 않습니다.",
      ].join("\n"),
    },
  ];

  for (const counterfeitCase of cases) {
    content.push({
      text: [
        `[알려진 가품 사례 ${counterfeitCase.id}] ${counterfeitCase.title}`,
        `증빙 ID: ${counterfeitCase.evidenceIds?.join(", ") || "기존 검수 자료"}`,
        `출처: ${counterfeitCase.sourceName ?? "등록 자료"} (${counterfeitCase.sourceType ?? "출처 유형 미표기"})`,
        `검수 상태: ${counterfeitCase.verificationStatus ?? "기존 검수 완료"}`,
        counterfeitCase.summary,
        `특징: ${counterfeitCase.signals.map((signal) => signal.label).join(", ")}`,
      ].join("\n"),
    });
  }

  for (const item of uploaded) {
    content.push({ text: `[사용자 증거 사진] evidence_key=${item.key}` });
    content.push(await fileToGeminiPart(item.file));
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: { type: "string", enum: ["no_obvious_risk_signals", "needs_review", "counterfeit_suspected", "insufficient_photos"] },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string", enum: evidenceKeys },
            status: { type: "string", enum: ["match", "concern", "unclear"] },
            textIntegrity: { type: "string", enum: ["not_applicable", "coherent", "limited_anomaly", "garbled", "unclear"] },
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
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            caseId: { type: "string" },
            similarity: { type: "string", enum: ["high", "medium", "low"] },
            reason: { type: "string" },
            evidenceKeys: { type: "array", items: { type: "string", enum: evidenceKeys } },
          },
          required: ["caseId", "similarity", "reason", "evidenceKeys"],
        },
      },
    },
    required: ["verdict", "findings", "caseMatches"],
  };

  const prompt = buildNendoroidAnalysisPrompt(nendoroidAnalysisDomainKnowledge, schema);

  let upstream: Response;
  try {
    const model = runtimeVariable("GEMINI_MODEL") || "gemini-3.1-flash-lite";
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ role: "user", parts: content }],
        generationConfig: {
          maxOutputTokens: 1400,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return jsonError("AI 분석 서버에 연결하지 못했습니다.", 502, "UPSTREAM_UNREACHABLE");
  }

  const upstreamPayload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const upstreamRecord = upstreamPayload && typeof upstreamPayload === "object"
      ? upstreamPayload as Record<string, unknown>
      : null;
    const errorRecord = upstreamRecord?.error && typeof upstreamRecord.error === "object"
      ? upstreamRecord.error as Record<string, unknown>
      : null;
    const upstreamStatus = typeof errorRecord?.status === "string" ? errorRecord.status : "";
    const upstreamMessage = typeof errorRecord?.message === "string" ? errorRecord.message : "";
    if (
      upstream.status === 401
      || upstream.status === 403
      || upstreamStatus === "PERMISSION_DENIED"
      || /api key not valid|API_KEY_INVALID/i.test(upstreamMessage)
    ) {
      return jsonError("AI 분석 연결 정보를 확인해 주세요.", 503, "AI_AUTH_FAILED");
    }
    if (upstream.status === 429) {
      return jsonError("AI 요청이 많습니다. 잠시 후 다시 시도해 주세요.", 429, "AI_BUSY");
    }
    return jsonError("AI가 사진을 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.", 502, "AI_ANALYSIS_FAILED");
  }

  const outputText = extractGeminiOutputText(upstreamPayload);
  if (!outputText) {
    return jsonError("AI 분석 결과를 읽지 못했습니다.", 502, "EMPTY_AI_RESULT");
  }

  try {
    const parsedAnalysis = parseGeminiJson(outputText);
    const analysis = normalizeAnalysisOutput(parsedAnalysis, {
      uploadedKeys: uploaded.map((item) => item.key),
      allowedCaseIds: cases.map((counterfeitCase) => counterfeitCase.id),
    });
    if (!analysis) throw new Error("Invalid analysis contract");
    return Response.json(
      { analysis },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError("AI 분석 결과 형식이 올바르지 않습니다.", 502, "INVALID_AI_RESULT");
  }
}
