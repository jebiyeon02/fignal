const MAX_FILES = 8;
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 6;

const evidenceKeys = [
  "boxFront",
  "boxBack",
  "barcode",
  "baseMark",
  "facePaint",
  "figureFull",
  "parts",
  "purchaseProof",
] as const;

type EvidenceKey = (typeof evidenceKeys)[number];

type ProductPayload = {
  id: string;
  name: string;
  englishName: string;
  number: string;
  maker: string;
  image: string;
  officialUrl: string;
  verified: boolean;
};

type CasePayload = {
  id: string;
  title: string;
  summary: string;
  images: string[];
  signals: Array<{ evidenceKey: EvidenceKey; label: string }>;
};

type OpenAIContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "high" | "low" };

const requestLog = new Map<string, number[]>();

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

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
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

async function fileToDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return `data:${file.type};base64,${btoa(binary)}`;
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  if (!Array.isArray(record.output)) return null;

  for (const item of record.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return jsonError("잠시 후 다시 분석해 주세요.", 429, "RATE_LIMITED");
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("AI 분석 연결이 아직 준비되지 않았습니다.", 503, "AI_NOT_CONFIGURED");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("사진 요청을 읽지 못했습니다.", 400, "INVALID_FORM");
  }

  const product = safeParse<ProductPayload>(formData.get("product"));
  const cases = safeParse<CasePayload[]>(formData.get("cases")) ?? [];
  if (!product?.name || !product.number || !product.maker) {
    return jsonError("제품 정보가 올바르지 않습니다.", 400, "INVALID_PRODUCT");
  }

  const uploaded: Array<{ key: EvidenceKey; file: File }> = [];
  let totalBytes = 0;
  for (const key of evidenceKeys) {
    const value = formData.get(`evidence:${key}`);
    if (!(value instanceof File) || value.size === 0) continue;
    if (!value.type.startsWith("image/")) {
      return jsonError("이미지 파일만 분석할 수 있습니다.", 400, "INVALID_FILE_TYPE");
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

  const content: OpenAIContent[] = [
    {
      type: "input_text",
      text: [
        `검증 대상: ${product.name} (${product.englishName || product.name})`,
        `제품번호: ${product.number}`,
        `제조사: ${product.maker}`,
        `공식 카탈로그 등록 여부: ${product.verified ? "등록됨" : "직접 입력"}`,
        "아래에는 공식 참고 이미지, 알려진 가품 사례, 사용자가 올린 증거 사진이 순서대로 제공됩니다.",
      ].join("\n"),
    },
  ];

  if (product.image && isHttpUrl(product.image)) {
    content.push({ type: "input_text", text: "[공식 참고 이미지] 제품 전체 외형 참고용. 패키지 정답 이미지로 간주하지 마세요." });
    content.push({ type: "input_image", image_url: product.image, detail: "high" });
  }

  for (const counterfeitCase of cases.slice(0, 3)) {
    content.push({
      type: "input_text",
      text: `[알려진 가품 사례 ${counterfeitCase.id}] ${counterfeitCase.title}\n${counterfeitCase.summary}\n특징: ${counterfeitCase.signals.map((signal) => signal.label).join(", ")}`,
    });
    for (const image of counterfeitCase.images.filter(isHttpUrl).slice(0, 2)) {
      content.push({ type: "input_image", image_url: image, detail: "high" });
    }
  }

  for (const item of uploaded) {
    content.push({ type: "input_text", text: `[사용자 증거 사진] evidence_key=${item.key}` });
    content.push({ type: "input_image", image_url: await fileToDataUrl(item.file), detail: "high" });
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: { type: "string", enum: ["likely_authentic", "needs_review", "counterfeit_suspected", "insufficient_photos"] },
      confidence: { type: "integer", minimum: 0, maximum: 100 },
      summary: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string", enum: evidenceKeys },
            status: { type: "string", enum: ["match", "concern", "unclear"] },
            title: { type: "string" },
            reason: { type: "string" },
            visibleEvidence: { type: "string" },
            userAction: { type: "string" },
          },
          required: ["key", "status", "title", "reason", "visibleEvidence", "userAction"],
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
      caveat: { type: "string" },
    },
    required: ["verdict", "confidence", "summary", "findings", "caseMatches", "caveat"],
  };

  const prompt = [
    "당신은 중고 넨도로이드 거래 사진을 점검하는 보수적인 시각 검수 보조자입니다.",
    "정품을 보증하거나 단정하지 말고, 사진에 실제로 보이는 근거만 한국어로 짧고 구체적으로 설명하세요.",
    "공식 제품 이미지는 전체 외형 참고용이며 박스 뒷면, 바코드, 받침대 각인의 정답으로 추측하지 마세요.",
    "가품 사례 이미지와 시각적으로 겹치는 특징이 있을 때만 caseMatches에 넣으세요.",
    "보이지 않거나 해상도가 부족한 글자, 로고, JAN, 각인은 status=unclear로 처리하고 재촬영 방법을 userAction에 적으세요.",
    "사진마다 해당 evidence_key로 findings를 정확히 하나씩 만들고, 업로드되지 않은 key는 만들지 마세요.",
    "한 장의 일반 제품 사진만으로 정품 가능성 높음을 주지 마세요. 핵심 표기 사진이 부족하면 insufficient_photos를 선택하세요.",
    "confidence는 정품 확률이 아니라 이번 판정의 자료 충족도입니다.",
  ].join("\n");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        store: false,
        max_output_tokens: 1800,
        input: [
          { role: "system", content: [{ type: "input_text", text: prompt }] },
          { role: "user", content },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "figure_authenticity_screening",
            strict: true,
            schema,
          },
        },
      }),
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
    const upstreamCode = typeof errorRecord?.code === "string" ? errorRecord.code : "";
    if (upstream.status === 401 || upstreamCode === "invalid_api_key") {
      return jsonError("AI 분석 연결 정보를 확인해 주세요.", 503, "AI_AUTH_FAILED");
    }
    if (upstream.status === 429) {
      return jsonError("AI 요청이 많습니다. 잠시 후 다시 시도해 주세요.", 429, "AI_BUSY");
    }
    return jsonError("AI가 사진을 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.", 502, "AI_ANALYSIS_FAILED");
  }

  const outputText = extractOutputText(upstreamPayload);
  if (!outputText) {
    return jsonError("AI 분석 결과를 읽지 못했습니다.", 502, "EMPTY_AI_RESULT");
  }

  try {
    const analysis = JSON.parse(outputText) as unknown;
    return Response.json(
      { analysis },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError("AI 분석 결과 형식이 올바르지 않습니다.", 502, "INVALID_AI_RESULT");
  }
}
