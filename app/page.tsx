"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clipboard,
  Database,
  Factory,
  FileCheck2,
  FileSearch,
  Fingerprint,
  Globe2,
  Images,
  Info,
  Link2,
  LoaderCircle,
  LockOpen,
  MessageSquareText,
  PackageCheck,
  RotateCcw,
  ScanBarcode,
  ScanFace,
  SearchCheck,
  Share2,
  ShieldCheck,
  Sparkles,
  Stamp,
  Store,
  Tag,
  TriangleAlert,
  Upload,
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
  weight: number;
  strength: "높음" | "중간" | "보조";
  icon: typeof Camera;
};

const evidenceItems: EvidenceItem[] = [
  { key: "boxFront", group: "패키지", title: "박스 정면", description: "제조사 로고·상품명·공식 패키지판", weight: 6, strength: "중간", icon: Box },
  { key: "boxBack", group: "패키지", title: "박스 후면", description: "상품명·주의문구·일본어 오탈자", weight: 8, strength: "높음", icon: PackageCheck },
  { key: "logoSeal", group: "패키지", title: "라이선스 씰", description: "홀로그램·유통사 씰, 위치까지 확인", weight: 3, strength: "보조", icon: BadgeCheck },
  { key: "barcode", group: "패키지", title: "바코드·QR", description: "JAN·제품번호가 정확한 제품판과 일치", weight: 8, strength: "높음", icon: ScanBarcode },
  { key: "baseMark", group: "본체", title: "받침대 각인", description: "저작권 문구·제조국·받침대 형태", weight: 12, strength: "높음", icon: Stamp },
  { key: "figureFull", group: "본체", title: "본체 전체", description: "조형 비율·부품 위치·누락 여부", weight: 8, strength: "중간", icon: Camera },
  { key: "facePaint", group: "본체", title: "얼굴·도색 근접", description: "눈 프린팅·표정·광택·도색 경계", weight: 12, strength: "높음", icon: ScanFace },
  { key: "parts", group: "본체", title: "블리스터·구성품", description: "교체 파츠·내부 포장·조립 상태", weight: 8, strength: "중간", icon: FileCheck2 },
  { key: "purchaseProof", group: "거래", title: "공식 구매내역", description: "구매처·주문일·정확한 상품명이 보이게", weight: 12, strength: "높음", icon: Store },
];

const evidenceGroups: EvidenceGroup[] = ["패키지", "본체", "거래"];
const initialObservations = Object.fromEntries(evidenceItems.map((item) => [item.key, "missing"])) as Record<EvidenceKey, Observation>;
const platforms: Platform[] = ["당근", "X", "번개장터", "기타"];

const sourceLabels: Record<LookupStatus, string> = {
  unknown: "조회하지 않음",
  reported: "가품 사례 보고됨",
  not_reported: "현재 보고된 사례 없음",
  not_found: "정확한 제품을 찾지 못함",
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState("");

  const completedCount = Object.values(observations).filter((value) => value !== "missing").length;
  const assessedCount = Object.values(observations).filter((value) => value === "match" || value === "concern").length;
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
    ? { label: "판단 자료 부족", tone: "neutral", summary: "정확한 판정을 위해 핵심 사진과 비교 결과를 더 채워주세요." }
    : riskPoints >= 22
      ? { label: "위조 위험 높음", tone: "danger", summary: "여러 강한 위험 신호가 겹쳐 거래를 멈추고 추가 확인하는 편이 안전해요." }
      : riskPoints >= 10
        ? { label: "추가 확인 필요", tone: "caution", summary: "긍정 신호도 있지만 결제 전에 해소해야 할 위험 항목이 있어요." }
        : { label: "위조 위험 낮음", tone: "safe", summary: "제출된 범위에서는 뚜렷한 위조 신호가 적지만 정품을 보증하는 결과는 아니에요." };

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
      showToast("복사하지 못했어요. 다시 시도해주세요.");
    }
  };

  const sellerMessage = `안녕하세요! 구매 전 제품 확인을 위해 같은 배경에서 오늘 날짜 메모와 함께 사진 부탁드립니다.\n① 박스 정·후면 ② 제조사 로고와 라이선스 씰 ③ 바코드·QR ④ 받침대 저작권 각인 ⑤ 본체 정·후면 ⑥ 얼굴·도색 근접 ⑦ 블리스터와 구성품 전체 ⑧ 가능하면 구매내역\n정품 여부를 단정하려는 목적이 아니라 정확한 제품판과 상태를 확인하기 위한 요청입니다.`;

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
    showToast("샘플 제품 정보를 불러왔어요.");
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
    showToast("샘플 증거와 비교 결과를 채웠어요.");
  };

  const handleFile = (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileNames((current) => ({ ...current, [key]: file.name }));
    if (observations[key] === "missing") {
      setObservations((current) => ({ ...current, [key]: "unverified" }));
    }
  };

  const removeEvidence = (key: EvidenceKey) => {
    setObservations((current) => ({ ...current, [key]: "missing" }));
    setFileNames((current) => {
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
    }, 900);
  };

  const shareReport = async () => {
    const text = `[피그시그널] ${productName}\n${result.label} · 자료 신뢰도 ${confidence}%\n제품판 ${productNumber} · 검토 증거 ${completedCount}/9\n※ 정품 보증서가 아닌 거래 전 위조 위험 리포트입니다.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "피그시그널 위조 위험 리포트", text });
        return;
      } catch {
        return;
      }
    }
    await copyText(text, "리포트 요약을 복사했어요.");
  };

  const resetAll = () => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand-mark" onClick={resetAll} aria-label="피그시그널 홈">
          <span className="brand-symbol"><ShieldCheck size={20} strokeWidth={2.4} /></span>
          <span>FIGSIGNAL</span>
        </button>
        <div className="topbar-copy">중고 피규어 위조 위험 리포트</div>
        <div className="public-badge"><LockOpen size={14} /> 로그인 없이 무료 점검</div>
      </header>

      <div className="workspace">
        <aside className="side-panel">
          <div className="eyebrow"><span className="live-dot" /> 거래 전 5단계 교차검증</div>
          <h1>정품이라는 말보다<br />남는 증거를 보세요.</h1>
          <p className="side-description">
            제품판, 제조사 공지, MFC, 판매자 사진과 가격을 한 번에 대조해 거래 전에 위험 신호를 찾습니다.
          </p>
          <div className="trust-strip">
            <div><strong>9개</strong><span>증거 항목</span></div>
            <div><strong>3단계</strong><span>출처 등급</span></div>
            <div><strong>0개</strong><span>단독 확정 기준</span></div>
          </div>
          <div className="method-stack">
            <Method icon={Fingerprint} index="01" title="정확한 제품판" copy="제품번호·재판·지역판" />
            <Method icon={Database} index="02" title="외부 가품 정보" copy="제조사 공식·MFC" />
            <Method icon={Images} index="03" title="패키지와 본체" copy="박스·각인·얼굴·부품" />
            <Method icon={Tag} index="04" title="거래 맥락" copy="가격·판매자·구매경로" />
          </div>
          <div className="side-note"><Info size={17} /><p>사진과 거래 정보로 위험을 선별합니다. 정품을 법적으로 보증하거나 제조사를 대신해 감정하지 않습니다.</p></div>
        </aside>

        <section className="main-panel">
          <Progress stage={stage} />

          {stage === "identity" && (
            <div className="flow-card enter">
              <div className="card-heading">
                <div><span className="step-kicker">STEP 01 · PRODUCT ID</span><h2>먼저 정확한 제품판을 찾습니다</h2><p>캐릭터명이 같아도 초판·재판·지역판에 따라 패키지와 씰이 달라질 수 있어요.</p></div>
                <button className="sample-button" onClick={loadDemo}><Sparkles size={15} /> 샘플 입력</button>
              </div>

              <section className="form-section">
                <div className="mini-section-title"><Link2 size={16} /><strong>거래 정보</strong></div>
                <div className="field-group">
                  <label>거래 플랫폼</label>
                  <div className="platform-tabs" role="radiogroup" aria-label="거래 플랫폼">
                    {platforms.map((item) => <button key={item} className={platform === item ? "active" : ""} onClick={() => setPlatform(item)} role="radio" aria-checked={platform === item}>{item}</button>)}
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="listing-url">거래글 링크 <span>선택</span></label>
                  <div className="input-with-icon"><Link2 size={18} /><input id="listing-url" value={listingUrl} onChange={(event) => setListingUrl(event.target.value)} placeholder="https://..." inputMode="url" /></div>
                </div>
              </section>

              <section className="form-section">
                <div className="mini-section-title"><Fingerprint size={16} /><strong>제품 식별</strong><span>판정의 출발점</span></div>
                <div className="two-column-fields balanced">
                  <div className="field-group"><label htmlFor="brand">제조사</label><input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="예: Good Smile Company" /></div>
                  <div className="field-group"><label htmlFor="product-number">제품번호·JAN</label><input id="product-number" value={productNumber} onChange={(event) => setProductNumber(event.target.value)} placeholder="예: No.1528 / 458..." /></div>
                </div>
                <div className="field-group"><label htmlFor="product-name">정확한 제품명</label><input id="product-name" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="예: 넨도로이드 고죠 사토루" /></div>
                <div className="field-group"><label htmlFor="release-version">발매판·버전 <span>선택</span></label><input id="release-version" value={releaseVersion} onChange={(event) => setReleaseVersion(event.target.value)} placeholder="예: 초판 / 재판 / 국내 유통판" /></div>
              </section>

              <section className="form-section">
                <div className="mini-section-title"><SearchCheck size={16} /><strong>외부 가품 정보</strong><span>정보 없음 ≠ 가품 없음</span></div>
                <div className="lookup-grid">
                  <label className="lookup-card">
                    <div><ShieldCheck size={18} /><span><strong>제조사 공식 자료</strong><small>가장 우선하는 출처</small></span></div>
                    <select value={officialStatus} onChange={(event) => setOfficialStatus(event.target.value as LookupStatus)} aria-label="제조사 공식 자료 조회 결과">
                      <option value="unknown">조회하지 않음</option><option value="reported">가품 사례 보고됨</option><option value="not_reported">현재 보고된 사례 없음</option><option value="not_found">정확한 제품을 찾지 못함</option>
                    </select>
                  </label>
                  <label className="lookup-card">
                    <div><Globe2 size={18} /><span><strong>MFC·커뮤니티</strong><small>사용자 비교사진 보완</small></span></div>
                    <select value={communityStatus} onChange={(event) => setCommunityStatus(event.target.value as LookupStatus)} aria-label="MFC 조회 결과">
                      <option value="unknown">조회하지 않음</option><option value="reported">가품 사례 보고됨</option><option value="not_reported">현재 보고된 사례 없음</option><option value="not_found">정확한 제품을 찾지 못함</option>
                    </select>
                  </label>
                </div>
                {(officialStatus === "not_reported" || communityStatus === "not_reported") && <div className="source-caveat"><CircleHelp size={15} /> 보고가 없다는 뜻이며, 가품이 존재하지 않는다는 뜻은 아닙니다.</div>}
              </section>

              <section className="form-section last">
                <div className="mini-section-title"><Store size={16} /><strong>가격과 구매경로</strong></div>
                <div className="price-grid">
                  <div className="field-group"><label htmlFor="retail-price">정가·기준시세</label><div className="price-input"><input id="retail-price" value={retailPrice} onChange={(event) => setRetailPrice(event.target.value)} placeholder="68,000" inputMode="numeric" /><span>원</span></div></div>
                  <div className="field-group"><label htmlFor="price">거래 가격</label><div className="price-input"><input id="price" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="72,000" inputMode="numeric" /><span>원</span></div></div>
                  <div className="field-group"><label htmlFor="seller-proof">판매자 구매경로</label><select id="seller-proof" value={sellerProof} onChange={(event) => setSellerProof(event.target.value)}><option value="none">정보 없음</option><option value="story">구매처만 설명함</option><option value="receipt">공식 주문내역 있음</option></select></div>
                  <div className="field-group"><label htmlFor="origin">생산 정보</label><select id="origin" value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="unknown">알 수 없음</option><option value="china_oem">중국 OEM</option><option value="japan">일본 생산</option><option value="other">기타 국가 생산</option></select></div>
                </div>
                {priceRatio !== null && <PriceSignal ratio={priceRatio} />}
                {origin === "china_oem" && <div className="neutral-line"><Factory size={15} /> 중국 OEM은 제조사의 정식 생산방식일 수 있어 단독 위험 신호로 보지 않습니다.</div>}
              </section>

              <button className="primary-action" disabled={!canContinue} onClick={() => { setStage("evidence"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>제품 증거 점검하기 <ArrowRight size={18} /></button>
            </div>
          )}

          {stage === "evidence" && (
            <div className="flow-card enter evidence-flow">
              <div className="card-heading evidence-heading">
                <div><span className="step-kicker">STEP 02 · EVIDENCE</span><h2>사진마다 비교 결과를 남겨주세요</h2><p>사진을 올린 뒤 공식·MFC 기준 사진과 일치하는지 표시합니다.</p></div>
                <div className="completion-badge"><strong>{completedCount}</strong><span>/ 9</span></div>
              </div>

              <div className="seller-request">
                <div className="request-icon"><MessageSquareText size={20} /></div>
                <div><strong>판매자에게 필요한 사진을 한 번에 요청</strong><p>오늘 날짜 메모를 포함한 8가지 촬영 안내입니다.</p></div>
                <button onClick={() => copyText(sellerMessage, "판매자 요청 문구를 복사했어요.")}><Clipboard size={13} /> 문구 복사</button>
              </div>

              <div className="evidence-toolbar"><span>비교 완료 {assessedCount}개 · 사진 있음 {completedCount}개</span><button onClick={loadDemoEvidence}><Sparkles size={14} /> 샘플 결과 채우기</button></div>

              {evidenceGroups.map((group) => (
                <section className="evidence-section" key={group}>
                  <div className="evidence-section-title"><span>{group}</span><small>{group === "패키지" ? "상자 정·후면과 식별정보" : group === "본체" ? "조형·도색·각인·구성품" : "판매자 출처 증거"}</small></div>
                  <div className="evidence-grid">
                    {evidenceItems.filter((item) => item.group === group).map((item) => {
                      const Icon = item.icon;
                      const observation = observations[item.key];
                      return (
                        <div className={`evidence-audit ${observation}`} key={item.key}>
                          <div className="audit-main">
                            <div className="evidence-icon"><Icon size={20} /></div>
                            <div className="evidence-copy"><div className="evidence-title-row"><strong>{item.title}</strong><span className={`strength ${item.strength}`}>{item.strength}</span></div><p>{item.description}</p>{fileNames[item.key] && <small>{fileNames[item.key]}</small>}</div>
                            {observation !== "missing" && <button className="remove-file" onClick={() => removeEvidence(item.key)} aria-label={`${item.title} 초기화`} title="초기화"><X size={15} /></button>}
                          </div>
                          <div className="audit-actions">
                            <label className="upload-button"><input type="file" accept="image/*" onChange={(event) => handleFile(item.key, event)} /><Upload size={13} /> {fileNames[item.key] ? "사진 변경" : "사진 추가"}</label>
                            <button className={observation === "unverified" ? "active plain" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "unverified" }))}>미확인</button>
                            <button className={observation === "match" ? "active match" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "match" }))}><Check size={13} /> 일치</button>
                            <button className={observation === "concern" ? "active concern" : ""} onClick={() => setObservations((current) => ({ ...current, [item.key]: "concern" }))}><TriangleAlert size={13} /> 차이</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              <div className="evidence-guidance"><Info size={16} /><div><strong>씰 하나로 판단하지 않습니다.</strong><p>씰이 없는 정품, 복제된 씰, 정품 박스에 가품 내용물을 넣는 사례가 있어 다른 증거와 함께 봅니다.</p></div></div>

              <div className="action-row"><button className="secondary-action" onClick={() => setStage("identity")}><ArrowLeft size={17} /> 이전</button><button className="primary-action compact" onClick={analyze} disabled={isAnalyzing || completedCount === 0}>{isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 교차검증 중...</> : <>위험 리포트 만들기 <ArrowRight size={18} /></>}</button></div>
            </div>
          )}

          {stage === "report" && (
            <div className="report enter">
              <div className={`report-hero ${result.tone}`}>
                <div className="report-meta"><span>FIGSIGNAL · MULTI-SOURCE REPORT</span><span>FGS-0714-4822</span></div>
                <div className="report-main">
                  <div className="score-ring" style={{ "--score": `${confidence * 3.6}deg` } as React.CSSProperties}><div><strong>{confidence}</strong><span>자료 신뢰도</span></div></div>
                  <div className="report-title"><span className="result-chip"><ShieldCheck size={17} /> 5단계 교차검증</span><h2>{result.label}</h2><p>{result.summary}</p></div>
                </div>
                <div className="report-product"><div className="mini-product-icon"><Fingerprint size={21} /></div><div><span>{brand} · {releaseVersion || "버전 미입력"}</span><strong>{productName}</strong><small>{productNumber}</small></div>{price && <b>{price}원</b>}</div>
              </div>

              <div className="report-grid expanded">
                <section className="source-summary">
                  <SourceResult icon={ShieldCheck} title="제조사 공식" status={officialStatus} priority="높은 우선순위" />
                  <SourceResult icon={Globe2} title="MFC·커뮤니티" status={communityStatus} priority="보완 자료" />
                  <SourceResult icon={Store} title="판매자 출처" status={sellerProof === "receipt" ? "reported" : sellerProof === "story" ? "not_reported" : "unknown"} customLabel={sellerProof === "receipt" ? "공식 주문내역 있음" : sellerProof === "story" ? "구매처 설명만 있음" : "출처 정보 없음"} priority="거래 증거" />
                </section>

                <section className="report-section signals">
                  <div className="section-title"><div><SearchCheck size={20} /><h3>교차검증 결과</h3></div><span>{assessedCount}개 비교 · {completedCount}개 증거</span></div>
                  <div className="signal-list">
                    <SignalRow tone={concernItems.length ? "warn" : "good"} title="패키지·본체 비교" copy={concernItems.length ? `${concernItems.map((item) => item.title).join(", ")}에서 기준과 다른 점이 표시됐어요.` : "비교 완료 항목에서 사용자가 표시한 차이점이 없어요."} />
                    <SignalRow tone={priceRatio !== null && priceRatio < 0.75 ? "warn" : "good"} title="가격 이상치" copy={priceRatio === null ? "기준시세와 거래가격을 입력하지 않아 가격 위험을 계산하지 못했어요." : priceRatio < 0.55 ? "기준가의 절반 수준으로 매우 낮아 구매경로 확인이 필요해요." : priceRatio < 0.75 ? "기준가보다 크게 낮아 할인 이유와 판매자 출처를 확인하세요." : "입력된 기준가 대비 비정상적으로 낮은 가격은 아니에요."} />
                    <SignalRow tone={sellerProof === "none" ? "warn" : "good"} title="구매경로" copy={sellerProof === "receipt" ? "공식 주문내역이 제출돼 높은 가중치로 반영됐어요." : sellerProof === "story" ? "판매자 설명은 있지만 영수증·주문내역이 필요해요." : "판매자의 원구매처를 확인할 자료가 없어요."} />
                    <SignalRow tone="neutral" title="생산국·OEM" copy={origin === "china_oem" ? "중국 OEM은 정식 생산일 수 있어 위험 점수에 반영하지 않았어요." : "생산국은 제조사와 생산 계약을 확인해야 하며 단독 판정 근거가 아니에요."} />
                  </div>
                </section>

                {(concernItems.length > 0 || unverifiedItems.length > 0 || missingItems.length > 0) && (
                  <section className="report-section next-check">
                    <div className="section-title"><div><CircleAlert size={20} /><h3>거래 전 다음 확인</h3></div></div>
                    <ol>
                      {concernItems.length > 0 && <li><span>1</span><div><strong>차이 표시 항목 재촬영</strong><p>{concernItems.map((item) => item.title).join(", ")}을 같은 각도·조명으로 다시 비교하세요.</p></div></li>}
                      {unverifiedItems.length > 0 && <li><span>{concernItems.length ? 2 : 1}</span><div><strong>사진만 있는 항목 판독</strong><p>{unverifiedItems.map((item) => item.title).join(", ")}의 기준 일치 여부를 확인하세요.</p></div></li>}
                      {missingItems.length > 0 && <li><span>{(concernItems.length ? 1 : 0) + (unverifiedItems.length ? 1 : 0) + 1}</span><div><strong>누락 증거 추가</strong><p>{missingItems.slice(0, 4).map((item) => item.title).join(", ")}{missingItems.length > 4 ? " 외" : ""} 사진이 필요해요.</p></div></li>}
                    </ol>
                  </section>
                )}

                <section className="source-ladder">
                  <div><FileSearch size={18} /><span><strong>판정 출처 우선순위</strong><small>제조사 공식 → 정확한 SKU·구매내역 → MFC 비교사진 → 외관 휴리스틱</small></span></div>
                  <p>MFC에 보고가 없거나 씰이 붙어 있다는 사실만으로 정품이라고 결론내리지 않습니다.</p>
                </section>
              </div>

              <div className="report-actions"><button className="secondary-action" onClick={() => setStage("evidence")}><ArrowLeft size={17} /> 증거 수정</button><button className="share-action" onClick={shareReport}><Share2 size={18} /> 거래 채팅에 공유</button></div>
              <div className="report-disclaimer"><Info size={16} /><p>이 결과는 사용자가 입력한 정보와 비교 표시를 구조화한 위험 의견입니다. 고가·희귀 제품은 제조사 또는 전문 감정인의 추가 확인을 권장합니다.</p></div>
              <button className="new-check" onClick={resetAll}><RotateCcw size={16} /> 다른 피규어 점검하기</button>
            </div>
          )}
        </section>
      </div>

      {toast && <div className="toast" role="status"><CheckCircle2 size={18} /> {toast}</div>}
    </main>
  );
}

function Progress({ stage }: { stage: Stage }) {
  const active = stage === "identity" ? 1 : stage === "evidence" ? 2 : 3;
  const steps = ["제품·출처", "증거 비교", "위험 리포트"];
  return <div className="progress" aria-label={`전체 3단계 중 ${active}단계`}>{steps.map((label, index) => { const number = index + 1; return <div className={`progress-step ${active === number ? "active" : ""} ${active > number ? "done" : ""}`} key={label}><span>{active > number ? <Check size={14} /> : number}</span><p>{label}</p></div>; })}</div>;
}

function Method({ icon: Icon, index, title, copy }: { icon: typeof Camera; index: string; title: string; copy: string }) {
  return <div className="method-row"><span>{index}</span><Icon size={17} /><div><strong>{title}</strong><small>{copy}</small></div></div>;
}

function PriceSignal({ ratio }: { ratio: number }) {
  const level = ratio < 0.55 ? "danger" : ratio < 0.75 ? "warn" : "safe";
  const text = ratio < 0.55 ? "기준가의 절반 수준입니다. 매우 낮은 가격은 강한 거래 위험 신호예요." : ratio < 0.75 ? "기준가보다 크게 낮습니다. 할인 이유와 판매자 출처를 확인하세요." : "입력된 기준가 대비 비정상적으로 낮은 가격은 아닙니다.";
  return <div className={`price-signal ${level}`}><Tag size={15} /><span><strong>기준가 대비 {Math.round(ratio * 100)}%</strong>{text}</span></div>;
}

function SourceResult({ icon: Icon, title, status, priority, customLabel }: { icon: typeof Camera; title: string; status: LookupStatus | string; priority: string; customLabel?: string }) {
  const lookupStatus = status as LookupStatus;
  const reported = lookupStatus === "reported";
  const unknown = lookupStatus === "unknown" || lookupStatus === "not_found";
  return <div className={`source-result ${reported ? "reported" : unknown ? "unknown" : "clear"}`}><div className="source-result-icon"><Icon size={18} /></div><div><span>{priority}</span><strong>{title}</strong><small>{customLabel || sourceLabels[lookupStatus]}</small></div>{reported ? <TriangleAlert size={16} /> : unknown ? <CircleHelp size={16} /> : <Check size={16} />}</div>;
}

function SignalRow({ tone, title, copy }: { tone: "good" | "warn" | "neutral"; title: string; copy: string }) {
  return <div className="signal-row"><div className={`signal-icon ${tone}`}>{tone === "good" ? <Check size={16} /> : tone === "warn" ? <CircleAlert size={16} /> : <Info size={16} />}</div><div><strong>{title}</strong><p>{copy}</p></div></div>;
}
