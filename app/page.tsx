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
  Clock3,
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
import {
  isAnalysisResult,
  type AnalysisFinding,
  type AnalysisResult,
  type EvidenceKey,
} from "./api/analyze/analysis-contract";
import { displayableCaseImages } from "./case-image-rights";
import { expandedProducts } from "./catalog";
import { communityMentions, type CommunityMention } from "./community-mentions";
import {
  counterfeitCases,
  type CounterfeitCase,
  type CounterfeitCaseKind,
} from "./counterfeit-cases";
import { resolveReviewPath, reviewPathCopy, type ReviewPath } from "./review-path";
import {
  parseVerificationHistoryItem,
  verificationVerdictCopy,
  type VerificationHistoryItem,
} from "./verification-history";

type Stage = "search" | "photos" | "result";
type Observation = "missing" | "unverified" | "match" | "concern";

type Product = {
  id: string;
  name: string;
  englishName: string;
  aliases: string[];
  number: string;
  maker: string;
  release: string;
  image: string;
  imageSource?: "official" | "none";
  imageSourceUrl?: string;
  officialUrl: string;
  verified: boolean;
  series?: string;
  seriesName?: string;
  englishSeriesName?: string;
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

type AiFinding = AnalysisFinding;
type AiAnalysis = AnalysisResult;

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

const expandedProductsById = new Map(expandedProducts.map((product) => [product.id, product]));
const curatedProductIds = new Set(curatedProducts.map((product) => product.id));
const products: Product[] = [
  ...curatedProducts.map((product) => ({ ...expandedProductsById.get(product.id), ...product })),
  ...expandedProducts.filter((product) => !curatedProductIds.has(product.id)),
];

function seriesLabel(product: Product) {
  const korean = product.seriesName?.trim();
  const english = product.englishSeriesName?.trim();
  if (!korean) return english ?? "";
  if (!english || korean.toLowerCase() === english.toLowerCase()) return korean;
  return `${korean} · ${english}`;
}

const catalogShortcuts = ["히로아카", "봇치 더 록", "귀멸의 칼날", "주술회전", "체인소맨", "나루토", "블리치"];

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
    matchReason: "제품명과 번호가 판독되며 등록된 위험 신호가 뚜렷하지 않습니다.",
    concernReason: "제품명·번호가 선택한 상품과 충돌하거나 등록 사례의 누락 신호가 보입니다.",
    weight: 7,
    essential: true,
    icon: Box,
  },
  {
    key: "boxBack",
    title: "박스 뒷면",
    description: "주의문구와 저작권 표기",
    matchReason: "주의문구와 저작권 표기가 판독되며 등록된 누락 신호가 뚜렷하지 않습니다.",
    concernReason: "저작권·주의문구에 등록 사례의 누락 또는 인쇄 위험 신호가 보입니다.",
    weight: 9,
    essential: true,
    icon: PackageCheck,
  },
  {
    key: "barcode",
    title: "바코드",
    description: "JAN 숫자가 선명하게",
    matchReason: "JAN 숫자가 판독 가능해 공식 원문과 추가 대조할 수 있습니다.",
    concernReason: "JAN 또는 함께 인쇄된 제품번호가 선택한 상품 정보와 충돌합니다.",
    weight: 11,
    essential: true,
    icon: ScanBarcode,
  },
  {
    key: "baseMark",
    title: "받침대 각인",
    description: "바닥의 저작권 문구",
    matchReason: "받침대 각인이 판독되며 등록된 누락 신호가 뚜렷하지 않습니다.",
    concernReason: "각인 누락이나 받침대 구조에 등록 사례와 겹치는 위험 신호가 보입니다.",
    weight: 13,
    essential: true,
    icon: Stamp,
  },
  {
    key: "facePaint",
    title: "얼굴 근접",
    description: "눈과 도색이 보이게",
    matchReason: "눈 인쇄와 도색 경계가 판독되며 등록된 위험 신호가 뚜렷하지 않습니다.",
    concernReason: "눈 인쇄나 도색에 등록 사례와 겹치는 위험 신호가 보입니다.",
    weight: 13,
    essential: true,
    icon: ScanFace,
  },
  {
    key: "figureFull",
    title: "본체 전체",
    description: "앞뒤 조형과 부품 위치",
    matchReason: "본체 비율과 부품 위치가 판독 가능한 상태입니다.",
    concernReason: "조형 비율이나 부품 위치에 등록 사례와 겹치는 위험 신호가 보입니다.",
    weight: 8,
    essential: false,
    icon: Camera,
  },
  {
    key: "parts",
    title: "구성품",
    description: "블리스터와 교체 파츠",
    matchReason: "블리스터와 교체 파츠 구성을 추가 대조할 수 있게 확인했습니다.",
    concernReason: "내부 포장이나 교체 파츠에 등록 사례와 겹치는 누락·형태 신호가 보입니다.",
    weight: 8,
    essential: false,
    icon: FileCheck2,
  },
  {
    key: "purchaseProof",
    title: "구매내역",
    description: "판매처와 상품명",
    matchReason: "판매처와 상품명이 판독 가능하며 선택한 제품 정보와 충돌하지 않습니다.",
    concernReason: "구매내역의 상품명이 선택한 제품과 충돌하거나 판매처 확인이 필요합니다.",
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
  return isAnalysisResult(value);
}

async function fetchRecentVerifications() {
  const response = await fetch("/api/verifications?limit=6", { cache: "no-store" });
  const payload = await response.json().catch(() => null) as { verifications?: unknown } | null;
  if (!response.ok || !Array.isArray(payload?.verifications)) throw new Error("Invalid history response");
  return payload.verifications.flatMap((item) => {
    const parsed = parseVerificationHistoryItem(item);
    return parsed ? [parsed] : [];
  });
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
  const [reviewRequestShared, setReviewRequestShared] = useState(false);
  const [toast, setToast] = useState("");
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<VerificationHistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reportConsent, setReportConsent] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const loadRecentVerifications = useCallback(async () => {
    try {
      setRecentVerifications(await fetchRecentVerifications());
      setHistoryStatus("ready");
    } catch {
      setHistoryStatus("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchRecentVerifications()
      .then((items) => {
        if (!active) return;
        setRecentVerifications(items);
        setHistoryStatus("ready");
      })
      .catch(() => {
        if (active) setHistoryStatus("error");
      });
    return () => {
      active = false;
    };
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
      setReviewRequestShared(false);
      setReportConsent(false);
      setSavedReportId(null);
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
      const searchable = [product.name, product.englishName, product.number, product.seriesName, product.englishSeriesName, ...product.aliases]
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
  const aiProductCases = productCases.filter((item) => item.verdictImpact !== "none");
  const productCommunityMentions = communityMentions.filter((item) => item.productId === currentProduct?.id);
  const matchedCaseSignals = aiProductCases.flatMap((item) => item.signals)
    .filter((signal) => observations[signal.evidenceKey] === "concern");
  const hasKnownCaseOverlap = matchedCaseSignals.length > 0;
  const reviewedCount = Object.values(reviewedEvidence).filter(Boolean).length;
  const hasUserOverride = Object.keys(userOverrides).length > 0;
  const evidenceReady = essentialCompleted >= 4;
  const reviewPath = resolveReviewPath({
    supported: Boolean(currentProduct?.verified),
    evidenceReady,
    analysisNeedsPhotos: aiAnalysis?.verdict === "insufficient_photos",
    analysisNeedsReview: aiAnalysis?.verdict === "needs_review",
    hasRiskSignals: concernItems.length > 0,
    hasComparisonCases: aiProductCases.length > 0,
  });
  const reviewPathResult = reviewPathCopy[reviewPath];
  const photoActions = evidenceItems.flatMap((item) => {
    if (!item.essential) return [];
    if (observations[item.key] === "missing") {
      return [{ key: item.key, title: item.title, description: item.description }];
    }
    const unclearFinding = aiAnalysis?.findings.find((finding) => finding.key === item.key && finding.status === "unclear");
    return unclearFinding
      ? [{ key: item.key, title: unclearFinding.title, description: unclearFinding.userAction }]
      : [];
  });

  const calculatedResult = concernItems.length > 0
    ? { label: "가품 가능성 높음", tone: "danger", summary: hasKnownCaseOverlap ? "명확한 비정상 신호가 알려진 가품 사례의 특징과 겹칩니다." : "하나 이상의 명확한 비정상 신호가 확인됐습니다." }
    : essentialCompleted < 4 || assessedCount < 3
      ? { label: "사진이 더 필요함", tone: "neutral", summary: "핵심 사진을 조금 더 확인해야 합니다." }
      : { label: "뚜렷한 위험 신호 미확인", tone: "safe", summary: "확인한 사진에서 뚜렷한 가품 위험 신호는 보이지 않습니다. 정품 확인을 뜻하지는 않습니다." };
  const aiVerdict = aiAnalysis ? {
    no_obvious_risk_signals: { label: "뚜렷한 위험 신호 미확인", tone: "safe", summary: aiAnalysis.summary },
    needs_review: { label: "판정이 애매함", tone: "caution", summary: aiAnalysis.summary },
    counterfeit_suspected: { label: "가품 가능성 높음", tone: "danger", summary: aiAnalysis.summary },
    insufficient_photos: { label: "사진이 더 필요함", tone: "neutral", summary: aiAnalysis.summary },
  }[aiAnalysis.verdict] : null;
  const result = hasUserOverride ? {
    ...calculatedResult,
    summary: `사용자가 수정한 ${Object.keys(userOverrides).length}개 항목을 반영한 결과입니다.`,
  } : (aiVerdict ?? calculatedResult);
  const verdictCardResult = reviewPath === "unsupported" ? {
    label: "판정할 수 없음",
    tone: "neutral",
    summary: "현재 지원 범위에 필요한 공식 제품 정보와 기준 자료가 없습니다.",
  } : result;

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
      setReviewRequestShared(false);
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
    setReviewRequestShared(false);
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
    if (!currentProduct) return;
    if (!currentProduct.verified || !evidenceReady) {
      setAiAnalysis(null);
      setAnalysisError("");
      setReviewRequestShared(false);
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (Object.keys(files).length === 0) return;
    if (!reportConsent) {
      showToast("사진이 포함된 공개 리포트 저장에 동의해 주세요.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError("");
    const formData = new FormData();
    formData.set("product", JSON.stringify({ id: currentProduct.id }));
    formData.set("publishReport", "true");
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.set(`evidence:${key}`, file);
    });

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as {
        analysis?: unknown;
        verification?: unknown;
        error?: string;
        code?: string;
      } | null;
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
      const savedVerification = parseVerificationHistoryItem(payload?.verification);
      if (savedVerification) {
        setRecentVerifications((current) => [
          savedVerification,
          ...current.filter((item) => item.id !== savedVerification.id),
        ].slice(0, 6));
        setHistoryStatus("ready");
        setSavedReportId(savedVerification.id);
      } else {
        showToast("분석은 완료됐지만 공개 리포트를 저장하지 못했습니다.");
      }
      setReviewedEvidence({});
      setUserOverrides({});
      setReviewRequestShared(false);
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
    const reportUrl = savedReportId ? `${window.location.origin}/reports/${savedReportId}` : "";
    const text = [
      `[FIGSIGNAL] ${currentProduct.name}`,
      `${reviewPathResult.label}${aiAnalysis ? ` · AI 위험 신호: ${result.label}` : ""}`,
      `No.${currentProduct.number} · 확인한 사진 ${completedCount}장`,
      reportUrl,
    ].filter(Boolean).join("\n");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FIGSIGNAL 판정 결과",
          text,
          ...(reportUrl ? { url: reportUrl } : {}),
        });
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

  const shareReviewRequest = async () => {
    if (!currentProduct || !aiAnalysis) return;
    const reviewFindings = aiAnalysis.findings
      .filter((finding) => finding.status !== "match")
      .map((finding) => `- ${finding.title}: ${finding.reason}`)
      .join("\n");
    const text = [
      "[FIGSIGNAL 추가 검토 요청]",
      `${currentProduct.name} · No.${currentProduct.number}`,
      `제조사: ${currentProduct.maker}`,
      `AI 위험 신호: ${result.label} · 확인한 사진 ${completedCount}장`,
      "명확한 비정상 신호는 없지만 판본 또는 서로 충돌하는 근거가 남아 추가 검토를 요청합니다.",
      reviewFindings ? `\n확인이 필요한 항목\n${reviewFindings}` : "",
      "\n이 요청은 사진 기반 참고 의견이며 정품 보증서가 아닙니다.",
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "FIGSIGNAL 추가 검토 요청", text });
        setReviewRequestShared(true);
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setReviewRequestShared(true);
      showToast("추가 검토 요청서를 복사했습니다.");
    } catch {
      showToast("요청서를 복사하지 못했습니다.");
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
    setReviewRequestShared(false);
    setReportConsent(false);
    setSavedReportId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site">
      <header className="top-header">
        <div className="top-inner">
          <button className="logo" onClick={resetAll}>FIGSIGNAL</button>
          <div className="top-nav">
            <span>넨도로이드 검증</span>
            <button onClick={() => {
              if (stage !== "search") resetAll();
              window.setTimeout(() => document.getElementById("recent-verifications")?.scrollIntoView({ behavior: "smooth" }), 0);
            }}><Clock3 size={16} /> 최근 사례</button>
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
                        <span><strong>{product.name}</strong><small>{seriesLabel(product) || product.englishName}</small></span>
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
                  {seriesLabel(selectedProduct) && <div><dt>작품</dt><dd>{seriesLabel(selectedProduct)}</dd></div>}
                  <div><dt>제조사</dt><dd>{selectedProduct.maker}</dd></div>
                  <div><dt>발매</dt><dd>{selectedProduct.release}</dd></div>
                  <div><dt>대표 이미지</dt><dd>{selectedProduct.imageSource === "official" ? "제조사 원본" : "확인 가능한 공식 이미지 없음"}</dd></div>
                </dl>
                <div className="selected-links">{selectedProduct.officialUrl && <a href={selectedProduct.officialUrl} target="_blank" rel="noreferrer">제품 정보 페이지 <ExternalLink size={14} /></a>}<button onClick={() => { setSelectedProduct(null); setQuery(""); }}>다른 제품 찾기</button></div>
              </div>
            </article>
          )}

          {!selectedProduct && (
            <div className="manual-area">
              <button className="manual-toggle" onClick={() => setManualOpen((current) => !current)}><span>검색 결과에 제품이 없나요?</span><ChevronDown className={manualOpen ? "open" : ""} size={18} /></button>
              {manualOpen && (
                <div className="manual-form page-enter">
                  <div className="manual-support-notice"><CircleHelp size={16} /><span><strong>직접 입력 제품은 현재 지원 범위 밖으로 안내합니다.</strong>공식 카탈로그와 제품별 기준 사례가 확보되면 검증 대상으로 전환할 수 있습니다.</span></div>
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

          <button className="black-button full" disabled={!currentProduct} onClick={() => { setStage(currentProduct?.verified ? "photos" : "result"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>이 제품 확인하기 <ArrowRight size={18} /></button>

          <RecentVerificationSection
            items={recentVerifications}
            status={historyStatus}
            onRetry={loadRecentVerifications}
          />
        </section>
      )}

      {stage === "photos" && currentProduct && (
        <section className="photos-page page-enter">
          <PageBack onClick={() => setStage("search")} label="제품 다시 선택" />
          <header className="simple-heading"><span>AI 분석</span><h1>핵심 사진만 올려주세요</h1><p>사진이 많을수록 비교할 수 있는 근거가 늘어납니다.</p></header>

          <ProductStrip product={currentProduct} />

          <div className={`review-route-preview ${aiProductCases.length > 0 ? "known" : "new"}`}>
            {aiProductCases.length > 0 ? <FileCheck2 size={18} /> : <MessageCircle size={18} />}
            <span>
              <strong>{aiProductCases.length > 0 ? `제품별 비교 사례 ${aiProductCases.length}건` : "범용 전문가 패턴으로 분석"}</strong>
              <small>{aiProductCases.length > 0 ? "사진 분석 후 등록 사례와 공통점과 차이점을 보여드립니다." : "제품별 사례가 없어도 공식·검수 사례에서 정리한 범용 위험 패턴으로 결론을 냅니다."}</small>
            </span>
          </div>

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
          <label className={`report-consent ${reportConsent ? "checked" : ""}`}>
            <input type="checkbox" checked={reportConsent} onChange={(event) => setReportConsent(event.target.checked)} />
            <span><strong>사진이 포함된 공개 검증 리포트 저장에 동의합니다.</strong>검증 사진과 판정 근거는 고유한 읽기 전용 리포트로 공개됩니다. 구매내역 사진은 저장하지 않으며, 사진 속 이름·주소 등 개인정보는 직접 가린 뒤 올려주세요.</span>
          </label>
          {analysisError && <div className="analysis-error" role="alert"><TriangleAlert size={17} /><span><strong>분석을 시작하지 못했어요</strong>{analysisError}</span></div>}
          <button className="black-button full" disabled={completedCount === 0 || isAnalyzing || (evidenceReady && !reportConsent)} onClick={analyze}>{isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 사진 분석 중</> : evidenceReady && !reportConsent ? <><FileCheck2 size={18} /> 공개 리포트 동의 필요</> : evidenceReady ? <><ShieldCheck size={18} /> AI로 분석하기</> : <><CircleHelp size={18} /> 부족한 사진 확인</>}</button>
        </section>
      )}

      {stage === "result" && currentProduct && (
        <section className="result-page page-enter">
          <PageBack onClick={reviewPath === "unsupported" ? resetAll : () => setStage("photos")} label={reviewPath === "unsupported" ? "제품 다시 선택" : "사진 수정"} />
          <article className={`verdict-card ${verdictCardResult.tone}`}>
            <div className="verdict-product"><ProductImage product={currentProduct} size="medium" /><span><small>No.{currentProduct.number}</small><strong>{currentProduct.name}</strong><em>{currentProduct.maker}</em></span></div>
            <div className="verdict-copy"><span>{hasUserOverride ? "사용자 확인 반영" : aiAnalysis ? "AI 판정" : "검토 결과"}</span><h1>{verdictCardResult.label}</h1><p>{verdictCardResult.summary}</p></div>
            <div className="verdict-numbers"><div><strong>{completedCount}</strong><span>분석 사진</span></div><div><strong>{reviewedCount}/{aiAnalysis?.findings.length ?? assessedCount}</strong><span>사용자 확인</span></div></div>
          </article>

          <ReviewPathSection
            path={reviewPath}
            product={currentProduct}
            comparisonCaseCount={aiProductCases.length}
            matchedCaseCount={aiAnalysis?.caseMatches.length ?? 0}
            riskSignalCount={concernItems.length}
            photoActions={photoActions}
            reviewRequestShared={reviewRequestShared}
            onAddPhotos={() => { setStage("photos"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            onShareReviewRequest={shareReviewRequest}
            onSelectAnotherProduct={resetAll}
          />

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

          {reviewPath !== "more_photos_needed" && reviewPath !== "unsupported" && pendingItems.some((item) => observations[item.key] === "missing") && <div className="pending-line"><CircleHelp size={16} /><span><strong>올리지 않은 사진</strong>{pendingItems.filter((item) => observations[item.key] === "missing").map((item) => item.title).join(" · ")}</span></div>}

          <section className="lookup-source">
            <div><ShieldCheck size={19} /><span><strong>{currentProduct.verified ? "공식 제품 정보 확인됨" : "직접 입력한 제품"}</strong><small>{currentProduct.verified ? [seriesLabel(currentProduct), currentProduct.maker, `No.${currentProduct.number}`].filter(Boolean).join(" · ") : "공식 제품 페이지를 추가로 확인하세요."}</small></span></div>
            {currentProduct.officialUrl && <a href={currentProduct.officialUrl} target="_blank" rel="noreferrer">제품 정보 페이지 <ExternalLink size={14} /></a>}
          </section>

          <div className="result-actions">{savedReportId && <a className="line-button" href={`/reports/${savedReportId}`}><FileCheck2 size={17} /> 읽기 전용 리포트</a>}<button className="line-button" onClick={shareResult}><Share2 size={17} /> 공유</button><button className="black-button" onClick={resetAll}><RotateCcw size={16} /> 새 검증</button></div>
          <p className="disclaimer">AI 시각 분석과 사용자 확인을 정리한 참고 의견이며 정품 보증서가 아닙니다.</p>
        </section>
      )}

      {criteriaOpen && <VerificationCriteriaDialog onClose={() => setCriteriaOpen(false)} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </main>
  );
}

function formatVerificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "최근";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function RecentVerificationSection({
  items,
  status,
  onRetry,
}: {
  items: VerificationHistoryItem[];
  status: "loading" | "ready" | "error";
  onRetry: () => Promise<void>;
}) {
  return (
    <section className="recent-verifications" id="recent-verifications" aria-labelledby="recent-verifications-title">
      <header>
        <div>
          <span>RECENT CHECKS</span>
          <h2 id="recent-verifications-title">최근 검증 사례</h2>
          <p>실제 검증 사진과 판정 근거를 읽기 전용 리포트로 확인하세요.</p>
        </div>
        {items.length > 0 && <em>최근 {items.length}건</em>}
      </header>

      {status === "loading" && items.length === 0 && (
        <div className="recent-state" role="status"><LoaderCircle className="spin" size={18} /> 최근 사례를 불러오는 중이에요.</div>
      )}
      {status === "error" && items.length === 0 && (
        <div className="recent-state error"><TriangleAlert size={18} /><span>최근 사례를 불러오지 못했어요.</span><button onClick={() => void onRetry()}>다시 시도</button></div>
      )}
      {status === "ready" && items.length === 0 && (
        <div className="recent-state empty"><Clock3 size={20} /><span><strong>아직 저장된 검증 사례가 없어요</strong>첫 검증이 완료되면 여기에 결과가 쌓입니다.</span></div>
      )}

      {items.length > 0 && (
        <div className="recent-verification-list">
          {items.map((item) => {
            const verdict = verificationVerdictCopy[item.verdict];
            const productImage = expandedProductsById.get(item.productId)?.image ?? "";
            return (
              <a key={item.id} className={`recent-verification-card ${verdict.tone}`} href={`/reports/${item.id}`}>
                <span className="recent-verification-thumb">{productImage ? <img src={productImage} alt={`${item.productName} 공식 제품 이미지`} /> : <ImageIcon size={22} />}</span>
                <span className="recent-verification-copy">
                  <small><time dateTime={item.createdAt}>{formatVerificationDate(item.createdAt)}</time> · No.{item.productNumber}</small>
                  <strong>{item.productName}</strong>
                </span>
                <span className="recent-verification-verdict">{verdict.label}</span>
                <ArrowRight size={17} />
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ReviewPathSection({
  path,
  product,
  comparisonCaseCount,
  matchedCaseCount,
  riskSignalCount,
  photoActions,
  reviewRequestShared,
  onAddPhotos,
  onShareReviewRequest,
  onSelectAnotherProduct,
}: {
  path: ReviewPath;
  product: Product;
  comparisonCaseCount: number;
  matchedCaseCount: number;
  riskSignalCount: number;
  photoActions: Array<{ key: EvidenceKey; title: string; description: string }>;
  reviewRequestShared: boolean;
  onAddPhotos: () => void;
  onShareReviewRequest: () => void;
  onSelectAnotherProduct: () => void;
}) {
  if (path === "risk_detected") {
    return (
      <section className="review-path-panel risk-detected">
        <div className="review-path-heading"><TriangleAlert size={21} /><span><strong>명확한 비정상 신호 {riskSignalCount}개를 감지했어요</strong><small>제품별 비교 사례가 없어도 이 신호는 최종 위험 판정에 반영됩니다.</small></span></div>
        <p>아래 항목에서 사진에 실제로 보인 내용과 위험 판단 이유를 확인하세요. 이 결과는 가품 확정이 아니라 거래를 중단하고 판매자·제조사 확인을 우선하라는 높은 위험 경고입니다.</p>
      </section>
    );
  }

  if (path === "case_comparison") {
    return (
      <section className="review-path-panel comparison">
        <div className="review-path-heading"><FileCheck2 size={21} /><span><strong>등록 사례 {comparisonCaseCount}건과 비교했어요</strong><small>{matchedCaseCount > 0 ? `현재 사진과 시각적으로 겹치는 사례 ${matchedCaseCount}건을 찾았습니다.` : "현재 사진과 직접 겹치는 사례 특징은 확인되지 않았습니다."}</small></span></div>
        <p>비교 결과와 원문 근거는 아래 사례 카드에서 확인할 수 있습니다. 등록 사례와 다르다는 이유만으로 정품을 보증하지는 않습니다.</p>
      </section>
    );
  }

  if (path === "additional_review") {
    return (
      <section className="review-path-panel additional">
        <div className="review-path-heading"><MessageCircle size={21} /><span><strong>판본 또는 근거를 한 번 더 확인해 주세요</strong><small>명확한 비정상 신호는 없지만 서로 충돌하는 정보가 남아 있습니다.</small></span></div>
        <ol className="review-path-steps">
          <li><span>1</span><p><strong>1차 분석 완료</strong>공식 제품 정보와 범용·제품별 위험 신호를 모두 확인했습니다.</p></li>
          <li><span>2</span><p><strong>추가 의견 요청</strong>아래 요청서를 커뮤니티 또는 전문가에게 공유해 검토를 이어갈 수 있습니다.</p></li>
          <li><span>3</span><p><strong>사례로 축적</strong>확인된 근거는 이후 같은 제품을 검토할 때 사용할 수 있습니다.</p></li>
        </ol>
        <button className="line-button review-request-button" onClick={onShareReviewRequest}><Share2 size={16} /> {reviewRequestShared ? "검토 요청서 다시 공유" : "검토 요청서 공유"}</button>
        {reviewRequestShared && <p className="review-request-state"><CheckCircle2 size={14} /> 요청서를 공유했습니다. 충돌한 근거가 해소되면 다시 분석하세요.</p>}
      </section>
    );
  }

  if (path === "general_analysis") {
    return (
      <section className="review-path-panel comparison">
        <div className="review-path-heading"><ShieldCheck size={21} /><span><strong>범용 전문가 패턴으로 분석했어요</strong><small>제품별 사례 부재를 결론 보류 조건으로 사용하지 않았습니다.</small></span></div>
        <p>공식 가품 사례에서 반복된 포장 문자, 각인, 부품 분할, 연결부, 나사·자석, 도색·재질 패턴과 정상 공정 편차를 함께 적용했습니다.</p>
      </section>
    );
  }

  if (path === "more_photos_needed") {
    return (
      <section className="review-path-panel photos-needed">
        <div className="review-path-heading"><Camera size={21} /><span><strong>다음 사진을 보완해 주세요</strong><small>사진을 추가하면 같은 검증 요청에서 다시 분석할 수 있습니다.</small></span></div>
        <div className="photo-action-list">
          {photoActions.length > 0 ? photoActions.map((action) => (
            <article key={action.key}><span>{action.title}</span><p>{action.description}</p></article>
          )) : <article><span>식별 정보</span><p>글자와 각인이 잘리지 않도록 밝은 곳에서 가까이 촬영해 주세요.</p></article>}
        </div>
        <button className="black-button review-request-button" onClick={onAddPhotos}><Camera size={16} /> 사진 보완하기</button>
      </section>
    );
  }

  return (
    <section className="review-path-panel unsupported">
      <div className="review-path-heading"><CircleHelp size={21} /><span><strong>{product.name}은 아직 검증을 지원하지 않아요</strong><small>자료가 없는 제품에 추측성 판정을 제공하지 않습니다.</small></span></div>
      <ul className="unsupported-actions">
        <li><strong>제품 식별</strong><span>제조사 공식 카탈로그에서 제품 번호와 발매판을 먼저 확인해 주세요.</span></li>
        <li><strong>공식 문의</strong><span>제조사 고객지원 또는 정식 유통사에 박스와 각인 사진을 보내 확인해 주세요.</span></li>
        <li><strong>전문가 확인</strong><span>제품군을 다루는 수집가 커뮤니티나 실물 검토가 가능한 전문가에게 문의해 주세요.</span></li>
      </ul>
      <button className="line-button review-request-button" onClick={onSelectAnotherProduct}><Search size={16} /> 지원 제품 다시 찾기</button>
    </section>
  );
}

function StepBar({ stage }: { stage: Stage }) {
  const active = stage === "search" ? 1 : stage === "photos" ? 2 : 3;
  const labels = ["제품 찾기", "사진 확인", "판정 결과"];
  return <div className="step-wrap"><div className="step-bar">{labels.map((label, index) => <div className={`${active === index + 1 ? "active" : ""} ${active > index + 1 ? "done" : ""}`} key={label}><span>{active > index + 1 ? <Check size={12} /> : index + 1}</span><p>{label}</p></div>)}</div></div>;
}

function ProductImage({ product, size }: { product: Product; size: "small" | "medium" | "large" }) {
  const sources = [product.image].filter(Boolean);
  const [failures, setFailures] = useState<{ productId: string; sources: string[] }>({
    productId: product.id,
    sources: [],
  });
  const failedSources = failures.productId === product.id ? failures.sources : [];
  const source = sources.find((candidate) => !failedSources.includes(candidate));
  if (!source) return <div className={`product-image placeholder ${size}`}><ImageIcon size={size === "large" ? 40 : 22} /></div>;
  return (
    <div className={`product-image ${size}`}>
      <img
        src={source}
        alt={`${product.name} 제품 이미지`}
        onError={() => setFailures((current) => ({
          productId: product.id,
          sources: current.productId === product.id
            ? [...new Set([...current.sources, source])]
            : [source],
        }))}
      />
    </div>
  );
}

function ProductStrip({ product }: { product: Product }) {
  return <article className="product-strip"><ProductImage product={product} size="medium" /><div><span>{product.verified ? "공식 제품" : "직접 입력"}</span><strong>{product.name}</strong><p>{[seriesLabel(product), `No.${product.number}`, product.maker].filter(Boolean).join(" · ")}</p></div>{product.officialUrl && <a href={product.officialUrl} target="_blank" rel="noreferrer" aria-label="제품 정보 페이지"><ExternalLink size={17} /></a>}</article>;
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
    { label: "뚜렷한 위험 신호 미확인", tone: "safe", description: "핵심 사진에서 현재 알려진 가품 위험 신호가 보이지 않을 때. 정품 확인을 뜻하지 않음" },
    { label: "판정이 애매함", tone: "caution", description: "명확한 비정상은 없지만 판본 정보나 서로 충돌하는 근거가 남을 때" },
    { label: "가품 가능성 높음", tone: "danger", description: "사진에서 명확한 비정상 신호가 하나 이상 확인될 때. 제품별 사례 유무와 무관" },
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
              <li><span>01</span><p><strong>공식 제품 정보</strong>서버에 등록된 제품명·제조사·제품번호와 사진 속 표기가 충돌하는지 확인합니다.</p></li>
              <li><span>02</span><p><strong>알려진 가품 사례</strong>같은 제품의 검수 특징은 직접 대조하고, 다른 제품의 공식 사례는 반복되는 이상 유형과 검사 위치를 찾는 데 사용합니다.</p></li>
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
  const [isEditing, setIsEditing] = useState(false);
  const statusLabel = (status: Observation) => status === "match" ? "일치" : status === "concern" ? "차이 의심" : "확인 불가";

  return (
    <section className="ai-section">
      <header>
        <div><ShieldCheck size={18} /><h2>AI가 찾은 근거</h2></div>
        <button
          type="button"
          className="ai-review-toggle"
          aria-expanded={isEditing}
          aria-controls="ai-review-controls"
          onClick={() => setIsEditing((current) => !current)}
        >
          {isEditing ? "수정 완료" : "이미지 비교 결과 수정하기"}
        </button>
      </header>
      <p className="ai-review-intro">{isEditing ? "사진에서 실제로 보이는 내용을 확인한 뒤 판정을 선택해 주세요." : "AI가 사진에서 확인한 비교 결과입니다."}</p>
      <div className="ai-finding-list" id="ai-review-controls">
        {analysis.findings.map((finding) => {
          const current = observations[finding.key];
          const original = finding.status === "unclear" ? "unverified" : finding.status;
          const changed = reviewed[finding.key] && current !== original;
          const displayedStatus = reviewed[finding.key] ? current : original;
          return (
            <article className={`ai-finding ${displayedStatus}`} key={finding.key}>
              <div className="ai-finding-thumb">{previews[finding.key] ? <img src={previews[finding.key]} alt={`${finding.title} 분석 사진`} /> : <ImageIcon size={20} />}</div>
              <div className="ai-finding-copy">
                <div className="ai-finding-title"><strong>{finding.title}</strong><span>{statusLabel(displayedStatus)}</span></div>
                <p>{finding.reason}</p>
                <dl><dt>사진 근거</dt><dd>{finding.visibleEvidence}</dd></dl>
                {finding.userAction && finding.status !== "match" && <dl><dt>다음 확인</dt><dd>{finding.userAction}</dd></dl>}
                {isEditing && (
                  <div className="review-controls" aria-label={`${finding.title} 사용자 확인`}>
                    <span>{reviewed[finding.key] ? (changed ? "수정됨" : "확인됨") : "내가 확인"}</span>
                    <button className={reviewed[finding.key] && current === "match" ? "active match" : ""} onClick={() => onReview(finding, "match")}><Check size={12} /> 일치</button>
                    <button className={reviewed[finding.key] && current === "concern" ? "active concern" : ""} onClick={() => onReview(finding, "concern")}><TriangleAlert size={12} /> 차이</button>
                    <button className={reviewed[finding.key] && current === "unverified" ? "active" : ""} onClick={() => onReview(finding, "unverified")}>모름</button>
                  </div>
                )}
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
  const verdictCases = cases.filter((item) => item.verdictImpact !== "none");
  const overlapCount = verdictCases.flatMap((item) => item.signals)
    .filter((signal) => observations[signal.evidenceKey] === "concern").length;
  const aiMatchCount = aiMatches.filter((match) => match.similarity !== "low" && verdictCases.some((item) => item.id === match.caseId)).length;
  const previewCase = preview ? cases.find((item) => item.id === preview.caseId) : null;
  const previewImages = previewCase ? displayableCaseImages(previewCase) : [];

  const movePreview = useCallback((direction: -1 | 1) => {
    setPreview((current) => {
      if (!current) return current;
      const currentCase = cases.find((item) => item.id === current.caseId);
      const currentImages = currentCase ? displayableCaseImages(currentCase) : [];
      if (currentImages.length < 2) return current;
      return {
        ...current,
        imageIndex: (current.imageIndex + direction + currentImages.length) % currentImages.length,
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
          const displayImages = displayableCaseImages(item);
          const usesExternalSourceImages = item.rightsStatus === "unknown_link_only";
          const affectsVerdict = item.verdictImpact !== "none";
          const caseKind: CounterfeitCaseKind = item.caseKind ?? (item.sourceType === "official" ? "official" : "comparison");
          const caseKindLabel: Record<CounterfeitCaseKind, string> = {
            official: "공식 제조사 자료",
            comparison: "정품·가품 비교 사례",
            specimen: "가품 실물 확인 사례",
            mention: "커뮤니티 언급 사례",
          };
          const overlappingSignals = affectsVerdict
            ? item.signals.filter((signal) => observations[signal.evidenceKey] === "concern")
            : [];
          const aiMatch = affectsVerdict
            ? aiMatches.find((match) => match.caseId === item.id && match.similarity !== "low")
            : undefined;
          const hasOverlap = overlappingSignals.length > 0 || Boolean(aiMatch);

          return (
            <article className={`case-card ${hasOverlap ? "overlap" : ""}`} key={item.id}>
              {displayImages.length > 0 ? (
                <div className="case-media">
                  <div className={`case-images count-${Math.min(displayImages.length, 4)}`}>
                    {displayImages.map((image, index) => (
                      <button
                        type="button"
                        className="case-image-button"
                        onClick={() => setPreview({ caseId: item.id, imageIndex: index })}
                        aria-label={`${item.title} 비교 사진 ${index + 1} 크게 보기`}
                        key={`${image}-${index}`}
                      >
                        <img
                          src={image}
                          alt={`${item.title} 비교 사진 ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <span>{usesExternalSourceImages ? `외부 원문 ${index + 1}` : index + 1}</span>
                        <ZoomIn size={16} />
                      </button>
                    ))}
                  </div>
                  {usesExternalSourceImages && (
                    <a className="case-external-image-note" href={item.sourceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={12} /> 외부 출처에서 불러온 참고 이미지 · AI 판정 미반영
                    </a>
                  )}
                </div>
              ) : (
                <a className="case-reference-only" href={item.sourceUrl} target="_blank" rel="noreferrer">
                  <FileCheck2 size={25} />
                  <span><strong>원문에서 실물 확인</strong><small>이미지는 복제하지 않았습니다.</small></span>
                  <ExternalLink size={16} />
                </a>
              )}
              <div className="case-copy">
                <span className={`case-status ${hasOverlap ? "matched" : ""}`}>
                  {!affectsVerdict ? "검증 전 참고 사례" : aiMatch ? "AI가 유사 특징을 찾은 사례" : hasOverlap ? "현재 매물과 겹치는 사례" : "비교 참고 사례"}
                </span>
                <div className="case-meta">
                  <span className={`case-source ${caseKind}`}>
                    {caseKindLabel[caseKind]}
                  </span>
                  <span className="case-source-links">
                    <a className="case-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                      {item.sourceName} 원문 <ExternalLink size={11} />
                    </a>
                    {item.secondarySources?.map((source) => (
                      <a className="case-source-link" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                        {source.name} <ExternalLink size={11} />
                      </a>
                    ))}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                {item.sourceType === "community" && (
                  <p className="case-community-note"><Info size={13} /> 커뮤니티 자료이며 제조사 공식 판정은 아닙니다. AI 판정과 점수에는 반영하지 않았습니다.</p>
                )}
                <ul>
                  {item.signals.map((signal) => {
                    const signalMatches = affectsVerdict && (observations[signal.evidenceKey] === "concern" || Boolean(aiMatch?.evidenceKeys.includes(signal.evidenceKey)));
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

      {preview && previewCase && previewImages.length > 0 && typeof document !== "undefined" && createPortal(
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
                <span>비교 사진 {preview.imageIndex + 1} / {previewImages.length}</span>
                <h2 id="case-lightbox-title">{previewCase.title}</h2>
                <a className="case-lightbox-source" href={previewCase.sourceUrl} target="_blank" rel="noreferrer">
                  출처 원문 <ExternalLink size={11} />
                </a>
              </div>
              <button type="button" autoFocus onClick={() => setPreview(null)} aria-label="비교 사진 닫기"><X size={20} /></button>
            </header>
            <div className="case-lightbox-stage">
              {previewImages.length > 1 && (
                <button type="button" className="case-lightbox-arrow previous" onClick={() => movePreview(-1)} aria-label="이전 비교 사진"><ArrowLeft size={22} /></button>
              )}
              <img
                src={previewImages[preview.imageIndex]}
                alt={`${previewCase.title} 비교 사진 ${preview.imageIndex + 1} 확대`}
                decoding="async"
                referrerPolicy="no-referrer"
              />
              {previewCase.rightsStatus === "unknown_link_only" && (
                <span className="case-lightbox-external">외부 출처 이미지 · AI 판정 미반영</span>
              )}
              {previewImages.length > 1 && (
                <button type="button" className="case-lightbox-arrow next" onClick={() => movePreview(1)} aria-label="다음 비교 사진"><ArrowRight size={22} /></button>
              )}
            </div>
            {previewImages.length > 1 && (
              <footer aria-label="비교 사진 목록">
                {previewImages.map((image, index) => (
                  <button
                    type="button"
                    className={preview.imageIndex === index ? "active" : ""}
                    onClick={() => setPreview({ caseId: previewCase.id, imageIndex: index })}
                    aria-label={`비교 사진 ${index + 1} 보기`}
                    aria-current={preview.imageIndex === index ? "true" : undefined}
                    key={`${image}-preview-${index}`}
                  >
                    <img src={image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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
