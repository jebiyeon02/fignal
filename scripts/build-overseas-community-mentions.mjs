#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "app/data/overseas-community-mentions.generated.json");
const catalogs = [
  JSON.parse(await readFile(path.join(rootDir, "app/data/nendoroids-1-500.generated.json"), "utf8")),
  JSON.parse(await readFile(path.join(rootDir, "app/data/nendoroids-catalog.generated.json"), "utf8")),
];
const products = new Map(catalogs.flat().map((product) => [product.id, product]));

const question = (sourceCaseId, productIds, publicTitle, sourceUrl, sourcePublishedAt, signalTags = ["packaging"], imageReferenceCount = 0) => ({
  sourceCaseId,
  productIds,
  status: "unverified_question",
  statusLabel: "정가품 질문",
  publicTitle,
  publicSummary: "해당 제품의 정품 여부나 알려진 가품 존재 여부를 묻는 해외 커뮤니티 원문입니다. 게시물의 결론은 별도로 검증되지 않았습니다.",
  sourceUrl,
  sourcePublishedAt,
  sourceName: "Reddit",
  signalTags,
  imageReferenceCount,
});

const comparison = (sourceCaseId, productIds, publicTitle, publicSummary, sourceUrl, sourcePublishedAt, sourceName, signalTags, imageReferenceCount = 0) => ({
  sourceCaseId,
  productIds,
  status: "community_reference",
  statusLabel: "정·가품 비교",
  publicTitle,
  publicSummary,
  sourceUrl,
  sourcePublishedAt,
  sourceName,
  signalTags,
  imageReferenceCount,
});

const asserted = (sourceCaseId, productIds, publicTitle, publicSummary, sourceUrl, sourcePublishedAt, signalTags = ["packaging"], imageReferenceCount = 0) => ({
  sourceCaseId,
  productIds,
  status: "author_asserted",
  statusLabel: "작성자 경험",
  publicTitle,
  publicSummary,
  sourceUrl,
  sourcePublishedAt,
  sourceName: "Reddit",
  signalTags,
  imageReferenceCount,
});

const sources = [
  comparison("MFC-BLOG-46327", ["nendoroid-642"], "알베도 정품·가품 실물 비교", "박스 인쇄와 로고, 얼굴 마감, 날개, 받침대와 스탠드 구조를 판본 차이와 함께 비교한 글입니다.", "https://myfigurecollection.net/blogpost/46327", null, "MyFigureCollection", ["packaging", "logo", "paint", "face", "base", "copyright"]),
  comparison("MFC-BLOG-57000", ["nendoroid-1067"], "No.1067 리무루 정품·가품 실물 비교", "로고와 바코드가 일부 복제된 가품을 박스, 얼굴 인쇄, 목 구조, 전용 소품과 받침대로 비교한 글입니다.", "https://myfigurecollection.net/blogpost/57000", null, "MyFigureCollection", ["packaging", "logo", "barcode", "face", "joint", "base"], 5),
  comparison("MFC-BLOG-49139", ["nendoroid-1069"], "어둠의 유희 가품 상세 관찰", "무박스 가품의 얼굴 비율, 머리 내부, 목 핀, 몸통 결합과 전용 소품 차이를 정리한 글입니다.", "https://myfigurecollection.net/blogpost/49139", null, "MyFigureCollection", ["face", "mold", "joint", "paint"]),
  comparison("MFC-BLOG-48785", ["nendoroid-380"], "Snow Miku 2014 정품·가품 비교", "형상 방향, 진주광·투명 재질, 파츠 결합과 책 모양 받침대, 박스 구조의 차이를 비교한 글입니다.", "https://myfigurecollection.net/blogpost/48785", null, "MyFigureCollection", ["packaging", "paint", "mold", "joint", "base"]),
  comparison("MFC-BLOG-19122", ["nendoroid-411"], "No.411 아리 정품·가품 비교", "무광 마감과 비교적 양호한 얼굴 인쇄를 가진 가품에서 머리 구조, 파츠 결합, 투명 이펙트와 꼬리 차이를 정리한 글입니다.", "https://myfigurecollection.net/blogpost/19122", null, "MyFigureCollection", ["face", "paint", "mold", "joint", "base"]),

  question("NEN-00247", ["nendoroid-751"], "에밀리아 넨도로이드 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/142c5ri/is_this_emilia_nendoroid_a_bootleg/", "2023-06-06", ["packaging", "copyright"], 2),
  question("NEN-00241", ["nendoroid-553"], "무쥬라의 가면 링크 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/13fv678/zelda_majoras_mask_nendoroid_real_or_bootleg/", "2023-05-12", ["copyright", "joint"], 5),
  comparison("NEN-00145", ["nendoroid-701"], "Snow Miku 2017 정품·가품 비교", "정품과 AliExpress 가품을 나란히 비교하며 외형이 비슷해도 품질 차이가 있다는 점을 사진으로 공유한 글입니다.", "https://www.reddit.com/r/Nendoroid/comments/sx3x0e/comparison_of_the_real_2017_snow_miku_and_an/", "2022-02-20", "Reddit", ["paint", "mold", "face"], 1),
  asserted("NEN-00188", ["nendoroid-1067"], "리무루 가품 수령 경험", "작성자가 리무루 제품을 가품으로 판단해 수령 경험과 사진을 공유한 글입니다. 제조사 판정은 아닙니다.", "https://www.reddit.com/r/Nendoroid/comments/x8lxhq/it_happenedbootleg_rimuru/", "2022-09-08", ["packaging", "paint"], 2),
  question("NEN-00178", ["nendoroid-1604"], "이데아 슈라우드 가품 여부 질문", "https://www.reddit.com/r/Nendoroid/comments/wftjx2/bootleg_idia/", "2022-08-04", ["packaging", "copyright", "paint", "joint"], 8),
  question("NEN-00304", ["nendoroid-1939"], "하츠네 미쿠 15주년 Ver. 주의 사례", "https://www.reddit.com/r/Nendoroid/comments/17kt8av/warning_photos_15th_anniversary_miku/", "2023-10-31", ["packaging", "paint"], 3),
  question("NEN-00167", ["nendoroid-1160"], "야가미 라이토 2.0 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/vhpi7k/light_yagami_20_unsure_if_real_or_fake/", "2022-06-21", ["packaging"], 1),
  question("NEN-00333", ["nendoroid-395"], "요시노 중고 구매 후 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/1abhrmn/just_opened_the_yoshino_nendo_i_got_from_ebay_and/", "2024-01-26", ["packaging", "paint"], 2),
  question("NEN-00406", ["nendoroid-1560"], "덴지 넨도로이드 진위 의심 사례", "https://www.reddit.com/r/Nendoroid/comments/1fqjc6j/ive_got_some_suspicions_about_the_chainsaw_man/", "2024-09-27", ["packaging", "paint"], 2),
  question("NEN-00258", ["nendoroid-1939"], "하츠네 미쿠 15주년 Ver. 가품 존재 질문", "https://www.reddit.com/r/Nendoroid/comments/14q4s6w/hello_everyone_i_was_wondering_if_yall_could_help/", "2023-07-04", ["price"], 2),
  question("NEN-00271", ["nendoroid-1519"], "루시아 AliExpress 판매 제품 질문", "https://www.reddit.com/r/Nendoroid/comments/15me1l9/lucia_nendoroid_on_aliexpress/", "2023-08-09", ["price"], 2),
  question("NEN-00411", ["nendoroid-733"], "브레스 오브 더 와일드 링크 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/1g5f8li/really_suspicious_about_the_link_botw_nendoroid_i/", "2024-10-17", ["packaging", "price"], 2),
  question("NEN-00121", ["nendoroid-563"], "오이카와 토오루 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/it2st0/is_my_oikawa_toru_nendoroid_real_or_a_fake/", "2020-09-15", ["packaging", "paint", "joint"], 1),
  question("NEN-00139", ["nendoroid-50"], "세이버 라이온 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/q9eimx/can_anyone_confirm_for_me_if_this_saber_lion/", "2021-10-16", ["base"], 1),
  question("NEN-00140", ["nendoroid-1535"], "징크스 구매 전 정품 여부 질문", "https://www.reddit.com/r/Nendoroid/comments/r3c5lp/trying_to_get_jinx_nendo_for_secret_santa_new_to/", "2021-11-27"),
  question("NEN-00296", ["nendoroid-447"], "No.447 솔리드 스네이크 가품 존재 질문", "https://www.reddit.com/r/Nendoroid/comments/16ucn1u/is_there_any_biotleg_447_solid_snake/", "2023-09-28", ["price"]),
  question("NEN-00297", ["nendoroid-1291"], "퍼플 하트 가품 여부 질문", "https://www.reddit.com/r/Nendoroid/comments/16wxhvk/purple_heart_fake/", "2023-10-01", ["price"]),
  question("NEN-00282", ["nendoroid-1657"], "사라시나 루카 가품 존재 질문", "https://www.reddit.com/r/Nendoroid/comments/15zyyxd/is_there_a_bootleg_of_ruka_sarashina_from_rent_a/", "2023-08-24", ["price"]),

  question("REDDIT-mnaw16", ["nendoroid-189"], "카가미네 린 Cheerful Ver. 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/mnaw16/can_someone_verify_if_this_is_a_knockoffbootleg/", null),
  question("REDDIT-nw4fhg", ["nendoroid-425"], "레드 넨도로이드 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/nw4fhg/is_this_red_nendoroid_original_or_a_bootleg/", null),
  comparison("REDDIT-17nmzyj", ["nendoroid-2069"], "고토 히토리 정품·가품 비교", "고토 히토리 정품과 가품을 여러 장의 사진으로 비교한 해외 커뮤니티 글입니다.", "https://www.reddit.com/r/BocchiTheRock/comments/17nmzyj/bocchi_the_fake_a_comparison_between_genuine_and/", null, "Reddit", ["packaging", "paint", "face", "joint"]),
  asserted("REDDIT-1jfouhg", ["nendoroid-2077"], "나츠키 가품 공유 사례", "작성자가 DDLC 나츠키 제품을 가품으로 소개한 게시물입니다. 제조사나 독립 검수자가 확인한 판정은 아닙니다.", "https://www.reddit.com/r/DDLC/comments/1jfouhg/natsuki_bootleg_nendoroid/", null, ["packaging", "paint"]),
  asserted("REDDIT-qh8jeb", ["nendoroid-567"], "마르스 가품 수령 경험", "작성자가 마르스 제품을 가품으로 판단해 구매 경험을 공유한 게시물입니다.", "https://www.reddit.com/r/fireemblem/comments/qh8jeb/got_me_a_counterfeit_marth_nendoroid/", null, ["packaging", "paint"]),
  question("REDDIT-iu5gja", ["nendoroid-725"], "메구밍 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/iu5gja/is_this_megumin_authentic/", null),
  comparison("REDDIT-175amlz", ["nendoroid-631"], "아인즈 울 고운 정품·가품 비교", "아인즈 넨도로이드의 정품과 가품을 비교한 해외 커뮤니티 원문입니다.", "https://www.reddit.com/r/AnimeFigures/comments/175amlz/real_and_fake_ainz_nendoriod_comparison/", null, "Reddit", ["packaging", "paint", "mold", "joint"]),
  question("REDDIT-n4k6bt", ["nendoroid-1112", "nendoroid-1194"], "토도로키·네즈코 정품·가품 비교 경험", "https://www.reddit.com/r/Nendoroid/comments/n4k6bt/bootleg_vs_official_todoroki_so_glad_i_was_able/", null, ["packaging", "paint", "face", "joint"]),
  question("REDDIT-rom6mu", ["nendoroid-537"], "N 넨도로이드 박스·설명서 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/rom6mu/my_friend_bought_an_n_and_reshiram_nendoroid_on/", null, ["packaging", "logo"]),
  question("REDDIT-1jr0u9b", ["nendoroid-17", "nendoroid-18"], "L·아마네 미사 가품 여부 질문", "https://www.reddit.com/r/deathnote/comments/1jr0u9b/are_these_bootleg_l_and_misa_nenodroids/", null, ["packaging", "paint"]),
  question("REDDIT-14hw7vd", ["nendoroid-1620"], "말레우스 커스텀용 가품 파츠 질문", "https://www.reddit.com/r/Nendoroid/comments/14hw7vd/is_there_a_place_where_i_can_get_just_the_hair/", null, ["paint", "mold"]),
  asserted("REDDIT-fuqb6o", ["nendoroid-663"], "렘 가품 공유 사례", "작성자가 렘 제품을 가품으로 소개하며 외형 사진을 공유한 게시물입니다.", "https://www.reddit.com/r/Nendoroid/comments/fuqb6o/rem_is_out_to_get_you_can_you_tell_this_is_a_fake/", null, ["paint", "face"]),
  question("REDDIT-oycrgi", ["nendoroid-106"], "블랙 록 슈터 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/oycrgi/is_this_brs_nendo_legit_or_a_bootleg_currently/", null, ["packaging", "paint"]),
  asserted("REDDIT-1slolrj", ["nendoroid-2337"], "레온 중고 매물 가품 주장", "작성자가 중고 거래 플랫폼의 레온 매물을 비정품으로 판단해 공유한 글입니다.", "https://www.reddit.com/r/Nendoroid/comments/1slolrj/unauthentic_leon_on_mercari/", null, ["packaging", "price"]),
  question("REDDIT-19di317", ["nendoroid-2284"], "오모리 넨도로이드 진위 질문", "https://www.reddit.com/r/OMORI/comments/19di317/ik_this_isnt_exactly_omori_contestish_but_ive/", null, ["packaging", "paint"]),
  question("REDDIT-1akxpyh", ["nendoroid-2069"], "고토 히토리 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/1akxpyh/bocchi_nendoroid/", null, ["packaging"]),
  asserted("REDDIT-1tlixdc", ["nendoroid-2890"], "카사네 테토 2.0 가품 공유", "작성자가 카사네 테토 2.0의 가품 사례를 공유한 게시물입니다.", "https://www.reddit.com/r/KasaneTeto/comments/1tlixdc/teto_20_newnendoroid_bootleg/", null, ["packaging", "paint"]),
  question("REDDIT-1k09x2p", ["nendoroid-1883"], "커비 30주년 Edition 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/1k09x2p/kirby_30th_nendoroid_unsure_if_its_official/", null, ["packaging"]),
  question("REDDIT-lwf3zb", ["nendoroid-718"], "카무이 박스·로고 진위 질문", "https://www.reddit.com/r/Nendoroid/comments/lwf3zb/question_about_corrin_kamui_i_bought_this_for/", null, ["packaging", "logo", "copyright"]),
];

const mentions = sources.flatMap((source) => source.productIds.map((productId) => {
  const product = products.get(productId);
  if (!product) throw new Error(`Unknown product id: ${productId}`);
  return {
    mentionId: `overseas-${source.sourceCaseId.toLowerCase()}-${productId}`,
    sourceCaseId: source.sourceCaseId,
    productId,
    productName: product.name,
    nendoroidNumber: product.number,
    status: source.status,
    statusLabel: source.statusLabel,
    publicTitle: source.publicTitle,
    publicSummary: source.publicSummary,
    sourceUrl: source.sourceUrl,
    sourcePublishedAt: source.sourcePublishedAt,
    sourceName: source.sourceName,
    sourceLocale: "international",
    signalTags: source.signalTags,
    imageReferenceCount: source.imageReferenceCount,
    rightsStatus: "unknown_link_only",
    exactMatchBasis: "curated_mapping",
    verdictImpact: "none",
    requiresHumanReview: true,
  };
}));

const output = {
  generatedAt: "2026-07-20T17:10:00+09:00",
  reviewedSourceCount: sources.length,
  mentionCount: mentions.length,
  curationNote: "해외 수집본 중 제품과 판본을 특정할 수 있는 원문만 연결했습니다. 커뮤니티 판정은 AI 분석과 점수에 반영하지 않습니다.",
  mentions,
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${mentions.length} overseas mentions from ${sources.length} reviewed sources.`);
