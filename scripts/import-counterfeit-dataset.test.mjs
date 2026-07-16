import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceDataset,
  classifyCase,
  imageDedupeKey,
  parseCsv,
} from "./import-counterfeit-dataset.mjs";

test("CSV parser preserves quoted commas and escaped quotes", () => {
  const rows = parseCsv('\uFEFFid,title,summary\r\n1,"Miku, Snow","Logo ""missing"""\r\n');
  assert.deepEqual(rows, [{ id: "1", title: "Miku, Snow", summary: 'Logo "missing"' }]);
});

test("only approved strengths are auto candidates", () => {
  assert.equal(classifyCase({ label: "counterfeit", label_strength: "official_confirmed" }), "auto_candidate");
  assert.equal(classifyCase({ label: "counterfeit", label_strength: "side_by_side_author_asserted" }), "auto_candidate");
  assert.equal(classifyCase({ label: "counterfeit", label_strength: "author_asserted" }), "review_pending");
  assert.equal(classifyCase({ label: "uncertain", label_strength: "unreviewed_community_question" }), "excluded");
});

test("image dedupe ignores protocol and query variants", () => {
  assert.equal(
    imageDedupeKey("http://cdn.example.com/photo.jpg?size=small"),
    imageDedupeKey("https://cdn.example.com/photo.jpg?size=large"),
  );
});

test("unknown-rights images stay external and comparison-only", async () => {
  const caseRows = [{
    case_id: "NEN-T001",
    label: "counterfeit",
    label_strength: "official_confirmed",
    evidence_summary: "Official comparison",
    signal_tags: "packaging|joint",
    platform: "Good Smile Company",
    source_url: "https://example.com/case",
    published_date: "",
    retrieved_at: "2026-07-14T00:00:00Z",
    rights_status: "unknown_link_only",
    product_or_post_title: "Nendoroid Test",
  }];
  const imageRows = [
    { case_id: "NEN-T001", image_url: "http://cdn.example.com/a.jpg", image_role: "counterfeit", rights_status: "unknown_link_only" },
    { case_id: "NEN-T001", image_url: "https://cdn.example.com/a.jpg?large=1", image_role: "counterfeit_or_authentic_or_comparison", rights_status: "unknown_link_only" },
  ];
  const result = await buildEvidenceDataset({
    caseRows,
    imageRows,
    uniqueImageRows: [],
    productMap: {
      "NEN-T001": [{ productId: "nendoroid-1", productName: "Nendoroid Test", nendoroidNumber: "1" }],
    },
  });

  assert.equal(result.dataset.cases.length, 1);
  assert.equal(result.dataset.images.length, 1);
  assert.equal(result.dataset.images[0].storageUrl, null);
  assert.equal(result.dataset.images[0].sha256, null);
  assert.equal(result.dataset.images[0].perceptualHash, null);
  assert.equal(result.dataset.images[0].imageRole, "comparison");
  assert.match(result.dataset.images[0].originalUrl, /^https:/);
  assert.equal(result.report.duplicateImageReferenceCount, 1);
});

test("weak labels enter review instead of the registered dataset", async () => {
  const result = await buildEvidenceDataset({
    caseRows: [{
      case_id: "NEN-T002",
      label: "counterfeit",
      label_strength: "community_catalog_asserted",
      evidence_summary: "Community catalog",
      signal_tags: "packaging",
      platform: "Community",
      source_url: "https://example.com/community",
      published_date: "",
      retrieved_at: "2026-07-14T00:00:00Z",
      rights_status: "unknown_link_only",
      product_or_post_title: "Questionable item",
    }],
    imageRows: [],
    uniqueImageRows: [],
    productMap: {},
  });

  assert.equal(result.dataset.cases.length, 0);
  assert.equal(result.reviewQueue.cases.length, 1);
  assert.equal(result.reviewQueue.cases[0].registrationStatus, "review_pending");
});
