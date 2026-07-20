import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const CATALOG_INPUT = resolve(ROOT, "app/data/nendoroids-all.generated.json");
const OUTPUT = resolve(ROOT, "app/data/nendoroid-official-images.generated.json");
const TEMP_OUTPUT = `${OUTPUT}.tmp`;
const OFFICIAL_ORIGIN = "https://www.goodsmile.com";
const DEFAULT_CONCURRENCY = 4;
const isCheck = process.argv.includes("--check");
const retryUnavailable = process.argv.includes("--retry-unavailable");

function argumentValue(name) {
  const argument = process.argv.find((value) => value.startsWith(`${name}=`));
  return argument ? argument.slice(name.length + 1) : "";
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function extractOfficialProductImage(html, officialProductId) {
  const escapedProductId = officialProductId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const normalizedHtml = html.replaceAll("\\/", "/");
  const patterns = [
    new RegExp(`(?:https:\\/\\/www\\.goodsmile\\.com)?(\\/gsc-webrevo-sdk-storage-prd\\/product\\/image\\/${escapedProductId}\\/[^"'\\s<]+\\.(?:jpg|jpeg|png|webp))`, "i"),
    /["']image["']\s*:\s*["']([^"']*\/gsc-webrevo-sdk-storage-prd\/product\/image\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedHtml.match(pattern)?.[1];
    if (!match) continue;
    const decoded = decodeHtml(match);
    const imageUrl = new URL(decoded, OFFICIAL_ORIGIN).href;
    if (new URL(imageUrl).hostname === "www.goodsmile.com") return imageUrl;
  }
  return "";
}

async function fetchOfficialProduct(product) {
  const officialUrl = `${OFFICIAL_ORIGIN}/en/product/${encodeURIComponent(product.officialProductId)}`;
  try {
    const response = await fetch(officialUrl, {
      headers: { "user-agent": "figsignal-official-catalog-sync/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const image = extractOfficialProductImage(await response.text(), product.officialProductId);
    return {
      id: product.id,
      officialProductId: product.officialProductId,
      officialUrl: response.url,
      image,
      status: image ? "available" : "unavailable",
    };
  } catch {
    return {
      id: product.id,
      officialProductId: product.officialProductId,
      officialUrl,
      image: "",
      status: "unavailable",
    };
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
      completed += 1;
      if (completed % 100 === 0 || completed === items.length) {
        console.log(`Checked ${completed}/${items.length} uncached official product pages.`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function validate(catalog, records) {
  const errors = [];
  const officialProducts = catalog.filter((product) => product.officialProductId);
  const officialProductsById = new Map(officialProducts.map((product) => [product.id, product]));
  const recordIds = new Set();

  for (const record of records) {
    const product = officialProductsById.get(record.id);
    if (!product) errors.push(`${record.id}: not present in the current official product set`);
    if (recordIds.has(record.id)) errors.push(`${record.id}: duplicate record`);
    recordIds.add(record.id);
    if (product && record.officialProductId !== product.officialProductId) {
      errors.push(`${record.id}: official product id changed`);
    }
    if (!new Set(["available", "unavailable"]).has(record.status)) {
      errors.push(`${record.id}: invalid status`);
    }
    if (!record.officialUrl.startsWith(`${OFFICIAL_ORIGIN}/`)) errors.push(`${record.id}: invalid official URL`);
    if (record.image && !record.image.startsWith(`${OFFICIAL_ORIGIN}/gsc-webrevo-sdk-storage-prd/product/image/`)) {
      errors.push(`${record.id}: image is not served by the official product image storage`);
    }
    if (record.status === "available" && !record.image) errors.push(`${record.id}: available record has no image`);
  }

  const missing = officialProducts.filter((product) => !recordIds.has(product.id));
  if (missing.length) errors.push(`${missing.length} official product records are missing`);
  if (errors.length) throw new Error(`Official image catalog validation failed:\n${errors.join("\n")}`);
}

async function readExistingRecords() {
  try {
    const payload = JSON.parse(await readFile(OUTPUT, "utf8"));
    const records = Array.isArray(payload) ? payload : payload.records ?? [];
    return records.map(({ id, officialProductId, officialUrl, image, status }) => ({
      id,
      officialProductId,
      officialUrl,
      image,
      status,
    }));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function checkGeneratedCatalog() {
  const catalog = JSON.parse(await readFile(CATALOG_INPUT, "utf8"));
  const records = await readExistingRecords();
  validate(catalog, records);
  const available = records.filter((record) => record.status === "available").length;
  console.log(`Validated ${available}/${records.length} official image URLs; every product retains its catalog fallback.`);
}

async function syncOfficialImages() {
  const catalog = JSON.parse(await readFile(CATALOG_INPUT, "utf8"));
  const existingRecords = await readExistingRecords();
  const existingById = new Map(existingRecords.map((record) => [record.id, record]));
  const targets = catalog.filter((product) => product.officialProductId);
  const uncached = targets.filter((product) => {
    const existing = existingById.get(product.id);
    return !existing
      || existing.officialProductId !== product.officialProductId
      || (retryUnavailable && existing.status === "unavailable");
  });
  const limitValue = Number.parseInt(argumentValue("--limit"), 10);
  const limited = Number.isFinite(limitValue) ? uncached.slice(0, limitValue) : uncached;
  const concurrencyValue = Number.parseInt(argumentValue("--concurrency"), 10);
  const concurrency = Number.isFinite(concurrencyValue) && concurrencyValue > 0
    ? concurrencyValue
    : DEFAULT_CONCURRENCY;

  let completedSinceStart = 0;
  const currentRecords = () => targets
    .map((product) => existingById.get(product.id))
    .filter(Boolean)
    .sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }));
  const persistCheckpoint = async () => {
    await writeFile(TEMP_OUTPUT, `${JSON.stringify({ records: currentRecords() }, null, 2)}\n`);
    await rename(TEMP_OUTPUT, OUTPUT);
  };

  await mapWithConcurrency(limited, concurrency, async (product) => {
    const record = await fetchOfficialProduct(product);
    existingById.set(record.id, record);
    completedSinceStart += 1;
    if (completedSinceStart % 100 === 0) await persistCheckpoint();
    return record;
  });

  const records = currentRecords();

  if (limited.length === uncached.length) validate(catalog, records);
  await persistCheckpoint();
  const available = records.filter((record) => record.status === "available").length;
  console.log(`Wrote ${available}/${records.length} official image URLs. ${uncached.length - limited.length} uncached products remain.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await (isCheck ? checkGeneratedCatalog() : syncOfficialImages());
}
