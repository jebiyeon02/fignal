import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseCsv } from "./import-counterfeit-dataset.mjs";

const allowedGroundTruth = new Set(["authentic", "counterfeit"]);
const allowedVerdicts = new Set([
  "no_obvious_risk_signals",
  "needs_review",
  "counterfeit_suspected",
  "insufficient_photos",
]);

function rate(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(4));
}

function wilson95(numerator, denominator) {
  if (denominator === 0) return null;
  const z = 1.96;
  const proportion = numerator / denominator;
  const denominatorAdjustment = 1 + (z ** 2) / denominator;
  const center = (proportion + (z ** 2) / (2 * denominator)) / denominatorAdjustment;
  const margin = (z * Math.sqrt(
    (proportion * (1 - proportion) / denominator) + (z ** 2) / (4 * denominator ** 2),
  )) / denominatorAdjustment;
  return {
    lower: Number(Math.max(0, center - margin).toFixed(4)),
    upper: Number(Math.min(1, center + margin).toFixed(4)),
  };
}

export function calculateEvaluationMetrics(records) {
  if (!Array.isArray(records) || records.length === 0) throw new Error("평가 가능한 사례가 없습니다.");
  for (const record of records) {
    if (!allowedGroundTruth.has(record.groundTruth)) throw new Error(`지원하지 않는 정답 라벨: ${record.groundTruth}`);
    if (!allowedVerdicts.has(record.verdict)) throw new Error(`지원하지 않는 판정: ${record.verdict}`);
  }

  const authentic = records.filter((record) => record.groundTruth === "authentic");
  const counterfeit = records.filter((record) => record.groundTruth === "counterfeit");
  const lowRisk = records.filter((record) => record.verdict === "no_obvious_risk_signals");
  const counterfeitFalseNegatives = counterfeit.filter((record) => record.verdict === "no_obvious_risk_signals");
  const counterfeitAlerts = counterfeit.filter((record) => ["needs_review", "counterfeit_suspected"].includes(record.verdict));
  const authenticFalsePositives = authentic.filter((record) => record.verdict === "counterfeit_suspected");
  const abstentions = records.filter((record) => record.verdict === "insufficient_photos");
  const correctLowRisk = lowRisk.filter((record) => record.groundTruth === "authentic");

  return {
    caseCount: records.length,
    authenticCount: authentic.length,
    counterfeitCount: counterfeit.length,
    counterfeitFalseNegativeCount: counterfeitFalseNegatives.length,
    counterfeitFalseNegativeRate: rate(counterfeitFalseNegatives.length, counterfeit.length),
    counterfeitFalseNegativeRateWilson95: wilson95(counterfeitFalseNegatives.length, counterfeit.length),
    counterfeitAlertRecall: rate(counterfeitAlerts.length, counterfeit.length),
    authenticFalsePositiveRate: rate(authenticFalsePositives.length, authentic.length),
    lowRiskPrecision: rate(correctLowRisk.length, lowRisk.length),
    lowRiskPrecisionWilson95: wilson95(correctLowRisk.length, lowRisk.length),
    abstentionRate: rate(abstentions.length, records.length),
  };
}

async function readPredictions(filePath) {
  const lines = (await fs.readFile(filePath, "utf8")).split(/\r?\n/).filter((line) => line.trim());
  const predictions = new Map();
  for (const line of lines) {
    const row = JSON.parse(line);
    if (typeof row.evaluationCaseId !== "string" || !allowedVerdicts.has(row.verdict)) {
      throw new Error("예측 JSONL에는 evaluationCaseId와 유효한 verdict가 필요합니다.");
    }
    if (predictions.has(row.evaluationCaseId)) throw new Error(`중복 예측: ${row.evaluationCaseId}`);
    predictions.set(row.evaluationCaseId, row.verdict);
  }
  return predictions;
}

async function main() {
  const [casePath, predictionPath] = process.argv.slice(2);
  if (!casePath || !predictionPath) {
    throw new Error("사용법: node scripts/evaluate-authenticity-results.mjs <cases.csv> <predictions.jsonl>");
  }

  const cases = parseCsv(await fs.readFile(casePath, "utf8"));
  const predictions = await readPredictions(predictionPath);
  const eligibleCases = cases.filter((row) => row.eligible === "true" && row.split === "holdout");
  const records = eligibleCases.map((row) => {
    const verdict = predictions.get(row.evaluation_case_id);
    if (!verdict) throw new Error(`예측 누락: ${row.evaluation_case_id}`);
    return { groundTruth: row.ground_truth, verdict };
  });
  process.stdout.write(`${JSON.stringify(calculateEvaluationMetrics(records), null, 2)}\n`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
