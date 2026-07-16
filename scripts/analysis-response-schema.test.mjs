import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnalysisResponseSchema,
  buildGeminiAnalysisGenerationConfig,
  extractGeminiCandidate,
  GEMINI_ANALYSIS_MAX_OUTPUT_TOKENS,
} from "../app/api/analyze/analysis-response-schema.ts";

test("response schema requires exactly one finding per uploaded photo", () => {
  const schema = buildAnalysisResponseSchema(
    ["boxFront", "boxBack", "barcode", "baseMark"],
    ["case-1"],
  );

  assert.equal(schema.properties.findings.minItems, 4);
  assert.equal(schema.properties.findings.maxItems, 4);
  assert.deepEqual(schema.properties.findings.items.properties.key.enum, ["boxFront", "boxBack", "barcode", "baseMark"]);
  assert.deepEqual(schema.properties.caseMatches.items.properties.caseId.enum, ["case-1"]);
});

test("response schema asks for an empty case list without an invalid zero-item constraint", () => {
  const schema = buildAnalysisResponseSchema(["boxBack"], []);
  assert.equal("maxItems" in schema.properties.caseMatches, false);
  assert.match(schema.properties.caseMatches.description, /빈 배열/);
});

test("Gemini generation config enforces structured JSON with enough output room", () => {
  const schema = buildAnalysisResponseSchema(["boxBack"], []);
  const config = buildGeminiAnalysisGenerationConfig(schema);

  assert.equal(config.responseMimeType, "application/json");
  assert.equal(config.responseJsonSchema, schema);
  assert.equal(config.maxOutputTokens, GEMINI_ANALYSIS_MAX_OUTPUT_TOKENS);
  assert.ok(config.maxOutputTokens >= 4096);
});

test("candidate extraction exposes truncation and joins text parts", () => {
  const candidate = extractGeminiCandidate({
    candidates: [{
      finishReason: "MAX_TOKENS",
      content: { parts: [{ text: "{\"verdict\":" }, { text: "\"needs_review\"}" }] },
    }],
  });

  assert.equal(candidate.finishReason, "MAX_TOKENS");
  assert.equal(candidate.text, '{"verdict":"needs_review"}');
});
