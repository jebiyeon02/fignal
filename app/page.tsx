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
} from "lucide-react";
import { ChangeEvent, KeyboardEvent, useMemo, useState } from "react";

type Stage = "search" | "photos" | "result";
type Observation = "missing" | "unverified" | "match" | "concern";
type EvidenceKey =
  | "boxFront"
  | "boxBack"
  | "barcode"
  | "baseMark"
  | "facePaint"
  | "figureFull"
  | "parts"
  | "purchaseProof";

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

const products: Product[] = [
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
];

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
  const [fileNames, setFileNames] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [filePreviews, setFilePreviews] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState("");

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return products.filter((product) => {
      const searchable = [product.name, product.englishName, product.number, ...product.aliases]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    }).slice(0, 5);
  }, [query]);

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
  const matchedItems = evidenceItems.filter((item) => observations[item.key] === "match");
  const concernItems = evidenceItems.filter((item) => observations[item.key] === "concern");
  const pendingItems = evidenceItems.filter((item) => observations[item.key] === "unverified" || observations[item.key] === "missing");
  const riskPoints = concernItems.reduce((sum, item) => sum + item.weight, 0);
  const confidence = Math.min(96, (currentProduct?.verified ? 18 : 8) + completedCount * 8 + assessedCount * 4);

  const result = essentialCompleted < 4 || assessedCount < 3
    ? { label: "판단 보류", tone: "neutral", summary: "핵심 사진을 조금 더 확인해야 합니다." }
    : riskPoints >= 18
      ? { label: "가품 의심", tone: "danger", summary: "공식 제품과 다른 점이 여러 곳에서 보입니다." }
      : riskPoints >= 8
        ? { label: "추가 확인", tone: "caution", summary: "거래 전에 다시 볼 항목이 있습니다." }
        : { label: "진품 가능성 높음", tone: "safe", summary: "확인한 사진에서는 큰 차이가 보이지 않습니다." };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const selectProduct = (product: Product) => {
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
    const oldPreview = filePreviews[key];
    if (oldPreview) URL.revokeObjectURL(oldPreview);
    setFileNames((current) => ({ ...current, [key]: file.name }));
    setFilePreviews((current) => ({ ...current, [key]: URL.createObjectURL(file) }));
    if (observations[key] === "missing") {
      setObservations((current) => ({ ...current, [key]: "unverified" }));
    }
  };

  const removeEvidence = (key: EvidenceKey) => {
    if (filePreviews[key]) URL.revokeObjectURL(filePreviews[key]!);
    setObservations((current) => ({ ...current, [key]: "missing" }));
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

  const analyze = () => {
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 650);
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
    setFileNames({});
    setFilePreviews({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site">
      <header className="top-header">
        <div className="top-inner">
          <button className="logo" onClick={resetAll}>FIGSIGNAL</button>
          <div className="top-nav"><span>넨도로이드 검증</span><button onClick={resetAll}><Plus size={16} /> 새 검증</button></div>
        </div>
      </header>

      <StepBar stage={stage} />

      {stage === "search" && (
        <section className="search-page page-enter">
          <div className="intro">
            <span>FIGURE CHECK</span>
            <h1>피규어 이름을<br />검색해보세요</h1>
            <p>제품을 고르면 제조사와 번호를 자동으로 찾습니다.</p>
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
                placeholder="고죠, 프리렌, 덴지..."
                role="combobox"
                aria-expanded={searchOpen && query.trim().length > 0}
                aria-controls="product-suggestions"
                aria-autocomplete="list"
              />
              {query && <button className="clear-query" onClick={() => changeQuery("")} aria-label="검색어 지우기"><X size={18} /></button>}
            </div>

            {searchOpen && query.trim().length > 0 && !selectedProduct && (
              <div className="suggestions" id="product-suggestions" role="listbox">
                {filteredProducts.length > 0 ? filteredProducts.map((product, index) => (
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
                )) : (
                  <div className="no-result"><strong>검색 결과가 없어요</strong><button onMouseDown={(event) => event.preventDefault()} onClick={() => { setManualOpen(true); setSearchOpen(false); }}>직접 입력하기</button></div>
                )}
              </div>
            )}
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
          <header className="simple-heading"><span>사진 확인</span><h1>핵심 사진만 올려주세요</h1><p>다섯 장이면 1차 판정이 가능합니다.</p></header>

          <ProductStrip product={currentProduct} />

          <div className="photo-topline"><div><strong>필수 사진</strong><span>{essentialCompleted}/5</span></div><button onClick={copySellerMessage}><Clipboard size={14} /> 판매자에게 요청</button></div>
          <div className="photo-grid">
            {evidenceItems.filter((item) => item.essential).map((item) => (
              <EvidenceCard key={item.key} item={item} observation={observations[item.key]} fileName={fileNames[item.key]} preview={filePreviews[item.key]} onFile={handleFile} onObserve={(value) => setObservations((current) => ({ ...current, [item.key]: value }))} onRemove={removeEvidence} />
            ))}
          </div>

          <details className="optional-photos">
            <summary><span><Plus size={15} /> 추가 사진</span><small>있으면 판정이 더 선명해져요</small><ChevronDown size={17} /></summary>
            <div className="photo-grid optional-grid">
              {evidenceItems.filter((item) => !item.essential).map((item) => (
                <EvidenceCard key={item.key} item={item} observation={observations[item.key]} fileName={fileNames[item.key]} preview={filePreviews[item.key]} onFile={handleFile} onObserve={(value) => setObservations((current) => ({ ...current, [item.key]: value }))} onRemove={removeEvidence} />
              ))}
            </div>
          </details>

          <div className="photo-note"><Info size={16} /><span>라이선스 씰은 복제되거나 발매판마다 달라질 수 있어 단독으로 판단하지 않습니다.</span></div>
          <button className="black-button full" disabled={completedCount === 0 || isAnalyzing} onClick={analyze}>{isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 확인 중</> : <>판정 결과 보기 <ArrowRight size={18} /></>}</button>
        </section>
      )}

      {stage === "result" && currentProduct && (
        <section className="result-page page-enter">
          <PageBack onClick={() => setStage("photos")} label="사진 수정" />
          <article className={`verdict-card ${result.tone}`}>
            <div className="verdict-product"><ProductImage product={currentProduct} size="medium" /><span><small>No.{currentProduct.number}</small><strong>{currentProduct.name}</strong><em>{currentProduct.maker}</em></span></div>
            <div className="verdict-copy"><span>FIGSIGNAL 판정</span><h1>{result.label}</h1><p>{result.summary}</p></div>
            <div className="verdict-numbers"><div><strong>{confidence}%</strong><span>자료 충족도</span></div><div><strong>{completedCount}</strong><span>확인 사진</span></div><div><strong>{concernItems.length}</strong><span>차이 발견</span></div></div>
          </article>

          <section className="reason-section">
            <header><h2>판정 근거</h2><span>사진별 비교 결과</span></header>
            {concernItems.length > 0 && <ReasonGroup title="다른 점" tone="negative" items={concernItems} previews={filePreviews} observations={observations} />}
            {matchedItems.length > 0 && <ReasonGroup title="비슷한 점" tone="positive" items={matchedItems} previews={filePreviews} observations={observations} />}
            {pendingItems.length > 0 && <div className="pending-line"><CircleHelp size={16} /><span><strong>확인하지 못한 항목</strong>{pendingItems.map((item) => item.title).join(" · ")}</span></div>}
          </section>

          <section className="lookup-source">
            <div><ShieldCheck size={19} /><span><strong>{currentProduct.verified ? "공식 제품 정보 확인됨" : "직접 입력한 제품"}</strong><small>{currentProduct.verified ? `${currentProduct.maker} · No.${currentProduct.number}` : "공식 제품 페이지를 추가로 확인하세요."}</small></span></div>
            {currentProduct.officialUrl && <a href={currentProduct.officialUrl} target="_blank" rel="noreferrer">공식 페이지 <ExternalLink size={14} /></a>}
          </section>

          <div className="result-actions"><button className="line-button" onClick={shareResult}><Share2 size={17} /> 공유</button><button className="black-button" onClick={resetAll}><RotateCcw size={16} /> 새 검증</button></div>
          <p className="disclaimer">사진과 입력 정보로 만든 참고 결과이며 정품 보증서가 아닙니다.</p>
        </section>
      )}

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

function EvidenceCard({ item, observation, fileName, preview, onFile, onObserve, onRemove }: {
  item: EvidenceItem;
  observation: Observation;
  fileName?: string;
  preview?: string;
  onFile: (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => void;
  onObserve: (value: Observation) => void;
  onRemove: (key: EvidenceKey) => void;
}) {
  const Icon = item.icon;
  return (
    <article className={`photo-card ${observation}`}>
      <label className="photo-upload">
        <input type="file" accept="image/*" onChange={(event) => onFile(item.key, event)} />
        {preview ? <img src={preview} alt={`${item.title} 업로드 사진`} /> : <div><Icon size={26} /><span>사진 추가</span></div>}
      </label>
      <div className="photo-card-copy"><div><strong>{item.title}</strong>{fileName && <button onClick={() => onRemove(item.key)} aria-label={`${item.title} 삭제`}><X size={14} /></button>}</div><p>{item.description}</p></div>
      {observation !== "missing" && <div className="compare-buttons"><span>공식 이미지와</span><button className={observation === "match" ? "active match" : ""} onClick={() => onObserve("match")}><Check size={12} /> 비슷해요</button><button className={observation === "concern" ? "active concern" : ""} onClick={() => onObserve("concern")}><TriangleAlert size={12} /> 달라요</button><button className={observation === "unverified" ? "active" : ""} onClick={() => onObserve("unverified")}>모르겠어요</button></div>}
    </article>
  );
}

function ReasonGroup({ title, tone, items, previews, observations }: {
  title: string;
  tone: "positive" | "negative";
  items: EvidenceItem[];
  previews: Partial<Record<EvidenceKey, string>>;
  observations: Record<EvidenceKey, Observation>;
}) {
  return <div className={`reason-group ${tone}`}><div className="reason-title"><span>{tone === "positive" ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}{title}</span><b>{items.length}</b></div><div>{items.map((item) => <article className="reason-row" key={item.key}><div className="reason-thumb">{previews[item.key] ? <img src={previews[item.key]} alt={`${item.title} 증거`} /> : <ImageIcon size={18} />}</div><span><strong>{item.title}</strong><p>{observations[item.key] === "match" ? item.matchReason : item.concernReason}</p></span></article>)}</div></div>;
}
