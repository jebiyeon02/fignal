import evidenceDataset from "./data/counterfeit-evidence.generated.json";
import { myHeroCounterfeitCases } from "./my-hero-counterfeit-cases";
import { researchedCommunityCases } from "./researched-counterfeit-cases";

export type CounterfeitEvidenceKey =
  | "boxFront"
  | "boxBack"
  | "barcode"
  | "baseMark"
  | "facePaint"
  | "figureFull"
  | "parts"
  | "purchaseProof";

export type CounterfeitCaseSourceType = "official" | "community";
export type CounterfeitCaseKind = "official" | "comparison" | "specimen" | "mention";

export type CounterfeitCase = {
  id: string;
  productId: string;
  title: string;
  summary: string;
  images: string[];
  signals: Array<{
    evidenceKey: CounterfeitEvidenceKey;
    label: string;
  }>;
  sourceType: CounterfeitCaseSourceType;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  caseKind?: CounterfeitCaseKind;
  verdictImpact?: "ai_reference" | "none";
  secondarySources?: Array<{ name: string; url: string }>;
  evidenceIds?: string[];
  evidenceSummary?: string;
  confidenceLevel?: "high" | "medium";
  verificationStatus?: string;
  rightsStatus?: string;
  sourcePublishedAt?: string | null;
  requiresHumanReview?: boolean;
};

const currentGoodSmileSupport = {
  sourceType: "official" as const,
  sourceName: "GOOD SMILE COMPANY 고객지원",
  sourceUrl: "https://support.goodsmile.com/hc/en-us/articles/39729124039449-Bootleg-Information-Nendoroid-series",
  checkedAt: "2026-07-16",
};

const archivedGoodSmileSupport = (sourceUrl: string) => ({
  sourceType: "official" as const,
  sourceName: "GOOD SMILE COMPANY 공식 가품 아카이브",
  sourceUrl,
  checkedAt: "2026-07-16",
});

const archivedGoodSmileImages = (...files: string[]) => files.map(
  (file) => `https://partner.goodsmile.info/support/eng/images/large/${file}`,
);

const curatedCounterfeitCases: CounterfeitCase[] = [
  {
    id: "miku-symphony-package",
    productId: "nendoroid-1538",
    title: "로고와 창 인쇄가 빠진 패키지",
    summary: "같은 제품에서 정식 패키지와 크기가 다르고, 전면 창의 제품명 박과 제조사 표기가 없는 가품이 공식 확인됐습니다.",
    images: ["https://support.goodsmile.com/hc/article_attachments/44334484961433"],
    signals: [
      { evidenceKey: "boxFront", label: "제조사·브랜드 로고가 없음" },
      { evidenceKey: "boxFront", label: "투명 창의 제품명 박 인쇄가 없음" },
      { evidenceKey: "boxBack", label: "저작권 표기가 없음" },
      { evidenceKey: "boxFront", label: "정식 패키지와 상자 크기가 다름" },
    ],
    ...currentGoodSmileSupport,
  },
  {
    id: "chuya-package-and-face",
    productId: "nendoroid-676",
    title: "표기 누락과 얼굴 구조 차이",
    summary: "같은 제품에서 패키지 로고와 저작권 문구가 빠지고, 얼굴 파츠 구조와 받침대 표기가 정식 제품과 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://support.goodsmile.com/hc/article_attachments/44334648842905",
      "https://support.goodsmile.com/hc/article_attachments/44334751485337",
      "https://support.goodsmile.com/hc/article_attachments/44334026072473",
      "https://support.goodsmile.com/hc/article_attachments/44334073891097",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "패키지의 제조사·브랜드 로고가 없음" },
      { evidenceKey: "boxBack", label: "패키지의 저작권 표기가 없음" },
      { evidenceKey: "facePaint", label: "얼굴 파츠 구조가 정식 제품과 다름" },
      { evidenceKey: "baseMark", label: "받침대 바닥의 저작권 표기가 없음" },
    ],
    ...currentGoodSmileSupport,
  },
  {
    id: "hunter-parts-and-base",
    productId: "nendoroid-1279",
    title: "머리 구조와 소품 도색 차이",
    summary: "같은 제품에서 머리 파츠 구조, 권총 도색, 램프의 투명도와 받침대 저작권 표기가 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://support.goodsmile.com/hc/article_attachments/44334073892505",
      "https://support.goodsmile.com/hc/article_attachments/44334073901209",
      "https://support.goodsmile.com/hc/article_attachments/44334026086169",
      "https://support.goodsmile.com/hc/article_attachments/44335146586905",
    ],
    signals: [
      { evidenceKey: "facePaint", label: "머리 파츠의 결합 구조가 다름" },
      { evidenceKey: "parts", label: "헌터 권총의 도색이 다름" },
      { evidenceKey: "parts", label: "램프 내부 색과 투명도가 다름" },
      { evidenceKey: "baseMark", label: "받침대 바닥의 저작권 표기가 없음" },
    ],
    ...currentGoodSmileSupport,
  },
  {
    id: "conan-package-joints-base",
    productId: "nendoroid-803",
    title: "패키지 표기와 관절·받침대 차이",
    summary: "정식판에 있는 로고와 MADE IN JAPAN 표기가 빠지고, 목 관절과 받침대 저작권 표기가 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/6607/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/6607/04.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/6607/05.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/6607/08.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "브랜드 로고와 MADE IN JAPAN 표기가 없음" },
      { evidenceKey: "figureFull", label: "옷 단추의 노란색 도색이 빠짐" },
      { evidenceKey: "facePaint", label: "목 관절 구멍이 얼굴 파츠와 일체형" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/6607/"),
  },
  {
    id: "tracer-package-neck-pulse-bomb",
    productId: "nendoroid-730",
    title: "패키지와 목 관절·소품 구조 차이",
    summary: "정식판과 패키지 디자인이 다르고, 분리되어야 할 목 관절과 펄스 폭탄이 본체에 붙은 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/6214/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/6214/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/6214/03.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "정식 제품과 패키지 디자인이 다름" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
      { evidenceKey: "parts", label: "펄스 폭탄이 본체에 붙어 분리되지 않음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/6214/"),
  },
  {
    id: "naruto-package-neck-joint",
    productId: "nendoroid-682",
    title: "박스 디자인과 목 관절 구조 차이",
    summary: "정식판과 박스 디자인이 다르고, 분리형이어야 할 목 관절이 얼굴 파츠와 한 덩어리인 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/5981-6106/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5981-6106/02.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "정식 제품과 박스 디자인이 다름" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/5981-6106/"),
  },
  {
    id: "sasuke-package-neck-joint",
    productId: "nendoroid-707",
    title: "로고 누락과 목 관절 구조 차이",
    summary: "박스에서 굿스마일·넨도로이드 로고가 빠지고, 분리형이어야 할 목 관절이 얼굴 파츠와 한 덩어리인 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/5981-6106/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5981-6106/04.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "굿스마일·넨도로이드 로고가 없음" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/5981-6106/"),
  },
  {
    id: "kirby-mouth-screw-magnet",
    productId: "nendoroid-544",
    title: "입 외곽선과 내부 나사·자석 차이",
    summary: "입 외곽선 색이 다르고, 내부 나사 구멍이 없거나 자석 모양과 도색이 정식판과 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/5207/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5207/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5207/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5207/04.jpg",
    ],
    signals: [
      { evidenceKey: "facePaint", label: "입 외곽선이 검정이 아닌 붉은색" },
      { evidenceKey: "parts", label: "몸 중앙의 나사 구멍이 없음" },
      { evidenceKey: "parts", label: "손·다리 안쪽 나사가 보이지 않음" },
      { evidenceKey: "parts", label: "자석 모양과 내부 도색이 정식판과 다름" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/5207/"),
  },
  {
    id: "mikazuki-lips-sheath-stand",
    productId: "nendoroid-511",
    title: "입술·칼집 도색과 스탠드 구조 차이",
    summary: "입술이 밝은 분홍색이고 칼집의 금색 도색이 빠졌으며, 스탠드 연결부가 분리되지 않는 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/03.jpg",
    ],
    signals: [
      { evidenceKey: "facePaint", label: "입술이 갈색이 아닌 밝은 분홍색" },
      { evidenceKey: "parts", label: "칼집의 금색 도색이 빠짐" },
      { evidenceKey: "baseMark", label: "스탠드 연결부가 분리되지 않음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/"),
  },
  {
    id: "kashu-lips-stand",
    productId: "nendoroid-518",
    title: "입술 외곽선과 스탠드 구조 차이",
    summary: "입술의 붉은 외곽선이 선명하지 않고, 스탠드 끝 연결부가 분리되지 않는 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/04.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/03.jpg",
    ],
    signals: [
      { evidenceKey: "facePaint", label: "입술의 붉은 외곽선이 없음" },
      { evidenceKey: "baseMark", label: "스탠드 연결부가 분리되지 않음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/"),
  },
  {
    id: "kogitsunemaru-logo-sheath-neck",
    productId: "nendoroid-525",
    title: "로고·칼집 도색과 목 관절 차이",
    summary: "패키지 로고가 빠지고 칼집의 흰색 부분이 금색으로 처리됐으며, 목 관절이 얼굴에 붙은 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/05.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/06.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/07.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "굿스마일·넨도로이드 로고가 없음" },
      { evidenceKey: "parts", label: "칼집의 흰색 도색 부분이 금색으로 처리됨" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/4903-4976-5028/"),
  },
  {
    id: "umaru-logo-hair-neck-base",
    productId: "nendoroid-524",
    title: "로고 누락과 후드·목 관절 차이",
    summary: "패키지 로고와 받침대 저작권 표기가 빠지고, 머리카락 위치와 목 관절 구조가 정식판과 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/5013/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5013/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5013/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/5013/04.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "굿스마일·넨도로이드 로고가 없음" },
      { evidenceKey: "figureFull", label: "머리카락이 후드 바깥이 아닌 안쪽에 위치" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/5013/"),
  },
  {
    id: "red-logo-joint-neck-base",
    productId: "nendoroid-425",
    title: "로고·관절 색과 받침대 표기 차이",
    summary: "패키지 로고와 저작권 표기가 빠지고, 관절 색과 목 관절 구조가 정식판과 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/4413/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4413/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4413/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4413/04.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "굿스마일 컴퍼니 로고가 없음" },
      { evidenceKey: "parts", label: "정품의 파란색 관절과 다른 색을 사용" },
      { evidenceKey: "facePaint", label: "목 관절이 얼굴 파츠와 일체형" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/4413/"),
  },
  {
    id: "asuna-package-paint-joints",
    productId: "nendoroid-283",
    title: "패키지 문구와 도색·관절 차이",
    summary: "박스 상단의 제품 번호가 빠지고 일본어·회사명이 틀리며, 머리·검 연결부 도색과 목 구조가 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/3710/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3710/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3710/04.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3710/07.jpg",
    ],
    signals: [
      { evidenceKey: "boxFront", label: "박스 상단의 넨도로이드 번호가 없음" },
      { evidenceKey: "boxBack", label: "일본어와 회사명이 잘못 표기됨" },
      { evidenceKey: "parts", label: "허리 검 연결부가 투명이 아닌 빨간색" },
      { evidenceKey: "facePaint", label: "목 안쪽 도색과 관절 구조가 정식판과 다름" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3710/"),
  },
  {
    id: "iron-man-mask-base-package",
    productId: "nendoroid-284",
    title: "마스크·베이스 표기와 패키지 광택 차이",
    summary: "마스크 안쪽과 시티 베이스의 저작권 표기가 빠지고, 자석·연결부와 패키지 금속 광택이 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/3711/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3711/03.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3711/05.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/3711/08.jpg",
    ],
    signals: [
      { evidenceKey: "parts", label: "마스크 안쪽 저작권 표기 또는 자석이 없음" },
      { evidenceKey: "parts", label: "얼굴 연결부가 아머의 빨간색이 아닌 피부색" },
      { evidenceKey: "baseMark", label: "시티 베이스의 저작권 표기가 없음" },
      { evidenceKey: "boxFront", label: "패키지의 금속 광택 효과가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3711/"),
  },
  {
    id: "l-box-face-chair-hair",
    productId: "nendoroid-17",
    title: "박스 색과 얼굴 광택·의자 구조 차이",
    summary: "박스의 주황색과 배경 무늬가 다르고, 눈 인쇄·피부 광택·의자 조형과 앞머리 연결부 색이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "336299b7943d9276b112712a93ad4335.jpg",
      "770f309b9295bc003178e07f416ef081.jpg",
      "e36b58460eadc49ec3acba288ad37be4.jpg",
      "e58bab619fcf4d714fd6ea99714a63d4.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "박스의 주황색이 더 어둡고 배경 무늬가 흐림" },
      { evidenceKey: "facePaint", label: "눈 테두리가 두껍고 번져 있으며 피부 광택이 강함" },
      { evidenceKey: "parts", label: "의자 다리가 한 덩어리이고 쉽게 휘는 재질" },
      { evidenceKey: "facePaint", label: "앞머리 연결부가 피부색이 아닌 갈색" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/2030/"),
  },
  {
    id: "mikuru-beam-face-package-base",
    productId: "nendoroid-9",
    title: "빔 투명도와 얼굴·패키지 차이",
    summary: "미쿠루 빔이 불투명하고 볼 홍조·눈썹 색이 다르며, JAN 글꼴과 패키지 인쇄·받침대 표기가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "386b1f958643eb8b440c9bb841122395.jpg",
      "5786b8a6ab4c187cb73dd1f553b468be.jpg",
      "518a32e54fc25c69c5de642dc892c446.jpg",
      "96ac5b135e1ba47c4ea2bd473f2da305.jpg",
    ),
    signals: [
      { evidenceKey: "parts", label: "미쿠루 빔이 투명 녹색이 아닌 불투명 녹색" },
      { evidenceKey: "facePaint", label: "볼 홍조가 없고 눈썹이 갈색이 아닌 검정" },
      { evidenceKey: "barcode", label: "박스 JAN 코드의 글꼴이 정식판과 다름" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/2031/"),
  },
  {
    id: "original-miku-print-paint-base",
    productId: "nendoroid-33",
    title: "패키지 인쇄와 도색·받침대 차이",
    summary: "박스 색·사진 인쇄·저작권 문구가 다르고, 얼굴 광택과 치마·소매 도색 및 받침대 표기가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "602cdaea2d18f3e533a0151ab3fc10ca.jpg",
      "f035fcaeae32c7a3a626ca39878e0912.jpg",
      "aca836a1a5f669163bbdbab7522b7856.jpg",
      "b8fe4b615482064bb1407d2735f48b40.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "박스 창 테두리 색과 배경 인쇄가 정식판과 다름" },
      { evidenceKey: "boxBack", label: "조형사 이름 오탈자 또는 저작권 기호 누락" },
      { evidenceKey: "facePaint", label: "피부 광택과 홍조·시선 방향이 정식판과 다름" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없거나 반전됨" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/2289/"),
  },
  {
    id: "saber-lily-sticker-face-joint-base",
    productId: "nendoroid-77",
    title: "정품 스티커와 얼굴·관절 차이",
    summary: "패키지의 저작권 승인 스티커가 없고, 얼굴 광택·눈 그라데이션·관절 색과 받침대 표기가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "1d39185845974c7f8183719c053cd512.jpg",
      "b319e5a329d19d26c93a167c138706f9.jpg",
      "993ba1a23d9d8b723ade2a559963a48f.jpg",
      "fda01bec2da14d4a71f8eda984a16788.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "패키지의 저작권 승인 스티커가 없음" },
      { evidenceKey: "facePaint", label: "얼굴 광택이 강하고 눈 위쪽이 검게 보임" },
      { evidenceKey: "parts", label: "뒷머리 관절이 머리색이 아닌 피부색" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/2842/"),
  },
  {
    id: "snow-miku-reflective-print-face-base",
    productId: "nendoroid-97",
    title: "눈꽃 인쇄와 얼굴·받침대 차이",
    summary: "박스 눈꽃에 반사 인쇄가 없고, 입 모양과 넥타이 그라데이션 및 받침대 저작권 표기가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "85f575e198c55320b5534b5cf0068e0e.jpg",
      "3684e5f5d6d625a8660ea2da3a7a96d2.jpg",
      "c51c395a82e65ecd35457c2cc9836ffa.jpg",
      "c5ea5f88d1659ea1125527a69951329e.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "박스 눈꽃의 반사 인쇄 효과가 없음" },
      { evidenceKey: "facePaint", label: "정식판과 다르게 입이 벌어진 형태" },
      { evidenceKey: "figureFull", label: "넥타이에 그라데이션 없이 단색 도색" },
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/2899/"),
  },
  {
    id: "black-rock-shooter-package-zip-neck",
    productId: "nendoroid-106",
    title: "동봉 스티커와 몸체·목 구조 차이",
    summary: "DVD 동봉 스티커가 없고, 지퍼 구멍과 목 도색·얼굴 파츠 내부 구조가 정식판과 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "a9f6cd6321c4cabf483b055cba7f0114.jpg",
      "8e04525795a0af27169d086d3bdc8e70.jpg",
      "d7b367260ccc2016ef894197a4ed1fdc.jpg",
      "9f85e2651f9997ed445b4ae4507d4bac.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "DVD 동봉판 스티커가 없음" },
      { evidenceKey: "figureFull", label: "몸체 지퍼 중앙의 구멍이 막혀 있음" },
      { evidenceKey: "facePaint", label: "목 밑부분이 피부색이 아닌 검정" },
      { evidenceKey: "facePaint", label: "얼굴 파츠 내부 연결부가 한 덩어리" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3064/"),
  },
  {
    id: "black-gold-saw-magnet-head-weapon",
    productId: "nendoroid-143",
    title: "자석과 머리·무기 조형 차이",
    summary: "정식판의 자석이 없고 머리 뒤 구멍이 생기며, 무기 조형 디테일과 관절 색이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "b44fc4ec7d1f964eba561b8f6ba9f3a3.jpg",
      "917cbf419e3a1bff420ecc040c7d9302.jpg",
      "d799ab611a35d51c1bc2f7a73ffcf68d.jpg",
      "e7ce62e4102d11553ff9a89dfd594650.jpg",
    ),
    signals: [
      { evidenceKey: "parts", label: "정식판에 쓰이는 자석이 없음" },
      { evidenceKey: "facePaint", label: "정식판에는 없는 구멍이 머리 뒤에 있음" },
      { evidenceKey: "parts", label: "무기의 흠집 조형과 세부 표현이 단순함" },
      { evidenceKey: "parts", label: "관절 색이 피부색과 다름" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3241/"),
  },
  {
    id: "dead-master-neck-hair-eyes-prop",
    productId: "nendoroid-128",
    title: "목 구조와 머리·눈·소품 차이",
    summary: "얼굴 연결부가 일체형이고 목과 머리 도색이 다르며, 눈 하이라이트와 소품의 분리 구조가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "71b1133336764a8ea6dfeb224ff21fe3.jpg",
      "8814afd3dd12cc8a463d4ab887e970ea.jpg",
      "10dadcff1fd68e846a298e9c620ad6f3.jpg",
      "b861354e53978361fd54eb24cf56e683.jpg",
    ),
    signals: [
      { evidenceKey: "facePaint", label: "얼굴 안쪽 연결부가 분리형이 아닌 일체형" },
      { evidenceKey: "facePaint", label: "머리의 녹색 그라데이션이 없이 검정 단색" },
      { evidenceKey: "facePaint", label: "눈 하이라이트가 흐리고 눈꺼풀 위치가 다름" },
      { evidenceKey: "parts", label: "분리되어야 할 소품이 한 덩어리" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3249/"),
  },
  {
    id: "madoka-joints-bow-paint-package",
    productId: "nendoroid-174",
    title: "연결부와 활·도색·패키지 차이",
    summary: "얼굴 연결부가 일체형이고 활의 투명도·연결부 색과 머리·눈 도색 및 내부 포장이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "290af75c6710d5da6943d78318637b45.jpg",
      "28aef6fd90263a55072535f583c2d2c8.jpg",
      "5f08f0c81b81b9ffa327f1200d0c8000.jpg",
      "4b08ebe9411ea23b0bb1931b3abf815e.jpg",
    ),
    signals: [
      { evidenceKey: "facePaint", label: "얼굴 안쪽 연결부가 분리형이 아닌 일체형" },
      { evidenceKey: "parts", label: "활 색이 더 진하고 연결부가 투명이 아님" },
      { evidenceKey: "facePaint", label: "눈 그라데이션 없이 평평한 빨간색" },
      { evidenceKey: "boxBack", label: "박스 내부 좌우 날개 크기가 비대칭" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3250/"),
  },
  {
    id: "hmo-miku-face-paint-drum",
    productId: "nendoroid-129",
    title: "얼굴 연결부와 의상·드럼 도색 차이",
    summary: "얼굴 연결부가 일체형이고 어깨 번호·소매·허벅지 도색과 드럼 세트 마감이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "a7ca4b0d93bd8fa3a7169abca2855b51.jpg",
      "ecdff09dceaa69703564d37b702700d6.jpg",
      "424c494cb9d51b9ed6c71fce52b2b683.jpg",
      "97697ddd80046d433161f41a7b7d4f1e.jpg",
    ),
    signals: [
      { evidenceKey: "facePaint", label: "얼굴 안쪽 연결부가 분리형이 아닌 일체형" },
      { evidenceKey: "figureFull", label: "어깨 01 글꼴과 소매 끝 색이 정식판과 다름" },
      { evidenceKey: "parts", label: "드럼 다리 색 분할과 스탠드 광택이 없음" },
      { evidenceKey: "figureFull", label: "허벅지가 피부색이 아닌 검정 등으로 오도색" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3251/"),
  },
  {
    id: "snow-miku-fluffy-package-paint-parts",
    productId: "nendoroid-207",
    title: "박스 크기와 도색·구성품 차이",
    summary: "박스 두께와 설명이 다르고, 도색·파츠 결합이 거칠며 투명 미쿠와 LED 스탠드가 빠진 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "d18e08ec7281f99becd4bad93f8ef44a.jpg",
      "a92b24b9dac7fc5d3535b12890a925bd.jpg",
      "51c4b612dce7d9747c57dbf554453417.jpg",
      "63fb42206876ef77d71c377cebf51967.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "정식판의 두꺼운 전용 박스와 크기가 다름" },
      { evidenceKey: "boxBack", label: "설명 문구와 회사명이 잘못 표기됨" },
      { evidenceKey: "figureFull", label: "도색이 거칠고 파츠 결합부가 고르지 않음" },
      { evidenceKey: "parts", label: "투명 미쿠 또는 LED 스탠드가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3438/"),
  },
  {
    id: "snow-miku-playtime-box-extras-paint",
    productId: "nendoroid-97-playtime",
    title: "홀로그램과 구성품·마감 차이",
    summary: "패키지 홀로그램과 얼음틀이 빠지고, 눈 도색·트윈테일 결합과 눈사람 마감이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "ca07678fd3dcd74b1041c0035111bc2c.jpg",
      "7336aa55a9102f8cb744ceab40583366.jpg",
      "399ccdad73918002cda5fcf3d66fdb2d.jpg",
      "365bcec830b63c971797c01b76a2cbc9.jpg",
    ),
    signals: [
      { evidenceKey: "boxFront", label: "패키지 홀로그램 스티커가 없음" },
      { evidenceKey: "parts", label: "정식 구성품인 얼음틀이 없음" },
      { evidenceKey: "facePaint", label: "눈의 그라데이션이 거의 없음" },
      { evidenceKey: "parts", label: "트윈테일이 분리되지 않고 고정됨" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3452/"),
  },
  {
    id: "kuroneko-face-frill-joints-hair",
    productId: "nendoroid-163",
    title: "홍조와 의상·관절 도색 차이",
    summary: "볼 홍조가 지나치게 진하고 의상 프릴·관절 색과 머리 파츠 안쪽 도색이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "0feec2a86d0349fa831f1a85650e36ba.jpg",
      "41647df72095209d2c0037b2ecf87099.jpg",
      "cb8558d3ca9c1d9c866d13f24a7fd6b2.jpg",
      "a5477ec7142e2c3be7c6227c513c958d.jpg",
    ),
    signals: [
      { evidenceKey: "facePaint", label: "볼 홍조가 옅은색이 아닌 진한 붉은색" },
      { evidenceKey: "figureFull", label: "프릴 색이 머리색 계열 보라가 아닌 회청색" },
      { evidenceKey: "parts", label: "피부색이어야 할 관절이 흰색" },
      { evidenceKey: "facePaint", label: "머리 파츠 안쪽의 보라색 도색이 빠짐" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3453/"),
  },
  {
    id: "menma-joints-numbering-stand-hair",
    productId: "nendoroid-204",
    title: "관절 색과 얼굴 번호·스탠드 차이",
    summary: "관절 색이 피부와 다르고 얼굴 파츠 번호가 없으며, 자석식이 아닌 일반 스탠드와 거친 머리 파츠를 쓴 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "f0d4c77e80dbd53781f599dd7276799e.jpg",
      "26be2cfd87592f83bebb598d5c69c5fb.jpg",
      "c21d93ea97201839b4a6f54e3305e8f0.jpg",
      "21e7f5b9996b97cb31f950d987c22a00.jpg",
    ),
    signals: [
      { evidenceKey: "parts", label: "관절 색이 피부색과 다름" },
      { evidenceKey: "facePaint", label: "얼굴 파츠 안쪽의 번호 표기가 없음" },
      { evidenceKey: "baseMark", label: "자석식 대신 머리에 구멍을 내는 일반 스탠드" },
      { evidenceKey: "facePaint", label: "앞·뒷머리 파츠 마감이 거칠고 흰색이 보이지 않음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3516/"),
  },
  {
    id: "kirino-base-face-joints-paint",
    productId: "nendoroid-144",
    title: "받침대 표기와 얼굴·관절 도색 차이",
    summary: "받침대 저작권이 빠지고 얼굴 연결부가 일체형이며, 팔 관절·목·하체 도색과 눈 인쇄가 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "47234d7158f96305c4de6a77ee07fed7.jpg",
      "0367cf943866668f5b4c0a7114e4e71f.jpg",
      "9c21070998748579435570b966ee901c.jpg",
      "efab1c013a5252c9cee79a29184d8a2a.jpg",
    ),
    signals: [
      { evidenceKey: "baseMark", label: "받침대 저작권 표기가 없거나 반대쪽에 있음" },
      { evidenceKey: "facePaint", label: "얼굴 안쪽 연결부가 분리형이 아닌 일체형" },
      { evidenceKey: "parts", label: "피부색이어야 할 팔 관절이 도색됨" },
      { evidenceKey: "facePaint", label: "눈이 검게 뭉치고 그라데이션이 거침" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3561/"),
  },
  {
    id: "len-headset-tie-paint-sticker",
    productId: "nendoroid-40",
    title: "헤드셋·소품 도색과 홀로그램 차이",
    summary: "마이크 방향과 넥타이 결합이 다르고, 발 글자·벨트·키보드 도색 및 박스 홀로그램이 다른 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "5753f74faac70267d2fee7a2ce629c5c.jpg",
      "84b82c3e5ae458853aa0b10551347228.jpg",
      "ce6dcb3ddb054d9b55e34a000773e055.jpg",
      "1927218ce86dec728963b9e41482ef70.jpg",
    ),
    signals: [
      { evidenceKey: "figureFull", label: "헤드셋 마이크가 바깥쪽을 향함" },
      { evidenceKey: "parts", label: "넥타이가 다리와 붙어 있음" },
      { evidenceKey: "parts", label: "벨트 구멍과 키보드 검은 선 도색이 빠짐" },
      { evidenceKey: "boxBack", label: "박스 뒷면의 홀로그램 제작 스티커가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3565/"),
  },
  {
    id: "snow-miku-kimono-hood-face-package-base",
    productId: "nendoroid-303",
    title: "후드·얼굴 구조와 패키지 표기 차이",
    summary: "후드 안쪽 색과 얼굴 연결 구조가 다르고, 박스 띠·속눈썹 색과 저작권 인쇄가 빠진 가품이 공식 확인됐습니다.",
    images: archivedGoodSmileImages(
      "1416633db97608c76b2d99ee1de14084.jpg",
      "ba6ca01594089e066c60133cd5826158.jpg",
      "5c4f4fdaba7d14293199fcf89ce7b48a.jpg",
      "9ffa02d0b447e5f1bec79ad161c0aa65.jpg",
    ),
    signals: [
      { evidenceKey: "figureFull", label: "후드 안쪽이 빨간색이 아닌 흰색" },
      { evidenceKey: "facePaint", label: "얼굴 안쪽 연결부가 분리형이 아닌 일체형" },
      { evidenceKey: "boxFront", label: "정식 패키지의 흰색 띠가 없음" },
      { evidenceKey: "baseMark", label: "저작권 인쇄가 없음" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/3666/"),
  },
  {
    id: "snow-miku-magical-joints-magnet-base",
    productId: "nendoroid-380",
    title: "눈꽃·관절·자석과 받침대 차이",
    summary: "모자 눈꽃 표현과 유키네 관절 색이 다르고, 얼굴 연결부·머리 자석·받침대 저작권 표기가 다른 가품이 공식 확인됐습니다.",
    images: [
      "https://partner.goodsmile.info/support/eng/fake/en/4133-1/01.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4133-1/02.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4133-1/04.jpg",
      "https://partner.goodsmile.info/support/eng/fake/en/4133-1/05.jpg",
    ],
    signals: [
      { evidenceKey: "parts", label: "모자 눈꽃의 그라데이션·세부 조형이 없고 투명함" },
      { evidenceKey: "parts", label: "유키네 목 관절이 투명이 아닌 흰색" },
      { evidenceKey: "facePaint", label: "얼굴 안쪽 목 연결부가 분리되지 않음" },
      { evidenceKey: "baseMark", label: "스탠드 저작권 표기가 없거나 틀림" },
    ],
    ...archivedGoodSmileSupport("https://partner.goodsmile.info/support/eng/fake/en/4133-1/"),
  },
];

type ImportedEvidenceCase = {
  evidenceId: string;
  productId: string;
  existingCaseId: string | null;
  registrationStatus: string;
  confidenceLevel: "high" | "medium";
  verificationStatus: string;
  evidenceSummary: string;
  publicTitle: string;
  publicSummary: string;
  signals: Array<{ evidenceKey: CounterfeitEvidenceKey; label: string }>;
  sourceType: CounterfeitCaseSourceType;
  sourcePlatform: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  sourceRetrievedAt: string | null;
  rightsStatus: string;
  imageIds: string[];
  requiresHumanReview: boolean;
};

type ImportedEvidenceImage = {
  id: string;
  displayUrl: string | null;
  linkStatus: string;
};

const importedEvidenceCases = evidenceDataset.cases as ImportedEvidenceCase[];
const importedEvidenceImages = evidenceDataset.images as ImportedEvidenceImage[];
const importedImageById = new Map(importedEvidenceImages.map((image) => [image.id, image]));
const importedByExistingCaseId = new Map<string, ImportedEvidenceCase[]>();

for (const evidence of importedEvidenceCases) {
  if (!evidence.existingCaseId || evidence.registrationStatus !== "registered") continue;
  const records = importedByExistingCaseId.get(evidence.existingCaseId) ?? [];
  records.push(evidence);
  importedByExistingCaseId.set(evidence.existingCaseId, records);
}

const enrichedCuratedCases = curatedCounterfeitCases.map((counterfeitCase) => {
  const evidence = importedByExistingCaseId.get(counterfeitCase.id) ?? [];
  if (evidence.length === 0) return counterfeitCase;
  const strongest = evidence.find((item) => item.confidenceLevel === "high") ?? evidence[0];
  return {
    ...counterfeitCase,
    evidenceIds: evidence.map((item) => item.evidenceId),
    evidenceSummary: strongest.evidenceSummary,
    confidenceLevel: strongest.confidenceLevel,
    verificationStatus: strongest.verificationStatus,
    rightsStatus: strongest.rightsStatus,
    sourcePublishedAt: strongest.sourcePublishedAt,
    requiresHumanReview: evidence.some((item) => item.requiresHumanReview),
  };
});

const importedNewCases: CounterfeitCase[] = importedEvidenceCases
  .filter((evidence) => evidence.registrationStatus === "registered" && !evidence.existingCaseId)
  .map((evidence) => ({
    id: `dataset-${evidence.evidenceId.replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase()}`,
    productId: evidence.productId,
    title: evidence.publicTitle,
    summary: evidence.publicSummary,
    images: evidence.imageIds
      .map((imageId) => importedImageById.get(imageId))
      .filter((image): image is ImportedEvidenceImage => Boolean(image?.displayUrl) && image?.linkStatus === "available")
      .map((image) => image.displayUrl as string)
      .slice(0, 4),
    signals: evidence.signals.map(({ evidenceKey, label }) => ({ evidenceKey, label })),
    sourceType: evidence.sourceType,
    sourceName: evidence.sourceType === "official" ? "GOOD SMILE COMPANY 공식 가품 아카이브" : "검수된 실물 비교 자료",
    sourceUrl: evidence.sourceUrl,
    checkedAt: evidence.sourceRetrievedAt?.slice(0, 10) ?? "2026-07-16",
    evidenceIds: [evidence.evidenceId],
    evidenceSummary: evidence.evidenceSummary,
    confidenceLevel: evidence.confidenceLevel,
    verificationStatus: evidence.verificationStatus,
    rightsStatus: evidence.rightsStatus,
    sourcePublishedAt: evidence.sourcePublishedAt,
    requiresHumanReview: evidence.requiresHumanReview,
  }))
  .filter((counterfeitCase) => counterfeitCase.images.length > 0);

export const counterfeitCases: CounterfeitCase[] = [
  ...enrichedCuratedCases,
  ...importedNewCases,
  ...researchedCommunityCases,
  ...myHeroCounterfeitCases,
];
