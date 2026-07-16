import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUT = resolve(ROOT, "app/data/nendoroids-1-500.generated.json");
const RANGES = ["000-100", "101-200", "201-300", "301-400", "401-500"];
const EXPECTED_PRODUCT_COUNT = 535;
const isCheck = process.argv.includes("--check");
const OFFICIAL_COMPATIBILITY_URL = "https://partner.goodsmile.info/support/more/english_nenmore_clip-kyuban_taiou.pdf";

// The legacy range pages omit several early limited/licensed releases. Good Smile's
// official compatibility list supplies those numbers; NendoGuide supplies the two
// later licensed releases that disappeared from the legacy range pages.
const SUPPLEMENTAL_PRODUCTS = [
  ["6", "Ouka-chan: Flying Ver."],
  ["8", "Ouka-chan: Battle Ready Ver."],
  ["13", "Lazy Saber Alter"],
  ["14", "The Melancholy of Haruhi Suzumiya: Bunny Girl Set"],
  ["27a", "Konata Izumi: Comptiq Ver."],
  ["27b", "Konata Izumi: Official Webpage Ver."],
  ["27c", "Konata Izumi: Chara-Ani Ver."],
  ["27d", "Konata Izumi: Saitama Newspaper 65th Anniversary Ver."],
  ["28a", "Kagami Hiiragi: Comptiq Ver."],
  ["28b", "Kagami Hiiragi: Official Webpage Ver."],
  ["28c", "Kagami Hiiragi: Chara-Ani Ver."],
  ["28d", "Kagami Hiiragi: Saitama Newspaper 65th Anniversary Ver."],
  ["34", "Lucky Star: Fate Cosplay Set"],
  ["35", "Joy Max"],
  ["38", "Ryofuko-chan: OVA Ver."],
  ["41", "Melissa Seraphy: Devil Ver."],
  ["47b", "Shana: Dengeki Daiou Ver."],
  ["49", "Exelica & Unit Set"],
  ["51", "Yui: DVD Ver."],
  ["54a", "Tsukasa Hiiragi: Standard Ver."],
  ["55a", "Miyuki Takara: Comptiq Ver."],
  ["56a", "Pixel Maritan: Charge! Violent Combat Ver."],
  ["73", "Nao: Mabinogi Staccato Ver."],
  ["75", "Miku Hatsune: RQ Ver."],
  ["81", "Drossel"],
  ["89", "Magical Theia"],
  ["96a", "Maritime Jiei-tan"],
  ["100", "Mickey Mouse", "2011.02 · 2018.09 재판"],
  ["109", "Racing Miku"],
  ["114b", "Reina: 2P Color Ver."],
  ["116", "Yoshika Miyafuji: Japanese Navy Swimsuit Ver."],
  ["119", "Tomo Wakutsu"],
  ["122", "Sharo"],
  ["127b", "Tomoe: 2P Color Ver."],
  ["133b", "Cattleya: 2P Color Ver."],
  ["138", "Airforce Jiei-tan"],
  ["139", "Army-san"],
  ["143b", "Risty: 2P Color Ver."],
  ["154", "Konomi Yuzuhara & Tamaki Kousaka: Dungeon Travelers Set"],
  ["155b", "Aldora: 2P Color Ver."],
  ["168b", "Airi: 2P Color Ver."],
  ["169b", "Nyx: 2P Color Ver."],
  ["172", "Racing Miku 2011 Ver."],
  ["176b", "Alleyne: 2P Color Ver."],
  ["185b", "Taiga Aisaka: Sailor Uniform Ver."],
  ["229", "Lynette Bishop: Swimsuit Ver."],
  ["232", "Minnie Mouse", "2012.06"],
  ["260", "Spider-Man: Hero's Edition", "2014.06"],
  ["284", "Iron Man Mark 7: Hero's Edition", "2013.03"],
  ["287a", "Horizon: School Uniform Ver."],
  ["349", "Iron Man Mark 42: Hero's Edition + Hall of Armor Set", "2013.12"],
  ["359", "Drossel (Charming)", "2013.11"],
  [
    "392",
    "Iron Patriot: Hero's Edition",
    "2014.05",
    "https://www.nendo.guide/nendoroids/nendoroid/iron-patriot-hero-s-edition-392/",
  ],
  ["475", "Elsa", "2015.05 · 2020.07 재판", "https://www.nendo.guide/nendoroids/nendoroid/elsa-475/"],
].map(([number, shortName, release = "공식 호환표 확인", sourceUrl = OFFICIAL_COMPATIBILITY_URL]) => ({
  id: `nendoroid-${numberId(number)}`,
  name: `넨도로이드 ${shortName}`,
  englishName: `Nendoroid ${shortName}`,
  aliases: [shortName, `Nendoroid ${shortName}`],
  number,
  maker: "Good Smile Company",
  release,
  image: new Set(["100", "232", "260", "284", "349", "359", "392", "475"]).has(number)
    ? `https://www.nendo.guide/get/image/${number}/0`
    : "",
  officialUrl: sourceUrl,
  verified: true,
}));

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function textContent(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeNumber(value) {
  const normalized = value
    .trim()
    .replace(/[ａＡ]/g, "a")
    .replace(/[ｂＢ]/g, "b")
    .replace(/\s+/g, "")
    .toLowerCase();
  return normalized.replace(/^0+(?=\d)/, "");
}

function numberId(value) {
  return normalizeNumber(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseListing(html) {
  return html
    .split('<div class="hitItem">')
    .slice(1)
    .map((block) => {
      const number = block.match(/<span class="hitNum nendoroid">\s*([^<]+)<\/span>/)?.[1];
      const title = block.match(/<span class="hitTtl">\s*<span>([\s\S]*?)<\/span>/)?.[1];
      const path = block.match(/<a href="([^"]+)"/)?.[1];
      const image = block.match(/<img[^>]+data-original="([^"]+)"/)?.[1];
      if (!number || !title || !path || !image) return null;

      const normalizedNumber = normalizeNumber(textContent(number));
      const numericPart = Number.parseInt(normalizedNumber, 10);
      if (numericPart < 1 || numericPart > 500) return null;

      return {
        number: normalizedNumber,
        englishName: textContent(title),
        officialUrl: new URL(path, "https://www.goodsmile.info").href,
        image: image.startsWith("//") ? `https:${image}` : image,
      };
    })
    .filter(Boolean);
}

function detailField(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<dt[^>]*>\\s*${escapedLabel}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, "i"));
  return textContent(match?.[1]);
}

function formatRelease(value) {
  return value.replace(/(\d{4})\/(\d{2})/g, "$1.$2") || "공식 제품 페이지 확인";
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "figsignal-catalog-sync/1.0" } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 300));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message}`);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function validate(products) {
  const errors = [];
  const ids = new Set();
  for (const product of products) {
    const numericPart = Number.parseInt(product.number, 10);
    if (numericPart < 1 || numericPart > 500) errors.push(`${product.id}: number is outside 1-500`);
    if (ids.has(product.id)) errors.push(`${product.id}: duplicate id`);
    ids.add(product.id);
    if (!product.officialUrl.startsWith("https://")) errors.push(`${product.id}: invalid source URL`);
    if (product.image && !product.image.startsWith("https://")) errors.push(`${product.id}: invalid image URL`);
    if (!product.englishName.startsWith("Nendoroid ")) errors.push(`${product.id}: invalid English name`);
  }
  if (products.length !== EXPECTED_PRODUCT_COUNT) {
    errors.push(`expected ${EXPECTED_PRODUCT_COUNT} products, found ${products.length}`);
  }
  const coveredNumbers = new Set(products.map((product) => Number.parseInt(product.number, 10)));
  const missingNumbers = Array.from({ length: 500 }, (_, index) => index + 1).filter((number) => !coveredNumbers.has(number));
  if (missingNumbers.length) errors.push(`missing base numbers: ${missingNumbers.join(", ")}`);
  if (errors.length) throw new Error(`Catalog validation failed:\n${errors.join("\n")}`);
}

async function checkGeneratedCatalog() {
  const products = JSON.parse(await readFile(OUTPUT, "utf8"));
  validate(products);
  console.log(`Validated ${products.length} official Nendoroids numbered 1-500.`);
}

async function syncCatalog() {
  const listingPages = await Promise.all(
    RANGES.map((range) => fetchText(`https://www.goodsmile.info/en/nendoroid${range}`)),
  );
  const listed = listingPages.flatMap(parseListing);
  const deduplicated = [
    ...new Map(listed.map((product) => [`${product.number}\u0000${product.englishName}`, product])).values(),
  ];

  const listedProducts = await mapWithConcurrency(deduplicated, 12, async (product) => {
    const details = await fetchText(product.officialUrl);
    const shortName = product.englishName.replace(/^Nendoroid\s+/i, "").trim();
    const series = detailField(details, "Series");
    return {
      id: `nendoroid-${numberId(product.number)}`,
      name: `넨도로이드 ${shortName}`,
      englishName: product.englishName,
      aliases: [...new Set([shortName, product.englishName, series].filter(Boolean))],
      number: product.number,
      maker: detailField(details, "Manufacturer") || "Good Smile Company",
      release: formatRelease(detailField(details, "Release Date")),
      image: product.image,
      officialUrl: product.officialUrl,
      verified: true,
    };
  });

  const products = [...listedProducts, ...SUPPLEMENTAL_PRODUCTS];
  products.sort((a, b) => Number.parseInt(a.number, 10) - Number.parseInt(b.number, 10) || a.number.localeCompare(b.number));
  validate(products);
  await writeFile(OUTPUT, `${JSON.stringify(products, null, 2)}\n`);
  console.log(`Wrote ${products.length} official Nendoroids to ${OUTPUT}.`);
}

await (isCheck ? checkGeneratedCatalog() : syncCatalog());
