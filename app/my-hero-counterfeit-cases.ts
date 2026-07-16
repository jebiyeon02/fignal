import type { CounterfeitCase } from "./counterfeit-cases";

const communityDefaults = {
  sourceType: "community" as const,
  checkedAt: "2026-07-16",
  rightsStatus: "unknown_link_only",
  requiresHumanReview: true,
  verdictImpact: "none" as const,
};

export const myHeroCounterfeitCases: CounterfeitCase[] = [
  {
    id: "community-todoroki-1112-side-by-side",
    productId: "nendoroid-1112",
    title: "No.1112 정품·가품 실물 비교",
    summary: "구매자가 환불받은 토도로키 가품을 정품과 나란히 비교한 사례입니다. 얼굴 인쇄와 광택, 머리 파츠 높이, 받침대 투명도와 파츠 결합감 차이가 함께 지적됐습니다.",
    images: [],
    signals: [
      { evidenceKey: "facePaint", label: "가품의 눈·입 선이 더 굵고 도색이 번지거나 과포화됨" },
      { evidenceKey: "figureFull", label: "가품 본체가 과하게 반짝이고 머리 앞 파츠의 높이·단차가 다름" },
      { evidenceKey: "baseMark", label: "정품의 반투명 받침대보다 가품 받침대가 지나치게 투명함" },
      { evidenceKey: "parts", label: "가품 파츠가 끈적하거나 잘 맞지 않아 포즈 고정이 어려움" },
    ],
    sourceName: "Reddit 정품·가품 비교",
    sourceUrl: "https://www.reddit.com/r/Nendoroid/comments/n4k6bt/bootleg_vs_official_todoroki_so_glad_i_was_able/",
    sourcePublishedAt: "2021-05-04",
    caseKind: "comparison",
    confidenceLevel: "high",
    verificationStatus: "side_by_side_author_asserted",
    evidenceSummary: "작성자가 정품과 환불받은 가품을 함께 촬영했고, 댓글에서 얼굴·도색·머리 구조·받침대·결합 차이를 구체적으로 대조했습니다.",
    secondarySources: [
      {
        name: "MFC 알려진 가품 등록",
        url: "https://myfigurecollection.net/item/802593",
      },
    ],
    ...communityDefaults,
  },
  {
    id: "community-bakugo-705-known-bootleg",
    productId: "nendoroid-705",
    title: "No.705 알려진 가품 등록",
    summary: "수집 데이터베이스에 No.705 히어로즈 에디션의 가품 존재와 가품 사진 3건이 등록돼 있습니다. 개별 사진의 정품·가품 방향을 서비스에서 재검수하지 못해 원문 참고 사례로만 표시합니다.",
    images: [],
    signals: [
      { evidenceKey: "boxFront", label: "No.705 히어로즈 에디션과 동일한 제품 번호인지 확인" },
      { evidenceKey: "figureFull", label: "가품 존재가 등록된 제품이므로 본체·도색을 공식 제품과 추가 대조" },
    ],
    sourceName: "MyFigureCollection 가품 등록",
    sourceUrl: "https://myfigurecollection.net/item/455088",
    sourcePublishedAt: null,
    caseKind: "mention",
    confidenceLevel: "medium",
    verificationStatus: "community_catalog_asserted",
    evidenceSummary: "제품 페이지가 No.705의 알려진 가품 존재를 경고하고 Bootlegs 분류 사진 3건을 표시합니다.",
    ...communityDefaults,
  },
];
