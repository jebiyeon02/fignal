"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Factory,
  FileCheck2,
  Fingerprint,
  Globe2,
  Image as ImageIcon,
  Info,
  Link2,
  LoaderCircle,
  PackageCheck,
  Plus,
  RotateCcw,
  ScanBarcode,
  ScanFace,
  SearchCheck,
  Share2,
  ShieldCheck,
  Stamp,
  Store,
  Tag,
  TriangleAlert,
  X,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

type Stage = "identity" | "evidence" | "report";
type Platform = "당근" | "X" | "번개장터" | "기타";
type LookupStatus = "unknown" | "reported" | "not_reported" | "not_found";
type Observation = "missing" | "unverified" | "match" | "concern";
type EvidenceGroup = "패키지" | "본체" | "거래";
type EvidenceKey =
  | "boxFront"
  | "boxBack"
  | "logoSeal"
  | "barcode"
  | "baseMark"
  | "figureFull"
  | "facePaint"
  | "parts"
  | "purchaseProof";

type EvidenceItem = {
  key: EvidenceKey;
  group: EvidenceGroup;
  title: string;
  description: string;
  matchReason: string;
  concernReason: string;
  weight: number;
  strength: "강함" | "중간" | "보조";
  icon: typeof Camera;
};

const evidenceItems: EvidenceItem[] = [
  {
    key: "boxFront",
    group: "패키지",
    title: "박스 정면",
    description: "로고·상품명·패키지판",
    matchReason: "제조사 로고와 상품명 배치가 기준 사진과 일치",
    concernReason: "로고·상품명 배치가 기준 패키지와 다름",
    weight: 6,
    strength: "중간",
    icon: Box,
  },
  {
    key: "boxBack",
    group: "패키지",
    title: "박스 후면",
    description: "주의문구·언어·인쇄 배열",
    matchReason: "주의문구와 인쇄 배열에서 오탈자나 위치 차이가 없음",
    concernReason: "주의문구·언어·인쇄 배열에서 기준과 다른 부분이 있음",
    weight: 8,
    strength: "강함",
    icon: PackageCheck,
  },
  {
    key: "logoSeal",
    group: "패키지",
    title: "라이선스 씰",
    description: "홀로그램·유통사 씰 위치",
    matchReason: "씰 형태와 부착 위치가 해당 유통판 기준과 일치",
    concernReason: "씰 형태나 위치가 해당 유통판 기준과 다름",
    weight: 3,
    strength: "보조",
    icon: BadgeCheck,
  },
  {
    key: "barcode",
    group: "패키지",
    title: "바코드·QR",
    description: "JAN·제품번호·제품판",
    matchReason: "JAN과 제품번호가 입력한 제품판 정보와 일치",
    concernReason: "JAN 또는 제품번호가 입력한 제품판 정보와 맞지 않음",
    weight: 8,
    strength: "강함",
    icon: ScanBarcode,
  },
  {
    key: "baseMark",
    group: "본체",
    title: "받침대 각인",
    description: "저작권 문구·제조국·형태",
    matchReason: "저작권 문구와 제조국 표기, 받침대 형태가 기준과 일치",
    concernReason: "각인 문구·글꼴·받침대 형태에서 기준과 다른 부분이 있음",
    weight: 12,
    strength: "강함",
    icon: Stamp,
  },
  {
    key: "figureFull",
    group: "본체",
    title: "본체 전체",
    description: "조형 비율·부품 위치·누락",
    matchReason: "조형 비율과 부품 위치가 공식 제품 사진과 일치",
    concernReason: "조형 비율이나 부품 위치가 공식 제품 사진과 다름",
    weight: 8,
    strength: "중간",
    icon: Camera,
  },
  {
    key: "facePaint",
    group: "본체",
    title: "얼굴·도색",
    description: "눈 프린팅·광택·도색 경계",
    matchReason: "눈 프린팅과 광택, 도색 경계가 기준 사진과 일치",
    concernReason: "눈 프린팅·광택·도색 경계에서 뚜렷한 차이가 있음",
    weight: 12,
    strength: "강함",
    icon: ScanFace,
  },
  {
    key: "parts",
    group: "본체",
    title: "블리스터·구성품",
    description: "교체 파츠·내부 포장",
    matchReason: "블리스터 구성과 교체 파츠가 공식 구성표와 일치",
    concernReason: "내부 포장이나 교체 파츠 구성이 공식 구성표와 다름",
    weight: 8,
    strength: "중간",
    icon: FileCheck2,
  },
  {
    key: "purchaseProof",
    group: "거래",
    title: "공식 구매내역",
    description: "판매처·주문일·상품명",
    matchReason: "주문내역의 판매처와 상품명이 입력 제품과 일치",
    concernReason: "구매내역의 판매처나 상품명이 입력 제품과 맞지 않음",
    weight: 12,
    strength: "강함",
    icon: Store,
  },
];

const evidenceGroups: EvidenceGroup[] = ["패키지", "본체", "거래"];
const initialObservations = Object.fromEntries(
  evidenceItems.map((item) => [item.key, "missing"]),
) as Record<EvidenceKey, Observation>;
const platforms: Platform[] = ["당근", "X", "번개장터", "기타"];

const sourceLabels: Record<LookupStatus, string> = {
  unknown: "조회 전",
  reported: "가품 사례 있음",
  not_reported: "현재 보고 없음",
  not_found: "제품 식별 실패",
};

function toNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("identity");
  const [platform, setPlatform] = useState<Platform>("당근");
  const [listingUrl, setListingUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [productNumber, setProductNumber] = useState("");
  const [releaseVersion, setReleaseVersion] = useState("");
  const [price, setPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [officialStatus, setOfficialStatus] = useState<LookupStatus>("unknown");
  const [communityStatus, setCommunityStatus] = useState<LookupStatus>("unknown");
  const [sellerProof, setSellerProof] = useState("none");
  const [origin, setOrigin] = useState("unknown");
  const [observations, setObservations] = useState(initialObservations);
  const [fileNames, setFileNames] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [filePreviews, setFilePreviews] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState("");

  const completedCount = Object.values(observations).filter((value) => value !== "missing").length;
  const assessedCount = Object.values(observations).filter((value) => value === "match" || value === "concern").length;
  const matchedItems = evidenceItems.filter((item) => observations[item.key] === "match");
  const concernItems = evidenceItems.filter((item) => observations[item.key] === "concern");
  const unverifiedItems = evidenceItems.filter((item) => observations[item.key] === "unverified");
  const missingItems = evidenceItems.filter((item) => observations[item.key] === "missing");

  const priceRatio = useMemo(() => {
    const asking = toNumber(price);
    const reference = toNumber(retailPrice);
    return asking > 0 && reference > 0 ? asking / reference : null;
  }, [price, retailPrice]);

  const confidence = useMemo(() => {
    const assessedWeight = evidenceItems.reduce((sum, item) => {
      const observation = observations[item.key];
      if (observation === "match" || observation === "concern") return sum + item.weight;
      if (observation === "unverified") return sum + 1;
      return sum;
    }, 0);
    const sourceWeight = sellerProof === "receipt" ? 9 : sellerProof === "story" ? 3 : 0;
    const lookupWeight = officialStatus !== "unknown" ? 4 : 0;
    const communityWeight = communityStatus !== "unknown" ? 3 : 0;
    return Math.min(96, 12 + assessedWeight + sourceWeight + lookupWeight + communityWeight);
  }, [observations, sellerProof, officialStatus, communityStatus]);

  const riskPoints = useMemo(() => {
    const evidenceRisk = concernItems.reduce((sum, item) => sum + item.weight, 0);
    const priceRisk = priceRatio !== null && priceRatio < 0.55 ? 18 : priceRatio !== null && priceRatio < 0.75 ? 9 : 0;
    const provenanceRisk = sellerProof === "none" ? 5 : 0;
    const counterfeitContext = (officialStatus === "reported" ? 3 : 0) + (communityStatus === "reported" ? 3 : 0);
    return evidenceRisk + priceRisk + provenanceRisk + counterfeitContext;
  }, [concernItems, priceRatio, sellerProof, officialStatus, communityStatus]);

  const result = completedCount < 5 || assessedCount < 4
    ? { label: "판단 보류", tone: "neutral", summary: "사진이 더 필요합니다." }
    : riskPoints >= 22
      ? { label: "가품 의심", tone: "danger", summary: "기준과 다른 증거가 겹칩니다." }
      : riskPoints >= 10
        ? { label: "추가 확인", tone: "caution", summary: "거래 전에 확인할 항목이 남았습니다." }
        : { label: "진품 가능성 높음", tone: "safe", summary: "확인한 범위에서 큰 차이가 없습니다." };

  const canContinue = brand.trim().length > 1 && productName.trim().length > 1 && productNumber.trim().length > 1;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2300);
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast("복사하지 못했습니다.");
    }
  };

  const sellerMessage = `안녕하세요. 구매 전 확인할 사진을 부탁드립니다.\n① 박스 정·후면 ② 제조사 로고와 라이선스 씰 ③ 바코드·QR ④ 받침대 저작권 각인 ⑤ 본체 정·후면 ⑥ 얼굴·도색 근접 ⑦ 블리스터와 구성품 전체 ⑧ 가능하면 구매내역\n같은 배경에서 오늘 날짜 메모가 보이게 촬영해 주세요.`;

  const loadDemo = () => {
    setPlatform("당근");
    setListingUrl("https://www.daangn.com/articles/figure-sample");
    setBrand("Good Smile Company");
    setProductName("넨도로이드 고죠 사토루");
    setProductNumber("No. 1528 / 샘플 SKU");
    setReleaseVersion("초판 · 국내 유통판");
    setPrice("72,000");
    setRetailPrice("68,000");
    setOfficialStatus("reported");
    setCommunityStatus("reported");
    setSellerProof("receipt");
    setOrigin("china_oem");
    showToast("예시를 채웠습니다.");
  };

  const loadDemoEvidence = () => {
    setObservations({
      boxFront: "match",
      boxBack: "match",
      logoSeal: "match",
      barcode: "match",
      baseMark: "match",
      figureFull: "match",
      facePaint: "match",
      parts: "unverified",
      purchaseProof: "match",
    });
    setFileNames({
      boxFront: "box-front.jpg",
      boxBack: "box-back.jpg",
      logoSeal: "license-seal.jpg",
      barcode: "jan-barcode.jpg",
      baseMark: "base-copyright.jpg",
      figureFull: "figure-full.jpg",
      facePaint: "face-closeup.jpg",
      parts: "blister.jpg",
      purchaseProof: "official-order.png",
    });
    showToast("예시 증거를 채웠습니다.");
  };

  const handleFile = (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousPreview = filePreviews[key];
    if (previousPreview) URL.revokeObjectURL(previousPreview);
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

  const analyze = () => {
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setStage("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 700);
  };

  const shareReport = async () => {
    const text = `[FIGSIGNAL] ${productName}\n${result.label} · 자료 충족도 ${confidence}%\n${productNumber} · 증거 ${completedCount}/9\n사진과 입력 정보로 만든 참고 결과이며 정품 보증서가 아닙니다.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FIGSIGNAL 판정 결과", text });
        return;
      } catch {
        return;
      }
    }
    await copyText(text, "결과를 복사했습니다.");
  };

  const resetAll = () => {
    Object.values(filePreviews).forEach((preview) => {
      if (preview) URL.revokeObjectURL(preview);
    });
    setStage("identity");
    setListingUrl("");
    setBrand("");
    setProductName("");
    setProductNumber("");
    setReleaseVersion("");
    setPrice("");
    setRetailPrice("");
    setOfficialStatus("unknown");
    setCommunityStatus("unknown");
    setSellerProof("none");
    setOrigin("unknown");
    setObservations(initialObservations);
    setFileNames({});
    setFilePreviews({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="wordmark" onClick={resetAll} aria-label="FIGSIGNAL 새 검증">
          <span className="wordmark-icon"><ShieldCheck size={18} strokeWidth={2.4} /></span>
          <span>FIGSIGNAL</span>
        </button>
        <div className="header-product">
          {productName ? <><span>{brand}</span><strong>{productName}</strong></> : <span>피규어 검증</span>}
        </div>
        <button className="new-record" onClick={resetAll}><Plus size={16} /> 새 검증</button>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav aria-label="검증 단계">
            <StageButton
              active={stage === "identity"}
              complete={stage !== "identity"}
              number="01"
              title="제품 확인"
              onClick={() => setStage("identity")}
            />
            <StageButton
              active={stage === "evidence"}
              complete={stage === "report"}
              disabled={!canContinue}
              number="02"
              title="증거 검토"
              onClick={() => setStage("evidence")}
            />
            <StageButton
              active={stage === "report"}
              complete={false}
              disabled={completedCount === 0}
              number="03"
              title="판정 결과"
              onClick={() => setStage("report")}
            />
          </nav>

          <div className="record-summary">
            <span>현재 기록</span>
            <dl>
              <div><dt>제품</dt><dd>{productNumber || "—"}</dd></div>
              <div><dt>증거</dt><dd>{completedCount}/9</dd></div>
              <div><dt>검토</dt><dd>{assessedCount}개</dd></div>
            </dl>
          </div>
        </aside>

        <section className="app-content">
          <MobileProgress stage={stage} />

          {stage === "identity" && (
            <div className="page enter">
              <PageHeader
                eyebrow="새 검증"
                title="어떤 제품인가요?"
                action={<button className="text-button" onClick={loadDemo}>예시 채우기</button>}
              />

              <div className="form-layout">
                <div className="form-stack">
                  <Panel title="거래 정보" icon={Link2}>
                    <div className="field-group">
                      <label>거래 플랫폼</label>
                      <div className="segmented" role="radiogroup" aria-label="거래 플랫폼">
                        {platforms.map((item) => (
                          <button
                            key={item}
                            className={platform === item ? "active" : ""}
                            onClick={() => setPlatform(item)}
                            role="radio"
                            aria-checked={platform === item}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="listing-url">거래글 링크 <span>선택</span></label>
                      <div className="input-icon"><Link2 size={17} /><input id="listing-url" value={listingUrl} onChange={(event) => setListingUrl(event.target.value)} placeholder="https://" inputMode="url" /></div>
                    </div>
                  </Panel>

                  <Panel title="제품 정보" icon={Fingerprint}>
                    <div className="field-row">
                      <div className="field-group"><label htmlFor="brand">제조사</label><input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Good Smile Company" /></div>
                      <div className="field-group"><label htmlFor="product-number">제품번호·JAN</label><input id="product-number" value={productNumber} onChange={(event) => setProductNumber(event.target.value)} placeholder="No.1528 / 458..." /></div>
                    </div>
                    <div className="field-group"><label htmlFor="product-name">제품명</label><input id="product-name" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="넨도로이드 고죠 사토루" /></div>
                    <div className="field-group"><label htmlFor="release-version">발매판·버전 <span>선택</span></label><input id="release-version" value={releaseVersion} onChange={(event) => setReleaseVersion(event.target.value)} placeholder="초판 · 국내 유통판" /></div>
                  </Panel>

                  <Panel title="가품 정보" icon={SearchCheck}>
                    <div className="lookup-row">
                      <label>
                        <span><ShieldCheck size={17} /> 제조사 공식</span>
                        <select value={officialStatus} onChange={(event) => setOfficialStatus(event.target.value as LookupStatus)} aria-label="제조사 공식 자료 조회 결과">
                          <option value="unknown">조회 전</option>
                          <option value="reported">가품 사례 있음</option>
                          <option value="not_reported">현재 보고 없음</option>
                          <option value="not_found">제품 식별 실패</option>
                        </select>
                      </label>
                      <label>
                        <span><Globe2 size={17} /> MFC·커뮤니티</span>
                        <select value={communityStatus} onChange={(event) => setCommunityStatus(event.target.value as LookupStatus)} aria-label="MFC와 커뮤니티 조회 결과">
                          <option value="unknown">조회 전</option>
                          <option value="reported">가품 사례 있음</option>
                          <option value="not_reported">현재 보고 없음</option>
                          <option value="not_found">제품 식별 실패</option>
                        </select>
                      </label>
                    </div>
                    {(officialStatus === "not_reported" || communityStatus === "not_reported") && (
                      <p className="inline-note"><Info size={14} /> 보고가 없다고 가품이 없는 것은 아닙니다.</p>
                    )}
                  </Panel>

                  <Panel title="가격과 출처" icon={Store}>
                    <div className="field-row">
                      <div className="field-group"><label htmlFor="retail-price">기준가</label><div className="price-input"><input id="retail-price" value={retailPrice} onChange={(event) => setRetailPrice(event.target.value)} placeholder="68,000" inputMode="numeric" /><span>원</span></div></div>
                      <div className="field-group"><label htmlFor="price">거래가</label><div className="price-input"><input id="price" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="72,000" inputMode="numeric" /><span>원</span></div></div>
                    </div>
                    <div className="field-row">
                      <div className="field-group"><label htmlFor="seller-proof">판매자 출처</label><select id="seller-proof" value={sellerProof} onChange={(event) => setSellerProof(event.target.value)}><option value="none">정보 없음</option><option value="story">구매처 설명</option><option value="receipt">공식 주문내역</option></select></div>
                      <div className="field-group"><label htmlFor="origin">생산 정보</label><select id="origin" value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="unknown">알 수 없음</option><option value="china_oem">중국 OEM</option><option value="japan">일본 생산</option><option value="other">기타 국가</option></select></div>
                    </div>
                    {priceRatio !== null && <PriceSignal ratio={priceRatio} />}
                    {origin === "china_oem" && <p className="inline-note"><Factory size={14} /> 중국 OEM은 단독 위험 신호로 보지 않습니다.</p>}
                  </Panel>
                </div>

                <aside className="side-guide">
                  <div className="guide-head"><Fingerprint size={19} /><strong>식별 기준</strong></div>
                  <ol>
                    <li><span>1</span><p><strong>제품번호</strong>캐릭터명보다 정확합니다.</p></li>
                    <li><span>2</span><p><strong>발매판</strong>초판·재판의 포장이 다를 수 있습니다.</p></li>
                    <li><span>3</span><p><strong>출처 순서</strong>제조사 자료를 먼저 봅니다.</p></li>
                  </ol>
                </aside>
              </div>

              <div className="page-actions end"><button className="primary-button" disabled={!canContinue} onClick={() => setStage("evidence")}>증거 검토 <ArrowRight size={17} /></button></div>
            </div>
          )}

          {stage === "evidence" && (
            <div className="page enter">
              <PageHeader
                eyebrow="증거 검토"
                title="사진을 기준 자료와 대조하세요"
                meta={`${assessedCount}개 검토 · ${completedCount}/9 수집`}
                action={<button className="text-button" onClick={loadDemoEvidence}>예시 채우기</button>}
              />

              <div className="request-bar">
                <div><Camera size={18} /><span><strong>판매자 사진이 부족한가요?</strong><small>필요한 촬영 목록을 바로 보냅니다.</small></span></div>
                <button onClick={() => copyText(sellerMessage, "요청 문구를 복사했습니다.")}><Clipboard size={14} /> 문구 복사</button>
              </div>

              <div className="evidence-table">
                {evidenceGroups.map((group) => (
                  <section className="evidence-group" key={group}>
                    <div className="group-label"><span>{group}</span><small>{evidenceItems.filter((item) => item.group === group).length}</small></div>
                    {evidenceItems.filter((item) => item.group === group).map((item) => {
                      const Icon = item.icon;
                      const observation = observations[item.key];
                      return (
                        <article className={`evidence-row ${observation}`} key={item.key}>
                          <div className="evidence-file">
                            <label className="file-drop">
                              <input type="file" accept="image/*" onChange={(event) => handleFile(item.key, event)} />
                              {filePreviews[item.key] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={filePreviews[item.key]} alt={`${item.title} 업로드 사진`} />
                              ) : (
                                <><Icon size={21} /><span>{fileNames[item.key] ? "사진 등록됨" : "사진 추가"}</span></>
                              )}
                            </label>
                          </div>
                          <div className="evidence-info">
                            <div><strong>{item.title}</strong><span className={`weight ${item.strength}`}>{item.strength}</span></div>
                            <p>{item.description}</p>
                            {fileNames[item.key] && <small>{fileNames[item.key]}</small>}
                          </div>
                          <div className="observation-control" aria-label={`${item.title} 비교 결과`}>
                            <button className={observation === "unverified" ? "active" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "unverified" }))}>미확인</button>
                            <button className={observation === "match" ? "active match" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "match" }))}><Check size={13} /> 일치</button>
                            <button className={observation === "concern" ? "active concern" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "concern" }))}><TriangleAlert size={13} /> 차이</button>
                          </div>
                          {observation !== "missing" && <button className="clear-evidence" onClick={() => removeEvidence(item.key)} aria-label={`${item.title} 초기화`}><X size={15} /></button>}
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>

              <div className="seal-note"><BadgeCheck size={17} /><span><strong>씰은 보조 증거입니다.</strong> 복제하거나 옮겨 붙일 수 있어 다른 항목과 함께 봅니다.</span></div>

              <div className="page-actions"><button className="secondary-button" onClick={() => setStage("identity")}><ArrowLeft size={17} /> 제품 정보</button><button className="primary-button" onClick={analyze} disabled={isAnalyzing || completedCount === 0}>{isAnalyzing ? <><LoaderCircle className="spin" size={17} /> 판정 중</> : <>결과 보기 <ArrowRight size={17} /></>}</button></div>
            </div>
          )}

          {stage === "report" && (
            <div className="page report-page enter">
              <PageHeader eyebrow="판정 결과" title={productName || "이름 없는 제품"} meta={`${brand || "제조사 미입력"} · ${productNumber || "제품번호 미입력"}`} />

              <section className={`verdict ${result.tone}`}>
                <div className="verdict-status">
                  <span className="verdict-label">판정</span>
                  <h1>{result.label}</h1>
                  <p>{result.summary}</p>
                </div>
                <div className="verdict-metrics">
                  <div><strong>{confidence}%</strong><span>자료 충족도</span></div>
                  <div><strong>{assessedCount}</strong><span>비교 완료</span></div>
                  <div><strong>{concernItems.length}</strong><span>차이 발견</span></div>
                </div>
              </section>

              <div className="report-layout">
                <div className="report-main-column">
                  <section className="report-panel evidence-report">
                    <div className="report-panel-head">
                      <div><SearchCheck size={19} /><h2>판정 근거</h2></div>
                      <span>강한 증거 우선</span>
                    </div>

                    {matchedItems.length > 0 && (
                      <EvidenceResultGroup
                        title="진품 쪽 근거"
                        tone="positive"
                        items={matchedItems}
                        filePreviews={filePreviews}
                        observations={observations}
                      />
                    )}
                    {concernItems.length > 0 && (
                      <EvidenceResultGroup
                        title="가품 의심 근거"
                        tone="negative"
                        items={concernItems}
                        filePreviews={filePreviews}
                        observations={observations}
                      />
                    )}
                    {(unverifiedItems.length > 0 || missingItems.length > 0) && (
                      <div className="pending-evidence">
                        <span>확인 못한 항목</span>
                        <p>{[...unverifiedItems, ...missingItems].map((item) => item.title).join(" · ")}</p>
                      </div>
                    )}
                  </section>

                  <section className="report-panel context-report">
                    <div className="report-panel-head"><div><Tag size={19} /><h2>거래 정황</h2></div></div>
                    <ContextRow
                      tone={priceRatio !== null && priceRatio < 0.75 ? "negative" : priceRatio === null ? "neutral" : "positive"}
                      title="가격"
                      value={priceRatio === null ? "판단할 정보 없음" : `기준가의 ${Math.round(priceRatio * 100)}%`}
                      detail={priceRatio === null ? "기준가와 거래가를 입력하지 않았습니다." : priceRatio < 0.55 ? "시세보다 매우 낮아 출처 확인이 필요합니다." : priceRatio < 0.75 ? "낮은 가격의 이유를 확인해야 합니다." : "비정상적으로 낮은 가격은 아닙니다."}
                    />
                    <ContextRow
                      tone={sellerProof === "receipt" ? "positive" : sellerProof === "none" ? "negative" : "neutral"}
                      title="판매자 출처"
                      value={sellerProof === "receipt" ? "공식 주문내역" : sellerProof === "story" ? "구매처 설명" : "자료 없음"}
                      detail={sellerProof === "receipt" ? "판매처와 상품명이 맞는지 증거에 반영했습니다." : "구매내역을 받으면 판정 근거가 강해집니다."}
                    />
                    <ContextRow
                      tone="neutral"
                      title="생산 정보"
                      value={origin === "china_oem" ? "중국 OEM" : origin === "japan" ? "일본 생산" : origin === "other" ? "기타 국가" : "알 수 없음"}
                      detail="생산국만으로 진품과 가품을 나누지 않습니다."
                    />
                  </section>
                </div>

                <aside className="report-side-column">
                  <section className="source-card">
                    <div className="report-panel-head"><div><Globe2 size={18} /><h2>외부 기록</h2></div></div>
                    <SourceRow title="제조사 공식" status={officialStatus} />
                    <SourceRow title="MFC·커뮤니티" status={communityStatus} />
                    {(officialStatus === "reported" || communityStatus === "reported") && <p className="source-warning"><Info size={14} /> 같은 제품의 가품 사례가 있다는 뜻입니다. 현재 매물의 직접 증거는 아닙니다.</p>}
                  </section>

                  <section className="source-order">
                    <span>근거 우선순위</span>
                    <ol>
                      <li><b>1</b> 제조사 공식 자료</li>
                      <li><b>2</b> 정확한 SKU·구매내역</li>
                      <li><b>3</b> MFC 비교 사진</li>
                      <li><b>4</b> 외관·가격 정황</li>
                    </ol>
                  </section>
                </aside>
              </div>

              <div className="page-actions report-actions"><button className="secondary-button" onClick={() => setStage("evidence")}><ArrowLeft size={17} /> 증거 수정</button><button className="secondary-button" onClick={shareReport}><Share2 size={17} /> 결과 공유</button><button className="primary-button" onClick={resetAll}><RotateCcw size={16} /> 새 검증</button></div>
              <p className="disclaimer">사진과 입력 정보를 바탕으로 한 참고 결과이며 정품 보증서가 아닙니다.</p>
            </div>
          )}
        </section>
      </div>

      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </main>
  );
}

function StageButton({ active, complete, disabled, number, title, onClick }: { active: boolean; complete: boolean; disabled?: boolean; number: string; title: string; onClick: () => void }) {
  return (
    <button className={`stage-button ${active ? "active" : ""}`} disabled={disabled} onClick={onClick}>
      <span className="stage-index">{complete ? <Check size={14} /> : number}</span>
      <span>{title}</span>
      <ChevronRight size={15} />
    </button>
  );
}

function MobileProgress({ stage }: { stage: Stage }) {
  const active = stage === "identity" ? 1 : stage === "evidence" ? 2 : 3;
  return <div className="mobile-progress"><span>{active}/3</span><div><i style={{ width: `${(active / 3) * 100}%` }} /></div><strong>{stage === "identity" ? "제품 확인" : stage === "evidence" ? "증거 검토" : "판정 결과"}</strong></div>;
}

function PageHeader({ eyebrow, title, meta, action }: { eyebrow: string; title: string; meta?: string; action?: React.ReactNode }) {
  return <header className="page-header"><div><span>{eyebrow}</span><h1>{title}</h1>{meta && <p>{meta}</p>}</div>{action}</header>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Camera; children: React.ReactNode }) {
  return <section className="form-panel"><div className="panel-title"><Icon size={17} /><h2>{title}</h2></div><div className="panel-body">{children}</div></section>;
}

function PriceSignal({ ratio }: { ratio: number }) {
  const tone = ratio < 0.55 ? "danger" : ratio < 0.75 ? "warning" : "safe";
  const text = ratio < 0.55 ? "매우 낮은 가격" : ratio < 0.75 ? "낮은 가격" : "가격 범위 보통";
  return <div className={`price-signal ${tone}`}><Tag size={14} /><strong>기준가의 {Math.round(ratio * 100)}%</strong><span>{text}</span></div>;
}

function EvidenceResultGroup({ title, tone, items, filePreviews, observations }: {
  title: string;
  tone: "positive" | "negative";
  items: EvidenceItem[];
  filePreviews: Partial<Record<EvidenceKey, string>>;
  observations: Record<EvidenceKey, Observation>;
}) {
  return (
    <div className={`result-group ${tone}`}>
      <div className="result-group-title"><span>{tone === "positive" ? <CheckCircle2 size={17} /> : <TriangleAlert size={17} />}{title}</span><b>{items.length}</b></div>
      <div className="result-evidence-list">
        {items.map((item) => (
          <article className="result-evidence" key={item.key}>
            <div className="result-thumb">
              {filePreviews[item.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={filePreviews[item.key]} alt={`${item.title} 증거 사진`} />
              ) : <ImageIcon size={19} />}
            </div>
            <div><span><strong>{item.title}</strong><em>{item.strength}</em></span><p>{observations[item.key] === "match" ? item.matchReason : item.concernReason}</p></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContextRow({ tone, title, value, detail }: { tone: "positive" | "negative" | "neutral"; title: string; value: string; detail: string }) {
  return <div className="context-row"><span className={`context-dot ${tone}`} /> <div><span>{title}<strong>{value}</strong></span><p>{detail}</p></div></div>;
}

function SourceRow({ title, status }: { title: string; status: LookupStatus }) {
  const tone = status === "reported" ? "negative" : status === "not_reported" ? "positive" : "neutral";
  return <div className="source-row"><span className={`context-dot ${tone}`} /><div><strong>{title}</strong><span>{sourceLabels[status]}</span></div>{status === "reported" ? <TriangleAlert size={15} /> : status === "not_reported" ? <Check size={15} /> : <CircleHelp size={15} />}</div>;
}
