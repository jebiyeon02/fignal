import assert from "node:assert/strict";
import test from "node:test";

import { calculateEvaluationMetrics } from "./evaluate-authenticity-results.mjs";

test("evaluation reports counterfeit false negatives as the primary safety metric", () => {
  const metrics = calculateEvaluationMetrics([
    { groundTruth: "counterfeit", verdict: "no_obvious_risk_signals" },
    { groundTruth: "counterfeit", verdict: "counterfeit_suspected" },
    { groundTruth: "counterfeit", verdict: "needs_review" },
    { groundTruth: "authentic", verdict: "no_obvious_risk_signals" },
    { groundTruth: "authentic", verdict: "counterfeit_suspected" },
    { groundTruth: "authentic", verdict: "insufficient_photos" },
  ]);

  assert.equal(metrics.counterfeitFalseNegativeRate, 0.3333);
  assert.deepEqual(metrics.counterfeitFalseNegativeRateWilson95, { lower: 0.0615, upper: 0.7923 });
  assert.equal(metrics.counterfeitAlertRecall, 0.6667);
  assert.equal(metrics.authenticFalsePositiveRate, 0.3333);
  assert.equal(metrics.lowRiskPrecision, 0.5);
  assert.deepEqual(metrics.lowRiskPrecisionWilson95, { lower: 0.0945, upper: 0.9055 });
  assert.equal(metrics.abstentionRate, 0.1667);
});

test("evaluation rejects unknown verdicts", () => {
  assert.throws(
    () => calculateEvaluationMetrics([{ groundTruth: "authentic", verdict: "likely_authentic" }]),
    /지원하지 않는 판정/,
  );
});
