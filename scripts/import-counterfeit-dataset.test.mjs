import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCommunityMentions,
  buildEvidenceDataset,
  classifyCase,
  extractCatalogProductsFromTs,
  imageDedupeKey,
  matchCommunityProduct,
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

const catalogProducts = [
  { id: "nendoroid-1151", name: "넨도로이드 하츠네 미쿠 매지컬 미라이 2018 Ver.", englishName: "Nendoroid Hatsune Miku: Magical Mirai 2018 Ver.", number: "1151" },
  { id: "nendoroid-524", name: "넨도로이드 우마루", englishName: "Nendoroid Umaru", number: "524" },
  { id: "nendoroid-97", name: "넨도로이드 스노우 미쿠", englishName: "Nendoroid Snow Miku", number: "97" },
  { id: "nendoroid-150", name: "넨도로이드 스노우 미쿠 즐거운 눈놀이 에디션", englishName: "Nendoroid Snow Miku: Snow Playtime Edition", number: "150" },
];

test("catalog products are extracted from TypeScript object arrays", () => {
  const products = extractCatalogProductsFromTs(`
    export const expandedProducts: Product[] = [{
      id: "nendoroid-1151",
      name: "넨도로이드 하츠네 미쿠 매지컬 미라이 2018 Ver.",
      englishName: "Nendoroid Hatsune Miku: Magical Mirai 2018 Ver.",
      number: "1151",
    }];
  `);
  assert.deepEqual(products, [catalogProducts[0]]);
});

test("curated catalog arrays remain available to the dataset importer", () => {
  const products = extractCatalogProductsFromTs(`
    const curatedCatalogProducts: Product[] = [{
      id: "nendoroid-142",
      name: "넨도로이드 코우사카 키리노",
      englishName: "Nendoroid Kirino Kousaka",
      number: "142",
    }];
  `);
  assert.equal(products[0]?.id, "nendoroid-142");
});

test("community matching accepts explicit numbers and exact product names", () => {
  assert.deepEqual(
    matchCommunityProduct({ case_id: "number", product_or_post_title: "Is Nendoroid No.1151 a bootleg?" }, catalogProducts)?.product,
    catalogProducts[0],
  );
  assert.deepEqual(
    matchCommunityProduct({ case_id: "name", product_or_post_title: "Opinions on this Umaru? Real or Fake?" }, catalogProducts)?.product,
    catalogProducts[1],
  );
});

test("ambiguous numbers and loose character fragments do not attach to a product", () => {
  assert.equal(
    matchCommunityProduct({ case_id: "ambiguous", product_or_post_title: "Is Nendoroid 97 real?" }, [
      catalogProducts[2],
      { id: "nendoroid-97-variant", name: "넨도로이드 스노우 미쿠 파생판", englishName: "Nendoroid Snow Miku Variant", number: "97" },
    ]),
    null,
  );
  assert.equal(
    matchCommunityProduct({ case_id: "loose", product_or_post_title: "짭미쿠 보고가셈" }, catalogProducts),
    null,
  );
  assert.equal(
    matchCommunityProduct({ case_id: "prefix", product_or_post_title: "Help Identifying Nendoroid Levi" }, [
      { id: "nendoroid-17", name: "넨도로이드 L", englishName: "Nendoroid L", number: "17" },
    ]),
    null,
  );
  assert.equal(
    matchCommunityProduct({ case_id: "wrong-version", product_or_post_title: "Black Rock Shooter 246 Nendoroid" }, [
      { id: "nendoroid-106", name: "넨도로이드 블랙 록 슈터", englishName: "Nendoroid Black Rock Shooter", number: "106" },
    ]),
    null,
  );
  assert.equal(
    matchCommunityProduct({ case_id: "variant", product_or_post_title: "Nendoroid Hatsune Miku 15th Anniversary Ver." }, [
      { id: "nendoroid-33", name: "넨도로이드 하츠네 미쿠", englishName: "Nendoroid Hatsune Miku", number: "33" },
    ]),
    null,
  );
});

test("community mentions are sanitized and never affect the verdict", () => {
  const mentions = buildCommunityMentions([{
    case_id: "NEN-C001",
    label: "uncertain",
    label_strength: "unreviewed_community_question",
    product_or_post_title: "Opinions on this Umaru? Real or Fake? seller @private-name",
    source_url: "https://example.com/community/1",
    published_date: "2024-01-02",
    signal_tags: "packaging|price",
    image_count: "3",
    rights_status: "unknown_link_only",
  }], catalogProducts);

  assert.equal(mentions.mentions.length, 1);
  assert.equal(mentions.mentions[0].productId, "nendoroid-524");
  assert.equal(mentions.mentions[0].verdictImpact, "none");
  assert.equal(mentions.mentions[0].requiresHumanReview, true);
  assert.equal(JSON.stringify(mentions.mentions).includes("private-name"), false);
  assert.equal(mentions.mentions[0].statusLabel, "정품 여부 질문");
});
