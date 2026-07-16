import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUT = resolve(ROOT, "app/data/nendoroids-all.generated.json");
const API_URL = "https://gsinfoproject.com/api/searchAllData?keys=nedo&keys=series&keys=trans";
const CATALOG_URL = "https://gsinfoproject.com/ko/category";
const IMAGE_BASE_URL = "https://gsinfoproject.com/api/images/thumbnail";
const MINIMUM_PRODUCT_COUNT = 3201;
const isCheck = process.argv.includes("--check");

function normalizeNumber(value) {
  return String(value)
    .trim()
    .replace(/^0+(?=\d)/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function numberId(value) {
  return normalizeNumber(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatRelease(relPrice = []) {
  const releases = unique(
    relPrice
      .map(({ releaseDate }) => String(releaseDate ?? ""))
      .filter((value) => /^\d{6}$/.test(value))
      .map((value) => `${value.slice(0, 4)}.${value.slice(4)}`),
  ).sort();
  return releases.join(" · ") || "제품 정보 페이지 확인";
}

function seriesSlug(seriesCd = "") {
  return seriesCd.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function transform(payload) {
  const translations = payload.TRANS_DATA ?? {};
  return Object.entries(payload.PRODUCT_DATA ?? {})
    .filter(([, product]) => product.type === "NEN")
    .map(([sourceKey, product]) => {
      const number = normalizeNumber(product.num);
      const productTranslation = translations[`PRODUCT:${sourceKey}`] ?? {};
      const seriesTranslation = translations[`SERIES:${product.seriesCd}`] ?? {};
      const koreanName = productTranslation.KO || productTranslation.EN || number;
      const englishShortName = productTranslation.EN || productTranslation.KO || number;
      const koreanSeries = seriesTranslation.KO || seriesTranslation.EN || "";
      const englishSeries = seriesTranslation.EN || seriesTranslation.KO || "";

      return {
        id: `nendoroid-${numberId(number)}`,
        name: `넨도로이드 ${koreanName}`,
        englishName: `Nendoroid ${englishShortName}`,
        aliases: unique([koreanName, englishShortName, koreanSeries, englishSeries]),
        number,
        maker: "Good Smile Company",
        release: formatRelease(product.relPrice),
        image: `${IMAGE_BASE_URL}/${product.thumbnailImage}.webp`,
        officialUrl: `${CATALOG_URL}/detail?type=NEN&num=${encodeURIComponent(product.num)}`,
        verified: true,
        series: seriesSlug(product.seriesCd),
        seriesName: koreanSeries,
        englishSeriesName: englishSeries,
      };
    })
    .sort((left, right) => {
      const numberDifference = Number.parseInt(left.number, 10) - Number.parseInt(right.number, 10);
      return numberDifference || left.number.localeCompare(right.number, "en", { numeric: true });
    });
}

function validate(products) {
  const errors = [];
  const ids = new Set();
  for (const product of products) {
    if (ids.has(product.id)) errors.push(`${product.id}: duplicate id`);
    ids.add(product.id);
    if (!product.name.startsWith("넨도로이드 ")) errors.push(`${product.id}: invalid Korean name`);
    if (!product.englishName.startsWith("Nendoroid ")) errors.push(`${product.id}: invalid English name`);
    if (!product.image.startsWith(`${IMAGE_BASE_URL}/`)) errors.push(`${product.id}: invalid image URL`);
    if (!product.officialUrl.startsWith(`${CATALOG_URL}/detail?`)) errors.push(`${product.id}: invalid source URL`);
    if (!product.seriesName) errors.push(`${product.id}: missing series name`);
  }
  if (products.length < MINIMUM_PRODUCT_COUNT) {
    errors.push(`expected at least ${MINIMUM_PRODUCT_COUNT} products, found ${products.length}`);
  }
  if (!products.some((product) => product.number === "3333")) errors.push("latest known No.3333 is missing");
  if (errors.length) throw new Error(`Catalog validation failed:\n${errors.join("\n")}`);
}

async function checkGeneratedCatalog() {
  const products = JSON.parse(await readFile(OUTPUT, "utf8"));
  validate(products);
  console.log(`Validated ${products.length} GSInfo Nendoroids through No.${products.at(-1).number}.`);
}

async function syncCatalog() {
  const response = await fetch(API_URL, { headers: { "user-agent": "figsignal-catalog-sync/1.0" } });
  if (!response.ok) throw new Error(`GSInfo API failed: ${response.status} ${response.statusText}`);
  const products = transform(await response.json());
  validate(products);
  await writeFile(OUTPUT, `${JSON.stringify(products, null, 2)}\n`);
  console.log(`Wrote ${products.length} GSInfo Nendoroids through No.${products.at(-1).number}.`);
}

await (isCheck ? checkGeneratedCatalog() : syncCatalog());
