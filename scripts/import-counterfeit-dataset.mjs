#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AUTO_LABELS = new Set(["official_confirmed", "side_by_side_author_asserted"]);
const REVIEW_LABELS = new Set(["community_catalog_asserted", "author_asserted"]);
const EXCLUDED_LABELS = new Set(["uncertain", "unreviewed_community_question", "community_reference"]);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultMapPath = path.join(scriptDirectory, "counterfeit-product-map.json");

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers = [], ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

export function classifyCase(row) {
  if (AUTO_LABELS.has(row.label_strength)) return "auto_candidate";
  if (REVIEW_LABELS.has(row.label_strength)) return "review_pending";
  if (EXCLUDED_LABELS.has(row.label_strength) || row.label !== "counterfeit") return "excluded";
  return "excluded";
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (!new Set(["http:", "https:"]).has(url.protocol)) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export function imageDedupeKey(value) {
  const url = normalizeUrl(value);
  if (!url) return null;
  return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "")}`;
}

function preferredImageRow(current, candidate) {
  if (!current) return candidate;
  const currentHttps = current.image_url.startsWith("https://");
  const candidateHttps = candidate.image_url.startsWith("https://");
  if (candidateHttps && !currentHttps) return candidate;
  return current;
}

function imageRoleFor(row) {
  if (
    row.image_role === "comparison"
    || row.image_role.includes("counterfeit_or_authentic")
    || row.image_role.includes("comparison")
  ) return "comparison";
  return "comparison";
}

function signalsFromTags(tags) {
  const keys = tags.split("|").filter(Boolean);
  const candidates = [
    { tags: ["packaging", "logo", "license_sticker"], evidenceKey: "boxFront", label: "패키지 구성·로고·인쇄 상태가 등록 사례와 유사함" },
    { tags: ["base", "copyright"], evidenceKey: "baseMark", label: "받침대 또는 저작권 표기가 등록 사례와 유사함" },
    { tags: ["joint", "mold", "sculpt"], evidenceKey: "parts", label: "관절·몰드·파츠 결합 구조가 등록 사례와 유사함" },
    { tags: ["paint", "finish", "gloss"], evidenceKey: "figureFull", label: "도색·표면 마감이 등록 사례와 유사함" },
    { tags: ["face", "eyes"], evidenceKey: "facePaint", label: "얼굴 인쇄·도색이 등록 사례와 유사함" },
    { tags: ["barcode", "jan"], evidenceKey: "barcode", label: "바코드·JAN 표기가 등록 사례와 유사함" },
    { tags: ["blister"], evidenceKey: "boxBack", label: "블리스터·내부 포장 구조가 등록 사례와 유사함" },
  ];

  const matched = candidates.filter((candidate) => candidate.tags.some((tag) => keys.includes(tag)));
  return (matched.length > 0 ? matched : [{ evidenceKey: "figureFull", label: "전체 외형이 등록 비교 사례와 유사함" }]).slice(0, 4);
}

function publicSummary(row) {
  if (row.label_strength === "official_confirmed") {
    return "제조사가 이 제품의 가품 유통을 공식 확인하고 정품·가품 비교 자료를 공개했습니다.";
  }
  return "작성자가 동일 제품의 정품과 가품을 나란히 비교한 사례입니다. 비교 이미지의 정품·가품 영역은 추가 검수 대상입니다.";
}

function publicTitle(row) {
  if (row.label_strength === "official_confirmed") return "제조사가 공개한 정품·가품 비교 사례";
  return "동일 제품의 정품·가품 실물 비교 사례";
}

async function validateImage(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { Accept: "image/*", "User-Agent": "FigSignalEvidenceValidator/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (response.status === 404 || response.status === 410) return { status: "broken", failureReason: `HTTP ${response.status}` };
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return { status: "access_restricted", failureReason: `HTTP ${response.status}` };
    }
    if (!response.ok) return { status: "unverified", failureReason: `HTTP ${response.status}` };
    if (contentType && !contentType.startsWith("image/")) return { status: "not_image", failureReason: contentType };
    if (!contentType) return { status: "unverified", failureReason: "content-type missing" };
    return { status: "available", failureReason: null };
  } catch (error) {
    return { status: "unverified", failureReason: error instanceof Error ? error.name : "network error" };
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function buildEvidenceDataset({ caseRows, imageRows, uniqueImageRows, productMap, checkLinks = false }) {
  const candidateIds = new Set(caseRows.map((row) => row.case_id));
  const candidateImageRows = imageRows.filter((row) => candidateIds.has(row.case_id));
  const uniqueByOriginalUrl = new Map(uniqueImageRows.map((row) => [row.image_url, row]));
  const preferredByKey = new Map();

  for (const row of candidateImageRows) {
    const dedupeKey = imageDedupeKey(row.image_url);
    if (!dedupeKey) continue;
    preferredByKey.set(dedupeKey, preferredImageRow(preferredByKey.get(dedupeKey), row));
  }

  let images = [...preferredByKey.entries()].map(([dedupeKey, row]) => {
    const unique = uniqueByOriginalUrl.get(row.image_url);
    const parsed = normalizeUrl(row.image_url);
    return {
      id: `img_${sha256(dedupeKey).slice(0, 20)}`,
      storageUrl: null,
      originalUrl: row.image_url,
      displayUrl: parsed?.protocol === "https:" ? row.image_url : null,
      imageRole: imageRoleFor(row),
      viewType: "unknown",
      sha256: null,
      perceptualHash: null,
      urlSha256: unique?.url_sha256 || sha256(row.image_url),
      dedupeKey,
      rightsStatus: row.rights_status || unique?.rights_status || "unknown",
      linkStatus: checkLinks ? "pending" : "unchecked",
      failureReason: null,
      sourceCaseIds: [...new Set(candidateImageRows.filter((candidate) => imageDedupeKey(candidate.image_url) === dedupeKey).map((candidate) => candidate.case_id))],
    };
  });

  if (checkLinks) {
    images = await mapWithConcurrency(images, 12, async (image) => {
      const result = await validateImage(image.originalUrl);
      return {
        ...image,
        displayUrl: result.status === "available" && image.originalUrl.startsWith("https://") ? image.originalUrl : null,
        linkStatus: result.status,
        failureReason: result.failureReason,
      };
    });
  }

  const imageIdsByCase = new Map();
  for (const image of images) {
    for (const caseId of image.sourceCaseIds) {
      const ids = imageIdsByCase.get(caseId) ?? [];
      ids.push(image.id);
      imageIdsByCase.set(caseId, ids);
    }
  }

  const registeredCases = [];
  const reviewQueue = [];
  const excludedReasons = new Map();

  for (const row of caseRows) {
    const classification = classifyCase(row);
    const mappedProducts = productMap[row.case_id] ?? [];
    const imageIds = imageIdsByCase.get(row.case_id) ?? [];
    const common = {
      sourceCaseId: row.case_id,
      authenticityLabel: row.label,
      confidenceLevel: row.label_strength === "official_confirmed" ? "high" : "medium",
      verificationStatus: row.label_strength,
      evidenceSummary: row.evidence_summary,
      publicTitle: publicTitle(row),
      publicSummary: publicSummary(row),
      signals: signalsFromTags(row.signal_tags),
      signalTags: row.signal_tags.split("|").filter(Boolean),
      sourceType: row.label_strength === "official_confirmed" ? "official" : "community",
      sourcePlatform: row.platform,
      sourceUrl: row.source_url,
      sourcePublishedAt: row.published_date || null,
      sourceRetrievedAt: row.retrieved_at || null,
      rightsStatus: row.rights_status,
      imageIds,
      requiresHumanReview: true,
    };

    if (classification === "auto_candidate" && mappedProducts.length > 0) {
      for (const product of mappedProducts) {
        const displayableImageCount = imageIds
          .map((id) => images.find((image) => image.id === id))
          .filter((image) => image?.displayUrl).length;
        const isNewVisibleCase = !product.existingCaseId;
        const noUsableImage = checkLinks && isNewVisibleCase && displayableImageCount === 0;
        const evidence = {
          evidenceId: `${row.case_id}:${product.productId}`,
          productId: product.productId,
          productName: product.productName,
          nendoroidNumber: product.nendoroidNumber,
          releaseVersion: null,
          manufacturer: "Good Smile Company",
          existingCaseId: product.existingCaseId ?? null,
          registrationStatus: noUsableImage ? "review_pending" : "registered",
          reviewReason: noUsableImage ? "no_verified_https_image" : null,
          ...common,
        };
        if (noUsableImage) reviewQueue.push(evidence);
        else registeredCases.push(evidence);
      }
      continue;
    }

    if (classification === "auto_candidate") {
      reviewQueue.push({
        evidenceId: row.case_id,
        productId: null,
        productName: row.product_or_post_title,
        nendoroidNumber: null,
        existingCaseId: null,
        registrationStatus: "product_mapping_required",
        reviewReason: "exact_product_mapping_missing",
        ...common,
      });
      continue;
    }

    if (classification === "review_pending") {
      reviewQueue.push({
        evidenceId: row.case_id,
        productId: null,
        productName: row.product_or_post_title,
        nendoroidNumber: null,
        existingCaseId: null,
        registrationStatus: "review_pending",
        reviewReason: "label_requires_admin_review",
        ...common,
      });
      continue;
    }

    const reason = EXCLUDED_LABELS.has(row.label_strength) ? row.label_strength : "not_eligible";
    excludedReasons.set(reason, (excludedReasons.get(reason) ?? 0) + 1);
  }

  const imageStatusCounts = Object.fromEntries(
    [...new Set(images.map((image) => image.linkStatus))].sort().map((status) => [status, images.filter((image) => image.linkStatus === status).length]),
  );
  const report = {
    schemaVersion: 1,
    inputCaseCount: caseRows.length,
    autoCandidateCaseCount: caseRows.filter((row) => classifyCase(row) === "auto_candidate").length,
    registeredEvidenceCount: registeredCases.length,
    enrichedExistingCaseCount: registeredCases.filter((row) => row.existingCaseId).length,
    newVisibleCaseCount: registeredCases.filter((row) => !row.existingCaseId).length,
    reviewPendingCount: reviewQueue.length,
    productMappingRequiredCount: reviewQueue.filter((row) => row.registrationStatus === "product_mapping_required").length,
    excludedCount: [...excludedReasons.values()].reduce((sum, count) => sum + count, 0),
    excludedReasons: Object.fromEntries(excludedReasons),
    imageReferenceCount: candidateImageRows.length,
    uniqueImageCount: images.length,
    duplicateImageReferenceCount: candidateImageRows.length - images.length,
    downloadedImageCount: 0,
    externalReferenceImageCount: images.length,
    contentSha256ComputedCount: 0,
    perceptualHashComputedCount: 0,
    hashDeferredBecauseRightsUnknownCount: images.length,
    imageStatusCounts,
    imageFailureCount: images.filter((image) => new Set(["broken", "not_image", "access_restricted"]).has(image.linkStatus)).length,
  };

  const generatedAt = caseRows.map((row) => row.retrieved_at).filter(Boolean).sort().at(-1) ?? new Date().toISOString();
  return {
    dataset: {
      schemaVersion: 1,
      generatedAt,
      sourceFiles: ["candidate_counterfeit_cases.csv", "image_manifest.csv", "unique_image_manifest.csv", "labeling_guide.md"],
      cases: registeredCases,
      images,
    },
    reviewQueue: {
      schemaVersion: 1,
      generatedAt,
      cases: reviewQueue,
    },
    report: { generatedAt, ...report },
  };
}

function parseArguments(argv) {
  const values = { checkLinks: false, write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dataset") values.dataset = argv[++index];
    else if (argument === "--out") values.out = argv[++index];
    else if (argument === "--map") values.map = argv[++index];
    else if (argument === "--check-links") values.checkLinks = true;
    else if (argument === "--write") values.write = true;
    else if (argument === "--dry-run") values.write = false;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!values.dataset) throw new Error("--dataset is required");
  values.out ??= path.resolve(scriptDirectory, "../app/data");
  values.map ??= defaultMapPath;
  return values;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const [caseText, imageText, uniqueImageText, mapText] = await Promise.all([
    readFile(path.join(options.dataset, "candidate_counterfeit_cases.csv"), "utf8"),
    readFile(path.join(options.dataset, "image_manifest.csv"), "utf8"),
    readFile(path.join(options.dataset, "unique_image_manifest.csv"), "utf8"),
    readFile(options.map, "utf8"),
  ]);
  const result = await buildEvidenceDataset({
    caseRows: parseCsv(caseText),
    imageRows: parseCsv(imageText),
    uniqueImageRows: parseCsv(uniqueImageText),
    productMap: JSON.parse(mapText),
    checkLinks: options.checkLinks,
  });

  if (options.write) {
    await mkdir(options.out, { recursive: true });
    await Promise.all([
      writeFile(path.join(options.out, "counterfeit-evidence.generated.json"), `${JSON.stringify(result.dataset, null, 2)}\n`),
      writeFile(path.join(options.out, "counterfeit-review-queue.generated.json"), `${JSON.stringify(result.reviewQueue, null, 2)}\n`),
      writeFile(path.join(options.out, "counterfeit-import-report.json"), `${JSON.stringify(result.report, null, 2)}\n`),
    ]);
  }

  console.log(JSON.stringify({ mode: options.write ? "write" : "dry-run", ...result.report }, null, 2));
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
