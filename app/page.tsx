"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  ArrowRight,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  Plus,
  RotateCcw,
  ScanBarcode,
  ScanFace,
  Search,
  Share2,
  ShieldCheck,
  Stamp,
  Store,
  TriangleAlert,
  X,
  ZoomIn,
} from "lucide-react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { expandedProducts } from "./catalog";
import { communityMentions, type CommunityMention } from "./community-mentions";
import {
  counterfeitCases,
  type CounterfeitCase,
  type CounterfeitEvidenceKey,
} from "./counterfeit-cases";

type Stage = "search" | "photos" | "result";
type Observation = "missing" | "unverified" | "match" | "concern";
type EvidenceKey = CounterfeitEvidenceKey;

type Product = {
  id: string;
  name: string;
  englishName: string;
  aliases: string[];
  number: string;
  maker: string;
  release: string;
  image: string;
  officialUrl: string;
  verified: boolean;
};

type EvidenceItem = {
  key: EvidenceKey;
  title: string;
  description: string;
  matchReason: string;
  concernReason: string;
  weight: number;
  essential: boolean;
  icon: typeof Camera;
};

type AiFinding = {
  key: EvidenceKey;
  status: "match" | "concern" | "unclear";
  title: string;
  reason: string;
  visibleEvidence: string;
  userAction: string;
};

type AiAnalysis = {
  verdict: "likely_authentic" | "needs_review" | "counterfeit_suspected" | "insufficient_photos";
  confidence: number;
  summary: string;
  findings: AiFinding[];
  caseMatches: Array<{
    caseId: string;
    similarity: "high" | "medium" | "low";
    reason: string;
    evidenceKeys: EvidenceKey[];
  }>;
  caveat: string;
};

const curatedProducts: Product[] = [
  {
    id: "nendoroid-1528",
    name: "넨도로이드 고죠 사토루",
    englishName: "Nendoroid Satoru Gojo",
    aliases: ["고죠", "고죠 사토루", "gojo", "satoru gojo", "주술회전"],
    number: "1528",
    maker: "Good Smile Company",
    release: "2021.07 · 2026.09 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/8185/74e26f5bb9e39a1658de222ca95ab9bc.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/8185/Nendoroid%2BSatoru%2BGojo",
    verified: true,
  },
  {
    id: "nendoroid-2367",
    name: "넨도로이드 프리렌",
    englishName: "Nendoroid Frieren",
    aliases: ["프리렌", "frieren", "장송의 프리렌"],
    number: "2367",
    maker: "Good Smile Company",
    release: "2024.07 · 2026.08 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/56111/751f1215c9303dc1cfbfb03e3d3b4dfb.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/56111/Nendoroid%2BFrieren",
    verified: true,
  },
  {
    id: "nendoroid-1935",
    name: "넨도로이드 키타가와 마린",
    englishName: "Nendoroid Marin Kitagawa",
    aliases: ["마린", "키타가와", "marin", "marin kitagawa", "비스크돌"],
    number: "1935",
    maker: "Good Smile Company",
    release: "2023.03 · 2026.02 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/10754/W3qiUkLJwp9GuECV5gx2vDzdyKmtAFNn.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/10754/Nendoroid%2BMarin%2BKitagawa",
    verified: true,
  },
  {
    id: "nendoroid-1560",
    name: "넨도로이드 덴지",
    englishName: "Nendoroid Denji",
    aliases: ["덴지", "denji", "체인소맨", "chainsaw man"],
    number: "1560",
    maker: "Good Smile Company",
    release: "2021.10 · 2026.02 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/8409/wPBL9bTrCdun6pa50214ZkQXRcGvxhNz.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/8409/Nendoroid%20Denji",
    verified: true,
  },
  {
    id: "nendoroid-2004",
    name: "넨도로이드 마키마",
    englishName: "Nendoroid Makima",
    aliases: ["마키마", "makima", "체인소맨", "chainsaw man"],
    number: "2004",
    maker: "Good Smile Company",
    release: "2023.06 · 2026.02 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/11275/042d83372814f367457c49b876525213.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/11275/Nendoroid%2BMakima",
    verified: true,
  },
  {
    id: "nendoroid-1055",
    name: "넨도로이드 빔 커비",
    englishName: "Nendoroid Beam Kirby",
    aliases: ["커비", "빔 커비", "kirby", "beam kirby"],
    number: "1055",
    maker: "Good Smile Company",
    release: "2019.09 · 2025.06 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/5625/wWBNap4JA0KV9mETDQhyCgS6cPdft8sH.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/5625/Nendoroid%2BBeam%2BKirby",
    verified: true,
  },
  {
    id: "nendoroid-1538",
    name: "넨도로이드 하츠네 미쿠 심포니 5주년 Ver.",
    englishName: "Nendoroid Hatsune Miku: Symphony 5th Anniversary Ver.",
    aliases: ["미쿠", "하츠네 미쿠", "심포니", "miku", "hatsune miku", "symphony"],
    number: "1538",
    maker: "Good Smile Company",
    release: "2021.08 · 2026.02 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/8255/M8E6AUuzmL7bqS5ix1TPacgD2GRyNtHs.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/8255/Nendoroid%2BHatsune%2BMiku%2BSymphony%2B5th%2BAnniversary%2BVer.",
    verified: true,
  },
  {
    id: "nendoroid-676",
    name: "넨도로이드 나카하라 츄야",
    englishName: "Nendoroid Chuya Nakahara",
    aliases: ["츄야", "나카하라 츄야", "chuya", "nakahara", "문호 스트레이독스"],
    number: "676",
    maker: "ORANGE ROUGE",
    release: "2017.09 · 2026.08 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/3691/Y6C02p5nSUGr4b9AkvzFd3HWhe1aBqmT.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/3691/Nendoroid%20Chuya%20Nakahara",
    verified: true,
  },
  {
    id: "nendoroid-1279",
    name: "넨도로이드 헌터",
    englishName: "Nendoroid Hunter",
    aliases: ["헌터", "hunter", "블러드본", "bloodborne"],
    number: "1279",
    maker: "Good Smile Company",
    release: "2020 발매 · 2022 재판",
    image: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/product/20200214/9276/67699/large/27a94ea1d504a23202b77329faff2048.jpg",
    officialUrl: "https://www.goodsmile.com/en/product/6983/Nendoroid%2BHunter",
    verified: true,
  },
];

const products: Product[] = [...curatedProducts, ...expandedProducts].filter(
  (product, index, allProducts) => allProducts.findIndex((item) => item.id === product.id) === index,
);

const catalogShortcuts = ["봇치 더 록", "귀멸의 칼날", "주술회전", "체인소맨", "나루토", "블리치"];

const manufacturers = [
  "Good Smile Company",
  "ORANGE ROUGE",
  "Good Smile Arts Shanghai",
  "Max Factory",
  "Phat! Company",
  "기타",
];

const evidenceItems: EvidenceItem[] = [
  {
    key: "boxFront",
    title: "박스 정면",
    description: "로고와 제품번호가 보이게",
    matchReason: "로고와 상품명, 패키지 구성이 공식 이미지와 비슷합니다.",
    concernReason: "로고나 상품명 배치가 공식 패키지와 다릅니다.",
    weight: 7,
    essential: true,
    icon: Box,
  },
  {
    key: "boxBack",
    title: "박스 뒷면",
    description: "주의문구와 저작권 표기",
    matchReason: "주의문구와 저작권 표기가 공식 패키지와 비슷합니다.",
    concernReason: "문구나 인쇄 배열에서 공식 패키지와 다른 점이 있습니다.",
    weight: 9,
    essential: true,
    icon: PackageCheck,
  },
  {
    key: "barcode",
    title: "바코드",
    description: "JAN 숫자가 선명하게",
    matchReason: "JAN과 제품번호가 선택한 제품 정보와 맞습니다.",
    concernReason: "JAN 또는 제품번호가 선택한 제품과 맞지 않습니다.",
    weight: 11,
    essential: true,
    icon: ScanBarcode,
  },
  {
    key: "baseMark",
    title: "받침대 각인",
    description: "바닥의 저작권 문구",
    matchReason: "받침대의 저작권 문구와 형태가 기준과 비슷합니다.",
    concernReason: "각인 문구나 받침대 형태가 기준과 다릅니다.",
    weight: 13,
    essential: true,
    icon: Stamp,
  },
  {
    key: "facePaint",
    title: "얼굴 근접",
    description: "눈과 도색이 보이게",
    matchReason: "눈 프린팅과 도색 경계가 공식 이미지와 비슷합니다.",
    concernReason: "눈 프린팅이나 도색에서 뚜렷한 차이가 있습니다.",
    weight: 13,
    essential: true,
    icon: ScanFace,
  },
  {
    key: "figureFull",
    title: "본체 전체",
    description: "앞뒤 조형과 부품 위치",
    matchReason: "본체 비율과 부품 위치가 공식 이미지와 비슷합니다.",
    concernReason: "조형 비율이나 부품 위치가 공식 이미지와 다릅니다.",
    weight: 8,
    essential: false,
    icon: Camera,
  },
  {
    key: "parts",
    title: "구성품",
    description: "블리스터와 교체 파츠",
    matchReason: "블리스터와 교체 파츠 구성이 공식 구성과 맞습니다.",
    concernReason: "내부 포장이나 교체 파츠 구성이 다릅니다.",
    weight: 8,
    essential: false,
    icon: FileCheck2,
  },
  {
    key: "purchaseProof",
    title: "구매내역",
    description: "판매처와 상품명",
    matchReason: "공식 판매처와 상품명이 선택한 제품과 맞습니다.",
    concernReason: "판매처나 상품명이 선택한 제품과 맞지 않습니다.",
    weight: 12,
    essential: false,
    icon: Store,
  },
];

const initialObservations = Object.fromEntries(
  evidenceItems.map((item) => [item.key, "missing"]),
) as Record<EvidenceKey, Observation>;

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function prepareImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 올릴 수 있습니다.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("이 사진을 읽을 수 없습니다. JPG 또는 PNG로 다시 저장해 주세요.");
  }

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
  if (!blob) {
    if (supportedImageTypes.has(file.type)) return file;
    throw new Error("이 사진 형식을 변환하지 못했습니다.");
  }
  if (supportedImageTypes.has(file.type) && scale === 1 && blob.size >= file.size) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "figure-photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

function fileFromImageBlob(blob: Blob) {
  if (!blob.type.startsWith("image/")) return null;
  const subtype = blob.type.split("/")[1]?.split("+")[0]?.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "png";
  return new File([blob], `clipboard-${Date.now()}.${subtype}`, { type: blob.type });
}

async function fileFromClipboardSource(source: string) {
  const trimmed = source.trim();
  if (!trimmed || (!trimmed.startsWith("data:image/") && !/^https?:\/\//i.test(trimmed))) return null;
  try {
    const response = await fetch(trimmed, { credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) return null;
    return fileFromImageBlob(await response.blob());
  } catch {
    return null;
  }
}

async function readClipboardImage() {
  if (!navigator.clipboard?.read) return null;
  const clipboardItems = await navigator.clipboard.read();

  for (const item of clipboardItems) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (!imageType) continue;
    const file = fileFromImageBlob(await item.getType(imageType));
    if (file) return file;
  }

  for (const item of clipboardItems) {
    if (item.types.includes("text/html")) {
      const html = await (await item.getType("text/html")).text();
      const source = new DOMParser().parseFromString(html, "text/html").querySelector("img")?.getAttribute("src");
      if (source) {
        const file = await fileFromClipboardSource(source);
        if (file) return file;
      }
    }

    const textType = ["text/uri-list", "text/plain"].find((type) => item.types.includes(type));
    if (textType) {
      const source = await (await item.getType(textType)).text();
      const file = await fileFromClipboardSource(source.split("\n").find((line) => !line.startsWith("#")) ?? "");
      if (file) return file;
    }
  }

  return null;
}

function isAiAnalysis(value: unknown): value is AiAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AiAnalysis>;
  return typeof candidate.summary === "string"
    && typeof candidate.confidence === "number"
    && Array.isArray(candidate.findings)
    && Array.isArray(candidate.caseMatches)
    && typeof candidate.caveat === "string";
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualMaker, setManualMaker] = useState("Good Smile Company");
  const [manualMakerOther, setManualMakerOther] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [observations, setObservations] = useState(initialObservations);
  const [files, setFiles] = useState<Partial<Record<EvidenceKey, File>>>({});
  const [fileNames, setFileNames] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [filePreviews, setFilePreviews] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [reviewedEvidence, setReviewedEvidence] = useState<Partial<Record<EvidenceKey, boolean>>>({});
  const [userOverrides, setUserOverrides] = useState<Partial<Record<EvidenceKey, Observation>>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState("");
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    if (!criteriaOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setCriteriaOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [criteriaOpen]);

  const storeEvidenceFile = useCallback(async (key: EvidenceKey, file: File, silent = false) => {
    try {
      const prepared = await prepareImageFile(file);
      const nextPreview = URL.createObjectURL(prepared);
      setFiles((current) => ({ ...current, [key]: prepared }));
      setFileNames((current) => ({ ...current, [key]: prepared.name }));
      setFilePreviews((current) => {
        if (current[key]) URL.revokeObjectURL(current[key]!);
        return { ...current, [key]: nextPreview };
      });
      setObservations((current) => ({ ...current, [key]: "unverified" }));
      setAiAnalysis(null);
      setAnalysisError("");
      setReviewedEvidence({});
      setUserOverrides({});
      return true;
    } catch (error) {
      if (!silent) showToast(error instanceof Error ? error.message : "사진을 추가하지 못했습니다.");
      return false;
    }
  }, [showToast]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return products.filter((product) => {
      const searchable = [product.name, product.englishName, product.number, ...product.aliases]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    }).slice(0, 30);
  }, [query]);
  const isOnePieceQuery = /원피스|one\s*piece/i.test(query);

  const manualMakerValue = manualMaker === "기타" ? manualMakerOther.trim() : manualMaker;
  const manualReady = manualName.trim().length > 1 && manualNumber.trim().length > 0 && manualMakerValue.length > 1;
  const currentProduct: Product | null = selectedProduct ?? (manualReady ? {
    id: "manual",
    name: manualName.trim(),
    englishName: manualName.trim(),
    aliases: [],
    number: manualNumber.trim(),
    maker: manualMakerValue,
    release: "직접 입력",
    image: "",
    officialUrl: "",
    verified: false,
  } : null);

  const completedCount = Object.values(observations).filter((value) => value !== "missing").length;
  const assessedCount = Object.values(observations).filter((value) => value === "match" || value === "concern").length;
  const essentialCompleted = evidenceItems.filter((item) => item.essential && observations[item.key] !== "missing").length;
  const concernItems = evidenceItems.filter((item) => observations[item.key] === "concern");
  const pendingItems = evidenceItems.filter((item) => observations[item.key] === "unverified" || observations[item.key] === "missing");
  const productCases = counterfeitCases.filter((item) => item.productId === currentProduct?.id);
  const productCommunityMentions = communityMentions.filter((item) => item.productId === currentProduct?.id);
  const matchedCaseSignals = productCases.flatMap((item) => item.signals)
    .filter((signal) => observations[signal.evidenceKey] === "concern");
  const hasKnownCaseOverlap = matchedCaseSignals.length > 0;
  const riskPoints = concernItems.reduce((sum, item) => sum + item.weight, 0);
  const confidence = aiAnalysis?.confidence ?? Math.min(96, (currentProduct?.verified ? 18 : 8) + completedCount * 8 + assessedCount * 4);
  const reviewedCount = Object.values(reviewedEvidence).filter(Boolean).length;
  const hasUserOverride = Object.keys(userOverrides).length > 0;

  const calculatedResult = essentialCompleted < 4 || assessedCount < 3
    ? { label: "사진이 더 필요함", tone: "neutral", summary: "핵심 사진을 조금 더 확인해야 합니다." }
    : riskPoints >= 18
      ? { label: "가품 가능성 높음", tone: "danger", summary: hasKnownCaseOverlap ? "확인한 차이 중 알려진 가품 사례와 겹치는 특징이 있습니다." : "공식 제품과 다른 점이 여러 곳에서 보입니다." }
      : riskPoints >= 8
        ? { label: "판정이 애매함", tone: "caution", summary: hasKnownCaseOverlap ? "알려진 가품 사례와 겹치는 항목을 거래 전에 다시 확인하세요." : "거래 전에 다시 볼 항목이 있습니다." }
        : { label: "진품 가능성 높음", tone: "safe", summary: "확인한 사진에서는 큰 차이가 보이지 않습니다." };
  const aiVerdict = aiAnalysis ? {
    likely_authentic: { label: "진품 가능성 높음", tone: "safe", summary: aiAnalysis.summary },
    needs_review: { label: "판정이 애매함", tone: "caution", summary: aiAnalysis.summary },
    counterfeit_suspected: { label: "가품 가능성 높음", tone: "danger", summary: aiAnalysis.summary },
    insufficient_photos: { label: "사진이 더 필요함", tone: "neutral", summary: aiAnalysis.summary },
  }[aiAnalysis.verdict] : null;
  const result = hasUserOverride ? {
    ...calculatedResult,
    summary: `사용자가 수정한 ${Object.keys(userOverrides).length}개 항목을 반영한 결과입니다.`,
  } : (aiVerdict ?? calculatedResult);

  const selectProduct = (product: Product) => {
    if (selectedProduct?.id && selectedProduct.id !== product.id) {
      Object.values(filePreviews).forEach((preview) => preview && URL.revokeObjectURL(preview));
      setFiles({});
      setFileNames({});
      setFilePreviews({});
      setObservations(initialObservations);
      setAiAnalysis(null);
      setAnalysisError("");
      setReviewedEvidence({});
      setUserOverrides({});
    }
    setSelectedProduct(product);
    setQuery(product.name);
    setSearchOpen(false);
    setManualOpen(false);
    setActiveSuggestion(0);
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    if (selectedProduct && value !== selectedProduct.name) setSelectedProduct(null);
    setSearchOpen(true);
    setActiveSuggestion(0);
  };

  const handleSearchKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || filteredProducts.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % filteredProducts.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => (current - 1 + filteredProducts.length) % filteredProducts.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectProduct(filteredProducts[activeSuggestion]);
    }
    if (event.key === "Escape") setSearchOpen(false);
  };

  const handleFile = (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void storeEvidenceFile(key, file);
    event.target.value = "";
  };

  const pasteFromClipboard = async (key: EvidenceKey) => {
    try {
      const file = await readClipboardImage();
      if (file) await storeEvidenceFile(key, file, true);
    } catch {
      return;
    }
  };

  const removeEvidence = (key: EvidenceKey) => {
    if (filePreviews[key]) URL.revokeObjectURL(filePreviews[key]!);
    setObservations((current) => ({ ...current, [key]: "missing" }));
    setFiles((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFileNames((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setFilePreviews((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setAiAnalysis(null);
    setAnalysisError("");
    setReviewedEvidence({});
    setUserOverrides({});
  };

  const sellerMessage = `안녕하세요. 구매 전에 제품 확인용 사진을 부탁드립니다.\n① 박스 정면 ② 박스 뒷면 ③ 바코드 ④ 받침대 밑면 각인 ⑤ 얼굴 근접\n같은 배경에서 오늘 날짜 메모가 보이게 촬영해 주세요.`;

  const copySellerMessage = async () => {
    try {
      await navigator.clipboard.writeText(sellerMessage);
      showToast("사진 요청 문구를 복사했습니다.");
    } catch {
      showToast("복사하지 못했습니다.");
    }
  };

  const analyze = async () => {
    if (!currentProduct || Object.keys(files).length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    const formData = new FormData();
    formData.set("product", JSON.stringify({
      id: currentProduct.id,
      name: currentProduct.name,
      englishName: currentProduct.englishName,
      number: currentProduct.number,
      maker: currentProduct.maker,
      image: currentProduct.image,
      officialUrl: currentProduct.officialUrl,
      verified: currentProduct.verified,
    }));
    formData.set("cases", JSON.stringify(productCases.map(({ id, title, summary, images, signals, sourceType, sourceName, evidenceIds, evidenceSummary, verificationStatus }) => ({
      id,
      title,
      summary,
      images,
      signals,
      sourceType,
      sourceName,
      evidenceIds,
      evidenceSummary,
      verificationStatus,
    }))));
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.set(`evidence:${key}`, file);
    });

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as { analysis?: unknown; error?: string; code?: string } | null;
      if (!response.ok || !isAiAnalysis(payload?.analysis)) {
        throw new Error(payload?.error || "AI 분석 결과를 받지 못했습니다.");
      }

      const analysis = payload.analysis;
      const nextObservations = { ...initialObservations };
      analysis.findings.forEach((finding) => {
        nextObservations[finding.key] = finding.status === "unclear" ? "unverified" : finding.status;
      });
      setObservations(nextObservations);
      setAiAnalysis(analysis);
      setReviewedEvidence({});
      setUserOverrides({});
      setIsAnalyzing(false);
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setIsAnalyzing(false);
      setAnalysisError(error instanceof Error ? error.message : "AI 분석을 시작하지 못했습니다.");
    }
  };

  const reviewFinding = (finding: AiFinding, value: Observation) => {
    const original = finding.status === "unclear" ? "unverified" : finding.status;
    setObservations((current) => ({ ...current, [finding.key]: value }));
    setReviewedEvidence((current) => ({ ...current, [finding.key]: true }));
    setUserOverrides((current) => {
      const next = { ...current };
      if (value === original) delete next[finding.key];
      else next[finding.key] = value;
      return next;
    });
  };

  const shareResult = async () => {
    if (!currentProduct) return;
    const text = `[FIGSIGNAL] ${currentProduct.name}\n${result.label} · 자료 충족도 ${confidence}%\nNo.${currentProduct.number} · 확인한 사진 ${completedCount}장`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FIGSIGNAL 판정 결과", text });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("결과를 복사했습니다.");
    } catch {
      showToast("복사하지 못했습니다.");
    }
  };

  const resetAll = () => {
    Object.values(filePreviews).forEach((preview) => {
      if (preview) URL.revokeObjectURL(preview);
    });
    setStage("search");
    setQuery("");
    setSelectedProduct(null);
    setManualOpen(false);
    setManualName("");
    setManualMaker("Good Smile Company");
    setManualMakerOther("");
    setManualNumber("");
    setObservations(initialObservations);
    setFiles({});
    setFileNames({});
    setFilePreviews({});
    setAiAnalysis(null);
    setAnalysisError("");
    setReviewedEvidence({});
    setUserOverrides({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site">
      <header className="top-header">
        <div className="top-inner">
          <button className="logo" onClick={resetAll}>FIGSIGNAL</button>
          <div className="top-nav">
            <span>넨도로이드 검증</span>
            <button onClick={() => setCriteriaOpen(true)}><FileCheck2 size={16} /> 판정 기준</button>
            <button onClick={resetAll}><Plus size={16} /> 새 검증</button>
          </div>
        </div>
      </header>

      <StepBar stage={stage} />

      {stage === "search" && (
        <section className="search-page page-enter">
          <div className="intro">
            <span>FIGURE CHECK</span>
            <h1>피규어 이름을<br />검색해보세요</h1>
            <p>공식 제품 {products.length}개 · 제품을 고르면 제조사와 번호를 자동으로 찾습니다.</p>
          </div>

          <div className="product-search">
            <div className={`search-input ${searchOpen ? "focused" : ""}`}>
              <Search size={22} />
              <input
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                onKeyDown={handleSearchKeys}
                placeholder="미쿠, 츄야, 헌터..."
                role="combobox"
                aria-expanded={searchOpen && query.trim().length > 0}
                aria-controls="product-suggestions"
                aria-autocomplete="list"
              />
              {query && <button className="clear-query" onClick={() => changeQuery("")} aria-label="검색어 지우기"><X size={18} /></button>}
            </div>

            {searchOpen && query.trim().length > 0 && !selectedProduct && (
              <div className="suggestions" id="product-suggestions" role="listbox">
                {filteredProducts.length > 0 ? <>
                  <div className="suggestion-summary"><span>검색 결과</span><strong>{filteredProducts.length}{filteredProducts.length === 30 ? "+" : ""}개</strong></div>
                  <div className="suggestion-list">
                    {filteredProducts.map((product, index) => (
                      <button
                        key={product.id}
                        className={activeSuggestion === index ? "active" : ""}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectProduct(product)}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        role="option"
                        aria-selected={activeSuggestion === index}
                      >
                        <ProductImage product={product} size="small" />
                        <span><strong>{product.name}</strong><small>{product.englishName}</small></span>
                        <em>No.{product.number}</em>
                      </button>
                    ))}
                  </div>
                </> : (
                  <div className="no-result"><strong>{isOnePieceQuery ? "공식 원피스 넨도로이드는 아직 확인되지 않았어요" : "검색 결과가 없어요"}</strong><button onMouseDown={(event) => event.preventDefault()} onClick={() => { setManualOpen(true); setSearchOpen(false); }}>직접 입력하기</button></div>
                )}
              </div>
            )}
          </div>

          <div className="catalog-shortcuts" aria-label="인기 작품 바로가기">
            {catalogShortcuts.map((shortcut) => (
              <button key={shortcut} onClick={() => changeQuery(shortcut)}>{shortcut}</button>
            ))}
          </div>

          {selectedProduct && (
            <article className="selected-product page-enter">
              <div className="selected-image"><ProductImage product={selectedProduct} size="large" /></div>
              <div className="selected-info">
                <span className="verified-label"><CheckCircle2 size={15} /> 공식 제품 확인</span>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.englishName}</p>
                <dl>
                  <div><dt>제품번호</dt><dd>No.{selectedProduct.number}</dd></div>
                  <div><dt>제조사</dt><dd>{selectedProduct.maker}</dd></div>
                  <div><dt>발매</dt><dd>{selectedProduct.release}</dd></div>
                </dl>
                <div className="selected-links"><a href={selectedProduct.officialUrl} target="_blank" rel="noreferrer">공식 페이지 <ExternalLink size={14} /></a><button onClick={() => { setSelectedProduct(null); setQuery(""); }}>다른 제품 찾기</button></div>
              </div>
            </article>
          )}

          {!selectedProduct && (
            <div className="manual-area">
              <button className="manual-toggle" onClick={() => setManualOpen((current) => !current)}><span>검색 결과에 제품이 없나요?</span><ChevronDown className={manualOpen ? "open" : ""} size={18} /></button>
              {manualOpen && (
                <div className="manual-form page-enter">
                  <div className="form-field"><label htmlFor="manual-name">제품명</label><input id="manual-name" value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="박스에 적힌 제품명" /></div>
                  <div className="form-row">
                    <div className="form-field"><label htmlFor="manual-maker">제조사</label><select id="manual-maker" value={manualMaker} onChange={(event) => setManualMaker(event.target.value)}>{manufacturers.map((maker) => <option key={maker}>{maker}</option>)}</select></div>
                    <div className="form-field"><label htmlFor="manual-number">넨도로이드 번호</label><input id="manual-number" value={manualNumber} onChange={(event) => setManualNumber(event.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 1528" inputMode="numeric" /></div>
                  </div>
                  {manualMaker === "기타" && <div className="form-field"><label htmlFor="manual-maker-other">제조사명</label><input id="manual-maker-other" value={manualMakerOther} onChange={(event) => setManualMakerOther(event.target.value)} placeholder="제조사 직접 입력" /></div>}
                </div>
              )}
            </div>
          )}

          <div className="photo-answer">
            <Camera size={21} />
            <div><strong>사진은 제품을 고를 때 필요 없어요</strong><p>실물 판정 단계에서 핵심 사진만 받습니다.</p></div>
          </div>

          <button className="black-button full" disabled={!currentProduct} onClick={() => { setStage("photos"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>이 제품 확인하기 <ArrowRight size={18} /></button>
        </section>
      )}

      {stage === "photos" && currentProduct && (
        <section className="photos-page page-enter">
          <PageBack onClick={() => setStage("search")} label="제품 다시 선택" />
          <header className="simple-heading"><span>AI 분석</span><h1>핵심 사진만 올려주세요</h1><p>사진이 많을수록 비교할 수 있는 근거가 늘어납니다.</p></header>

          <ProductStrip product={currentProduct} />

          <div className="photo-topline"><div><strong>필수 사진</strong><span>{essentialCompleted}/5</span></div><button onClick={copySellerMessage}><Clipboard size={14} /> 판매자에게 요청</button></div>
          <div className="photo-grid">
            {evidenceItems.filter((item) => item.essential).map((item) => (
              <EvidenceCard key={item.key} item={item} observation={observations[item.key]} fileName={fileNames[item.key]} preview={filePreviews[item.key]} onFile={handleFile} onRemove={removeEvidence} onPaste={pasteFromClipboard} />
            ))}
          </div>

          <details className="optional-photos">
            <summary><span><Plus size={15} /> 추가 사진</span><small>있으면 판정이 더 선명해져요</small><ChevronDown size={17} /></summary>
            <div className="photo-grid optional-grid">
              {evidenceItems.filter((item) => !item.essential).map((item) => (
                <EvidenceCard key={item.key} item={item} observation={observations[item.key]} fileName={fileNames[item.key]} preview={filePreviews[item.key]} onFile={handleFile} onRemove={removeEvidence} onPaste={pasteFromClipboard} />
              ))}
            </div>
          </details>

          <div className="photo-note"><Info size={16} /><span>라이선스 씰은 복제되거나 발매판마다 달라질 수 있어 단독으로 판단하지 않습니다.</span></div>
          {analysisError && <div className="analysis-error" role="alert"><TriangleAlert size={17} /><span><strong>분석을 시작하지 못했어요</strong>{analysisError}</span></div>}
          <button className="black-button full" disabled={completedCount === 0 || isAnalyzing} onClick={analyze}>{isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 사진 분석 중</> : <><ShieldCheck size={18} /> AI로 분석</>}</button>
        </section>
      )}

      {stage === "result" && currentProduct && (
        <section className="result-page page-enter">
          <PageBack onClick={() => setStage("photos")} label="사진 수정" />
          <article className={`verdict-card ${result.tone}`}>
            <div className="verdict-product"><ProductImage product={currentProduct} size="medium" /><span><small>No.{currentProduct.number}</small><strong>{currentProduct.name}</strong><em>{currentProduct.maker}</em></span></div>
            <div className="verdict-copy"><span>{hasUserOverride ? "사용자 확인 반영" : "AI 판정"}</span><h1>{result.label}</h1><p>{result.summary}</p></div>
            <div className="verdict-numbers"><div><strong>{confidence}%</strong><span>자료 충족도</span></div><div><strong>{completedCount}</strong><span>분석 사진</span></div><div><strong>{reviewedCount}/{aiAnalysis?.findings.length ?? assessedCount}</strong><span>사용자 확인</span></div></div>
          </article>

          {aiAnalysis && (
            <AiFindingsSection
              analysis={aiAnalysis}
              observations={observations}
              previews={filePreviews}
              reviewed={reviewedEvidence}
              onReview={reviewFinding}
            />
          )}

          {productCases.length > 0 && (
            <CounterfeitCaseSection cases={productCases} observations={observations} aiMatches={aiAnalysis?.caseMatches ?? []} />
          )}

          {productCommunityMentions.length > 0 && (
            <CommunityMentionsSection mentions={productCommunityMentions} />
          )}

          {pendingItems.some((item) => observations[item.key] === "missing") && <div className="pending-line"><CircleHelp size={16} /><span><strong>올리지 않은 사진</strong>{pendingItems.filter((item) => observations[item.key] === "missing").map((item) => item.title).join(" · ")}</span></div>}

          <section className="lookup-source">
            <div><ShieldCheck size={19} /><span><strong>{currentProduct.verified ? "공식 제품 정보 확인됨" : "직접 입력한 제품"}</strong><small>{currentProduct.verified ? `${currentProduct.maker} · No.${currentProduct.number}` : "공식 제품 페이지를 추가로 확인하세요."}</small></span></div>
            {currentProduct.officialUrl && <a href={currentProduct.officialUrl} target="_blank" rel="noreferrer">공식 페이지 <ExternalLink size={14} /></a>}
          </section>

          <div className="result-actions"><button className="line-button" onClick={shareResult}><Share2 size={17} /> 공유</button><button className="black-button" onClick={resetAll}><RotateCcw size={16} /> 새 검증</button></div>
          <p className="disclaimer">AI 시각 분석과 사용자 확인을 정리한 참고 의견이며 정품 보증서가 아닙니다.</p>
        </section>
      )}

      {criteriaOpen && <VerificationCriteriaDialog onClose={() => setCriteriaOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </main>
  );
}

function StepBar({ stage }: { stage: Stage }) {
  const active = stage === "search" ? 1 : stage === "photos" ? 2 : 3;
  const labels = ["제품 찾기", "사진 확인", "판정 결과"];
  return <div className="step-wrap"><div className="step-bar">{labels.map((label, index) => <div className={`${active === index + 1 ? "active" : ""} ${active > index + 1 ? "done" : ""}`} key={label}><span>{active > index + 1 ? <Check size={12} /> : index + 1}</span><p>{label}</p></div>)}</div></div>;
}

function ProductImage({ product, size }: { product: Product; size: "small" | "medium" | "large" }) {
  if (!product.image) return <div className={`product-image placeholder ${size}`}><ImageIcon size={size === "large" ? 40 : 22} /></div>;
  return <div className={`product-image ${size}`}><img src={product.image} alt={`${product.name} 공식 제품 이미지`} /></div>;
}

function ProductStrip({ product }: { product: Product }) {
  return <article className="product-strip"><ProductImage product={product} size="medium" /><div><span>{product.verified ? "공식 제품" : "직접 입력"}</span><strong>{product.name}</strong><p>No.{product.number} · {product.maker}</p></div>{product.officialUrl && <a href={product.officialUrl} target="_blank" rel="noreferrer" aria-label="공식 제품 페이지"><ExternalLink size={17} /></a>}</article>;
}

function PageBack({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="page-back" onClick={onClick}><ArrowLeft size={17} /> {label}</button>;
}

function EvidenceCard({ item, observation, fileName, preview, onFile, onRemove, onPaste }: {
  item: EvidenceItem;
  observation: Observation;
  fileName?: string;
  preview?: string;
  onFile: (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (key: EvidenceKey) => void;
  onPaste: (key: EvidenceKey) => void;
}) {
  const Icon = item.icon;
  return (
    <article className={`photo-card ${observation}`}>
      <label className="photo-upload">
        <input type="file" accept="image/*" onChange={(event) => onFile(item.key, event)} />
        {preview ? <img src={preview} alt={`${item.title} 업로드 사진`} /> : <div><Icon size={26} /><span>사진 추가</span></div>}
      </label>
      <div className="photo-card-copy"><div><strong>{item.title}</strong>{fileName && <button onClick={() => onRemove(item.key)} aria-label={`${item.title} 삭제`}><X size={14} /></button>}</div><p>{item.description}</p></div>
      {observation !== "missing" && <div className="photo-ready"><ShieldCheck size={13} /> AI 분석 대기</div>}
      <button
        type="button"
        className="paste-target-button"
        onClick={() => void onPaste(item.key)}
        aria-label={`${item.title}에 클립보드 이미지 붙여넣기`}
      >
        <Clipboard size={13} /> 붙여넣기
      </button>
    </article>
  );
}

function VerificationCriteriaDialog({ onClose }: { onClose: () => void }) {
  const verdicts = [
    { label: "진품 가능성 높음", tone: "safe", description: "핵심 사진이 충분하고 공식 정보와 뚜렷한 차이가 보이지 않을 때" },
    { label: "판정이 애매함", tone: "caution", description: "일치·차이 근거가 섞이거나 중요한 표기를 선명하게 읽지 못할 때" },
    { label: "가품 가능성 높음", tone: "danger", description: "공식 제품과 다른 특징이 여러 곳에서 확인되거나 알려진 가품 사례와 겹칠 때" },
    { label: "사진이 더 필요함", tone: "neutral", description: "박스·각인·얼굴 등 핵심 사진이 부족해 비교 근거가 충분하지 않을 때" },
  ];

  return (
    <div className="criteria-backdrop" onMouseDown={onClose}>
      <aside className="criteria-dialog" role="dialog" aria-modal="true" aria-labelledby="criteria-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="criteria-header">
          <div><span>AUTHENTICITY STANDARD</span><h2 id="criteria-title">사용 중인 판정 기준</h2><p>현재 넨도로이드 검증에 실제로 반영되는 기준입니다.</p></div>
          <button autoFocus onClick={onClose} aria-label="판정 기준 닫기"><X size={20} /></button>
        </header>

        <div className="criteria-body">
          <section className="criteria-section">
            <div className="criteria-section-title"><h3>사진에서 확인하는 항목</h3><span>{evidenceItems.length}개</span></div>
            <div className="criteria-list">
              {evidenceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.key}>
                    <div className="criteria-icon"><Icon size={18} /></div>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <small><b>일치</b>{item.matchReason}</small>
                      <small className="concern"><b>차이</b>{item.concernReason}</small>
                    </div>
                    <em>{item.essential ? "핵심" : "보조"}</em>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="criteria-section">
            <div className="criteria-section-title"><h3>함께 비교하는 정보</h3></div>
            <ul className="criteria-rules">
              <li><span>01</span><p><strong>공식 제품 정보</strong>제품명·제조사·제품번호와 공식 전체 외형 이미지를 대조합니다.</p></li>
              <li><span>02</span><p><strong>알려진 가품 사례</strong>같은 제품의 사례가 있을 때만 실제로 겹치는 모양과 표기를 비교합니다.</p></li>
              <li><span>03</span><p><strong>사용자가 올린 원본 사진</strong>사진에서 직접 확인되는 내용만 근거로 사용하고 보이지 않는 부분은 추측하지 않습니다.</p></li>
            </ul>
          </section>

          <section className="criteria-section">
            <div className="criteria-section-title"><h3>판정 원칙</h3></div>
            <div className="principle-box">
              <p>JAN·라이선스 씰·박스 한 장만으로는 진품을 판정하지 않습니다.</p>
              <p>글자나 각인이 흐리면 일치로 처리하지 않고 확인 불가로 남깁니다.</p>
              <p>재판·유통 지역에 따른 패키지 차이가 있을 수 있어 여러 근거를 함께 봅니다.</p>
              <p>표시되는 퍼센트는 정품 확률이 아니라 사진과 자료의 충족도입니다.</p>
            </div>
          </section>

          <section className="criteria-section">
            <div className="criteria-section-title"><h3>결과가 나뉘는 방식</h3></div>
            <div className="verdict-standard-list">
              {verdicts.map((verdict) => <article className={verdict.tone} key={verdict.label}><strong>{verdict.label}</strong><p>{verdict.description}</p></article>)}
            </div>
          </section>
        </div>

        <footer className="criteria-footer"><Info size={14} /><span>AI 시각 분석과 사용자 확인을 돕는 참고 기준이며 제조사의 정품 보증을 대신하지 않습니다.</span></footer>
      </aside>
    </div>
  );
}

function AiFindingsSection({ analysis, observations, previews, reviewed, onReview }: {
  analysis: AiAnalysis;
  observations: Record<EvidenceKey, Observation>;
  previews: Partial<Record<EvidenceKey, string>>;
  reviewed: Partial<Record<EvidenceKey, boolean>>;
  onReview: (finding: AiFinding, value: Observation) => void;
}) {
  const reviewedCount = analysis.findings.filter((finding) => reviewed[finding.key]).length;
  const statusLabel = (status: AiFinding["status"]) => status === "match" ? "일치" : status === "concern" ? "차이 의심" : "확인 불가";

  return (
    <section className="ai-section">
      <header>
        <div><ShieldCheck size={18} /><h2>AI가 찾은 근거</h2></div>
        <span>직접 확인 {reviewedCount}/{analysis.findings.length}</span>
      </header>
      <p className="ai-review-intro">사진에서 실제로 보이는 내용을 확인한 뒤 판정을 선택해 주세요.</p>
      <div className="ai-finding-list">
        {analysis.findings.map((finding) => {
          const current = observations[finding.key];
          const original = finding.status === "unclear" ? "unverified" : finding.status;
          const changed = reviewed[finding.key] && current !== original;
          return (
            <article className={`ai-finding ${finding.status}`} key={finding.key}>
              <div className="ai-finding-thumb">{previews[finding.key] ? <img src={previews[finding.key]} alt={`${finding.title} 분석 사진`} /> : <ImageIcon size={20} />}</div>
              <div className="ai-finding-copy">
                <div className="ai-finding-title"><strong>{finding.title}</strong><span>{statusLabel(finding.status)}</span></div>
                <p>{finding.reason}</p>
                <dl><dt>사진 근거</dt><dd>{finding.visibleEvidence}</dd></dl>
                {finding.userAction && finding.status !== "match" && <dl><dt>다음 확인</dt><dd>{finding.userAction}</dd></dl>}
                <div className="review-controls" aria-label={`${finding.title} 사용자 확인`}>
                  <span>{reviewed[finding.key] ? (changed ? "수정됨" : "확인됨") : "내가 확인"}</span>
                  <button className={reviewed[finding.key] && current === "match" ? "active match" : ""} onClick={() => onReview(finding, "match")}><Check size={12} /> 일치</button>
                  <button className={reviewed[finding.key] && current === "concern" ? "active concern" : ""} onClick={() => onReview(finding, "concern")}><TriangleAlert size={12} /> 차이</button>
                  <button className={reviewed[finding.key] && current === "unverified" ? "active" : ""} onClick={() => onReview(finding, "unverified")}>모름</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="ai-caveat">{analysis.caveat}</p>
    </section>
  );
}

function CounterfeitCaseSection({ cases, observations, aiMatches }: {
  cases: CounterfeitCase[];
  observations: Record<EvidenceKey, Observation>;
  aiMatches: AiAnalysis["caseMatches"];
}) {
  const [preview, setPreview] = useState<{ caseId: string; imageIndex: number } | null>(null);
  const overlapCount = cases.flatMap((item) => item.signals)
    .filter((signal) => observations[signal.evidenceKey] === "concern").length;
  const aiMatchCount = aiMatches.filter((match) => match.similarity !== "low" && cases.some((item) => item.id === match.caseId)).length;
  const previewCase = preview ? cases.find((item) => item.id === preview.caseId) : null;

  const movePreview = useCallback((direction: -1 | 1) => {
    setPreview((current) => {
      if (!current) return current;
      const currentCase = cases.find((item) => item.id === current.caseId);
      if (!currentCase || currentCase.images.length < 2) return current;
      return {
        ...current,
        imageIndex: (current.imageIndex + direction + currentCase.images.length) % currentCase.images.length,
      };
    });
  }, [cases]);

  useEffect(() => {
    if (!preview) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
      if (event.key === "ArrowLeft") movePreview(-1);
      if (event.key === "ArrowRight") movePreview(1);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [movePreview, preview]);

  return (
    <>
      <section className="case-section">
        <header>
          <div><TriangleAlert size={18} /><h2>공식·커뮤니티 가품 사례</h2></div>
          <span>{aiMatchCount > 0 ? `AI가 ${aiMatchCount}건의 유사 사례 확인` : overlapCount > 0 ? `현재 사진과 ${overlapCount}개 특징 겹침` : `${cases.length}건 등록`}</span>
        </header>

        {cases.map((item) => {
          const overlappingSignals = item.signals.filter((signal) => observations[signal.evidenceKey] === "concern");
          const aiMatch = aiMatches.find((match) => match.caseId === item.id && match.similarity !== "low");
          const hasOverlap = overlappingSignals.length > 0 || Boolean(aiMatch);

          return (
            <article className={`case-card ${hasOverlap ? "overlap" : ""}`} key={item.id}>
              <div className={`case-images count-${Math.min(item.images.length, 4)}`}>
                {item.images.map((image, index) => (
                  <button
                    type="button"
                    className="case-image-button"
                    onClick={() => setPreview({ caseId: item.id, imageIndex: index })}
                    aria-label={`${item.title} 비교 사진 ${index + 1} 크게 보기`}
                    key={`${image}-${index}`}
                  >
                    <img src={image} alt={`${item.title} 비교 사진 ${index + 1}`} loading="lazy" />
                    <span>{index + 1}</span>
                    <ZoomIn size={16} />
                  </button>
                ))}
              </div>
              <div className="case-copy">
                <span className={`case-status ${hasOverlap ? "matched" : ""}`}>
                  {aiMatch ? "AI가 유사 특징을 찾은 사례" : hasOverlap ? "현재 매물과 겹치는 사례" : "비교 참고 사례"}
                </span>
                <div className="case-meta">
                  <span className={`case-source ${item.sourceType}`}>
                    {item.sourceType === "official" ? "공식 제조사 자료" : "실물 비교 사례"}
                  </span>
                  <a className="case-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                    {item.sourceName} 원문 <ExternalLink size={11} />
                  </a>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul>
                  {item.signals.map((signal) => {
                    const signalMatches = observations[signal.evidenceKey] === "concern" || Boolean(aiMatch?.evidenceKeys.includes(signal.evidenceKey));
                    return (
                      <li className={signalMatches ? "matched" : ""} key={`${signal.evidenceKey}-${signal.label}`}>
                        {signalMatches ? <TriangleAlert size={13} /> : <span />}
                        <strong>{signal.label}</strong>
                        {signalMatches && <em>겹침</em>}
                      </li>
                    );
                  })}
                </ul>
                {hasOverlap && (
                  <div className="case-conclusion">
                    <strong>{aiMatch ? "AI가 찾은 사례 근거" : "가품 쪽 근거로 확인 필요"}</strong>
                    <p>{aiMatch?.reason ?? "사진에서 `달라요`로 표시한 항목이 알려진 사례의 특징과 겹칩니다."}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        <p className="case-note">사례는 판정 근거 중 하나입니다. 모양이 다르다고 정품이라는 뜻은 아니므로 사진과 실물을 함께 비교하세요.</p>
      </section>

      {preview && previewCase && typeof document !== "undefined" && createPortal(
        <div className="case-lightbox-backdrop" onMouseDown={() => setPreview(null)}>
          <section
            className="case-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-lightbox-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>비교 사진 {preview.imageIndex + 1} / {previewCase.images.length}</span>
                <h2 id="case-lightbox-title">{previewCase.title}</h2>
              </div>
              <button type="button" autoFocus onClick={() => setPreview(null)} aria-label="비교 사진 닫기"><X size={20} /></button>
            </header>
            <div className="case-lightbox-stage">
              {previewCase.images.length > 1 && (
                <button type="button" className="case-lightbox-arrow previous" onClick={() => movePreview(-1)} aria-label="이전 비교 사진"><ArrowLeft size={22} /></button>
              )}
              <img src={previewCase.images[preview.imageIndex]} alt={`${previewCase.title} 비교 사진 ${preview.imageIndex + 1} 확대`} />
              {previewCase.images.length > 1 && (
                <button type="button" className="case-lightbox-arrow next" onClick={() => movePreview(1)} aria-label="다음 비교 사진"><ArrowRight size={22} /></button>
              )}
            </div>
            {previewCase.images.length > 1 && (
              <footer aria-label="비교 사진 목록">
                {previewCase.images.map((image, index) => (
                  <button
                    type="button"
                    className={preview.imageIndex === index ? "active" : ""}
                    onClick={() => setPreview({ caseId: previewCase.id, imageIndex: index })}
                    aria-label={`비교 사진 ${index + 1} 보기`}
                    aria-current={preview.imageIndex === index ? "true" : undefined}
                    key={`${image}-preview-${index}`}
                  >
                    <img src={image} alt="" />
                    <span>{index + 1}</span>
                  </button>
                ))}
              </footer>
            )}
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

const communitySignalLabels: Record<string, string> = {
  packaging: "패키지",
  paint: "도색·마감",
  joint: "관절",
  mold: "조형·몰드",
  face: "얼굴 인쇄",
  price: "가격",
  logo: "로고",
  barcode: "바코드·JAN",
  base: "받침대",
  copyright: "저작권 표기",
  blister: "내부 포장",
};

function CommunityMentionsSection({ mentions }: { mentions: CommunityMention[] }) {
  return (
    <details className="community-mentions">
      <summary>
        <span className="community-summary-title">
          <MessageCircle size={18} />
          <span><strong>관련 커뮤니티 언급</strong><small>검증 전 참고자료 {mentions.length}건</small></span>
        </span>
        <span className="community-impact">판정 미반영</span>
        <ChevronDown className="community-chevron" size={17} />
      </summary>
      <div className="community-mentions-body">
        <p className="community-caution"><Info size={15} /> 커뮤니티 게시물의 주장과 질문은 사실 확인 전 자료입니다. AI 판정과 점수에는 사용하지 않았으며, 제품이 같은지 확인된 원문만 참고용으로 연결했습니다.</p>
        <div className="community-mention-list">
          {mentions.map((mention) => {
            const signalLabels = [...new Set(mention.signalTags.map((tag) => communitySignalLabels[tag]).filter(Boolean))];
            const publishedDate = mention.sourcePublishedAt?.slice(0, 10).replaceAll("-", ".");
            return (
              <article key={mention.mentionId}>
                <div className="community-mention-meta">
                  <span className={`community-status ${mention.status}`}>{mention.statusLabel}</span>
                  <span>검증 전</span>
                </div>
                <h3>{mention.publicTitle}</h3>
                <p>{mention.publicSummary}</p>
                {(signalLabels.length > 0 || mention.imageReferenceCount > 0) && (
                  <div className="community-mention-signals">
                    {signalLabels.map((label) => <span key={label}>{label} 언급</span>)}
                    {mention.imageReferenceCount > 0 && <span>원문 이미지 {mention.imageReferenceCount}장</span>}
                  </div>
                )}
                <div className="community-mention-source">
                  <span>{publishedDate ?? "게시일 미확인"}</span>
                  <a href={mention.sourceUrl} target="_blank" rel="noreferrer">외부 커뮤니티 원문 <ExternalLink size={12} /></a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </details>
  );
}
