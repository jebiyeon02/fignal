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
  CircleAlert,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Info,
  Link2,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  ScanFace,
  Share2,
  ShieldCheck,
  Sparkles,
  Stamp,
  Store,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

type Stage = "listing" | "evidence" | "report";
type Platform = "당근" | "X" | "번개장터" | "기타";
type EvidenceKey =
  | "boxFront"
  | "boxBack"
  | "baseMark"
  | "figureFull"
  | "facePaint"
  | "blister"
  | "purchaseProof";

type EvidenceItem = {
  key: EvidenceKey;
  title: string;
  description: string;
  required: boolean;
  icon: typeof Camera;
};

const evidenceItems: EvidenceItem[] = [
  {
    key: "boxFront",
    title: "박스 정면",
    description: "로고·상품명·창 모양이 선명하게",
    required: true,
    icon: Box,
  },
  {
    key: "boxBack",
    title: "박스 후면",
    description: "바코드·유통사·주의문구가 보이게",
    required: true,
    icon: PackageCheck,
  },
  {
    key: "baseMark",
    title: "받침대 각인",
    description: "저작권 표기와 제조국을 근접 촬영",
    required: true,
    icon: Stamp,
  },
  {
    key: "figureFull",
    title: "본체 전체",
    description: "정면과 후면의 비율·도색을 확인",
    required: true,
    icon: Camera,
  },
  {
    key: "facePaint",
    title: "얼굴·도색 근접",
    description: "눈 프린팅과 피부 광택이 보이게",
    required: true,
    icon: ScanFace,
  },
  {
    key: "blister",
    title: "블리스터·구성품",
    description: "내부 포장과 교체 파츠 전체",
    required: true,
    icon: FileCheck2,
  },
  {
    key: "purchaseProof",
    title: "구매 내역",
    description: "공식 판매처 영수증 또는 주문 화면",
    required: false,
    icon: Store,
  },
];

const initialEvidence = Object.fromEntries(
  evidenceItems.map((item) => [item.key, false]),
) as Record<EvidenceKey, boolean>;

const platforms: Platform[] = ["당근", "X", "번개장터", "기타"];

export default function Home() {
  const [stage, setStage] = useState<Stage>("listing");
  const [platform, setPlatform] = useState<Platform>("당근");
  const [listingUrl, setListingUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [knownFake, setKnownFake] = useState("unknown");
  const [sellerProof, setSellerProof] = useState("none");
  const [evidence, setEvidence] = useState(initialEvidence);
  const [fileNames, setFileNames] = useState<Partial<Record<EvidenceKey, string>>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState("");

  const completedCount = Object.values(evidence).filter(Boolean).length;
  const requiredCompleted = evidenceItems
    .filter((item) => item.required)
    .filter((item) => evidence[item.key]).length;

  const score = useMemo(() => {
    const evidenceScore = requiredCompleted * 8;
    const proofScore = evidence.purchaseProof ? 8 : sellerProof === "receipt" ? 7 : sellerProof === "story" ? 3 : 0;
    const fakePenalty = knownFake === "yes" ? 7 : knownFake === "unknown" ? 3 : 0;
    return Math.max(29, Math.min(96, 38 + evidenceScore + proofScore - fakePenalty));
  }, [requiredCompleted, evidence.purchaseProof, sellerProof, knownFake]);

  const risk = score >= 82
    ? { label: "위조 위험 낮음", tone: "safe", summary: "현재 증거에서 뚜렷한 위조 신호가 발견되지 않았어요." }
    : score >= 65
      ? { label: "추가 확인 권장", tone: "caution", summary: "긍정 신호가 많지만 거래 전 한 번 더 확인할 항목이 있어요." }
      : { label: "주의 필요", tone: "danger", summary: "판단에 필요한 증거가 부족해 지금 결제하기엔 위험해요." };

  const canContinue = brand.trim().length > 1 && productName.trim().length > 1;

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

  const sellerMessage = `안녕하세요! 구매 전 정품 여부 확인을 위해 사진 몇 장 부탁드려도 될까요?\n① 박스 정·후면 ② 받침대 저작권 각인 ③ 본체 정·후면 ④ 얼굴/도색 근접 ⑤ 블리스터와 구성품 전체\n사진은 같은 배경에서 오늘 날짜 메모와 함께 부탁드립니다.`;

  const loadDemo = () => {
    setPlatform("당근");
    setListingUrl("https://www.daangn.com/articles/figure-sample");
    setBrand("Good Smile Company");
    setProductName("넨도로이드 1667 고죠 사토루");
    setPrice("72,000");
    setKnownFake("yes");
    setSellerProof("receipt");
    showToast("샘플 거래글을 불러왔어요.");
  };

  const loadDemoEvidence = () => {
    setEvidence({
      boxFront: true,
      boxBack: true,
      baseMark: true,
      figureFull: true,
      facePaint: true,
      blister: false,
      purchaseProof: true,
    });
    setFileNames({
      boxFront: "box-front.jpg",
      boxBack: "box-back.jpg",
      baseMark: "base-mark.jpg",
      figureFull: "figure-full.jpg",
      facePaint: "face-closeup.jpg",
      purchaseProof: "official-order.png",
    });
    showToast("샘플 증거 6개를 채웠어요.");
  };

  const handleFile = (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEvidence((current) => ({ ...current, [key]: true }));
    setFileNames((current) => ({ ...current, [key]: file.name }));
  };

  const removeEvidence = (key: EvidenceKey) => {
    setEvidence((current) => ({ ...current, [key]: false }));
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
    }, 1100);
  };

  const shareReport = async () => {
    const text = `[피그시그널] ${productName || "피규어"}\n${risk.label} · 신뢰도 ${score}%\n검토 증거 ${completedCount}개 / 리포트 FGS-0714-4821`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "피그시그널 위험도 리포트", text });
        return;
      } catch {
        return;
      }
    }
    await copyText(text, "리포트 요약을 복사했어요.");
  };

  const resetAll = () => {
    setStage("listing");
    setListingUrl("");
    setBrand("");
    setProductName("");
    setPrice("");
    setKnownFake("unknown");
    setSellerProof("none");
    setEvidence(initialEvidence);
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
        <button className="header-action" onClick={() => showToast("저장된 리포트는 다음 버전에서 열려요.")}>
          내 리포트 <ChevronRight size={16} />
        </button>
      </header>

      <div className="workspace">
        <aside className="side-panel">
          <div className="eyebrow"><span className="live-dot" /> 거래 전 3분 점검</div>
          <h1>“정품 맞나요?”를<br />감이 아닌 증거로.</h1>
          <p className="side-description">
            판매자 사진과 상품 정보를 한곳에 모아 위조 위험 신호를 확인하고, 결과를 거래 채팅에 바로 공유하세요.
          </p>
          <div className="trust-strip">
            <div><strong>7개</strong><span>핵심 증거</span></div>
            <div><strong>3단계</strong><span>위험 신호</span></div>
            <div><strong>1링크</strong><span>결과 공유</span></div>
          </div>
          <div className="side-note">
            <Info size={17} />
            <p>정품을 법적으로 보증하지 않습니다. 사진과 거래 정보를 바탕으로 위험을 선별하는 사전 점검 서비스입니다.</p>
          </div>
        </aside>

        <section className="main-panel">
          <Progress stage={stage} />

          {stage === "listing" && (
            <div className="flow-card enter">
              <div className="card-heading">
                <div>
                  <span className="step-kicker">STEP 01</span>
                  <h2>거래글을 알려주세요</h2>
                  <p>정확한 상품 버전을 찾을 수 있도록 보이는 정보를 입력해요.</p>
                </div>
                <button className="sample-button" onClick={loadDemo}><Sparkles size={15} /> 샘플로 체험</button>
              </div>

              <div className="field-group">
                <label>거래 플랫폼</label>
                <div className="platform-tabs" role="radiogroup" aria-label="거래 플랫폼">
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
                <div className="input-with-icon">
                  <Link2 size={18} />
                  <input
                    id="listing-url"
                    value={listingUrl}
                    onChange={(event) => setListingUrl(event.target.value)}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </div>
              </div>

              <div className="two-column-fields">
                <div className="field-group">
                  <label htmlFor="brand">제조사·브랜드</label>
                  <input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="예: Good Smile Company" />
                </div>
                <div className="field-group">
                  <label htmlFor="price">거래 가격 <span>선택</span></label>
                  <div className="price-input">
                    <input id="price" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="72,000" inputMode="numeric" />
                    <span>원</span>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="product-name">상품명·버전</label>
                <input id="product-name" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="예: 넨도로이드 1667 고죠 사토루" />
                <span className="field-help">재판·한정판·해외판 여부까지 적으면 판정이 더 정확해져요.</span>
              </div>

              <div className="two-column-fields">
                <div className="field-group">
                  <label htmlFor="known-fake">알려진 가품이 있나요?</label>
                  <select id="known-fake" value={knownFake} onChange={(event) => setKnownFake(event.target.value)}>
                    <option value="unknown">잘 모르겠어요</option>
                    <option value="yes">있다고 들었어요</option>
                    <option value="no">없는 것으로 알아요</option>
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="seller-proof">판매자가 밝힌 구매 경로</label>
                  <select id="seller-proof" value={sellerProof} onChange={(event) => setSellerProof(event.target.value)}>
                    <option value="none">정보 없음</option>
                    <option value="story">구매처만 설명함</option>
                    <option value="receipt">공식 판매처 내역 있음</option>
                  </select>
                </div>
              </div>

              <button className="primary-action" disabled={!canContinue} onClick={() => { setStage("evidence"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                증거 사진 확인하기 <ArrowRight size={18} />
              </button>
            </div>
          )}

          {stage === "evidence" && (
            <div className="flow-card enter">
              <div className="card-heading evidence-heading">
                <div>
                  <span className="step-kicker">STEP 02</span>
                  <h2>사진 증거를 모아주세요</h2>
                  <p>직접 받은 사진만 사용하세요. 판매글 캡처보다 원본 사진이 좋아요.</p>
                </div>
                <div className="completion-badge"><strong>{completedCount}</strong> / 7</div>
              </div>

              <div className="seller-request">
                <div className="request-icon"><Clipboard size={20} /></div>
                <div>
                  <strong>사진이 부족한가요?</strong>
                  <p>판매자에게 보낼 요청 문구를 준비했어요.</p>
                </div>
                <button onClick={() => copyText(sellerMessage, "판매자 요청 문구를 복사했어요.")}>문구 복사</button>
              </div>

              <div className="evidence-toolbar">
                <span>필수 사진 {requiredCompleted}/6</span>
                <button onClick={loadDemoEvidence}><Sparkles size={14} /> 샘플 사진 상태 채우기</button>
              </div>

              <div className="evidence-grid">
                {evidenceItems.map((item) => {
                  const Icon = item.icon;
                  const checked = evidence[item.key];
                  return (
                    <div className={`evidence-item ${checked ? "uploaded" : ""}`} key={item.key}>
                      {checked ? (
                        <>
                          <div className="uploaded-icon"><Check size={21} /></div>
                          <div className="evidence-copy">
                            <div className="evidence-title-row"><strong>{item.title}</strong>{!item.required && <span>선택</span>}</div>
                            <p>{fileNames[item.key] || "사진 확인 완료"}</p>
                          </div>
                          <button className="remove-file" onClick={() => removeEvidence(item.key)} aria-label={`${item.title} 제거`} title="사진 제거"><X size={16} /></button>
                        </>
                      ) : (
                        <label>
                          <input type="file" accept="image/*" onChange={(event) => handleFile(item.key, event)} />
                          <div className="evidence-icon"><Icon size={21} /></div>
                          <div className="evidence-copy">
                            <div className="evidence-title-row"><strong>{item.title}</strong>{!item.required && <span>선택</span>}</div>
                            <p>{item.description}</p>
                          </div>
                          <Upload className="upload-arrow" size={17} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {requiredCompleted < 4 && (
                <div className="warning-line"><CircleAlert size={17} /> 필수 사진이 4개 미만이면 결과 신뢰도가 낮아져요.</div>
              )}

              <div className="action-row">
                <button className="secondary-action" onClick={() => setStage("listing")}><ArrowLeft size={17} /> 이전</button>
                <button className="primary-action compact" onClick={analyze} disabled={isAnalyzing || completedCount === 0}>
                  {isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 증거 대조 중...</> : <>위험 신호 분석하기 <ArrowRight size={18} /></>}
                </button>
              </div>
            </div>
          )}

          {stage === "report" && (
            <div className="report enter">
              <div className={`report-hero ${risk.tone}`}>
                <div className="report-meta">
                  <span>FIGSIGNAL REPORT</span>
                  <span>FGS-0714-4821</span>
                </div>
                <div className="report-main">
                  <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
                    <div><strong>{score}</strong><span>신뢰도</span></div>
                  </div>
                  <div className="report-title">
                    <span className="result-chip"><ShieldCheck size={17} /> 1차 점검 완료</span>
                    <h2>{risk.label}</h2>
                    <p>{risk.summary}</p>
                  </div>
                </div>
                <div className="report-product">
                  <div className="mini-product-icon"><Box size={21} /></div>
                  <div><span>{brand}</span><strong>{productName}</strong></div>
                  {price && <b>{price}원</b>}
                </div>
              </div>

              <div className="report-grid">
                <section className="report-section signals">
                  <div className="section-title"><div><BadgeCheck size={20} /><h3>확인된 신호</h3></div><span>{completedCount}개 증거 검토</span></div>
                  <div className="signal-list">
                    <SignalRow tone="good" title="박스 인쇄 정보" copy={evidence.boxFront && evidence.boxBack ? "로고·상품명·바코드 배치가 기준 이미지와 일치해요." : "박스 정·후면 중 일부가 없어 완전히 대조하지 못했어요."} />
                    <SignalRow tone={evidence.baseMark ? "good" : "warn"} title="저작권·제조 각인" copy={evidence.baseMark ? "받침대 각인 형식에서 뚜렷한 이상이 보이지 않아요." : "받침대 각인 사진을 추가하면 판정력이 크게 올라가요."} />
                    <SignalRow tone={evidence.facePaint ? "good" : "warn"} title="얼굴 프린팅과 도색" copy={evidence.facePaint ? "눈 위치와 피부 광택이 정품 참고 범위에 있어요." : "얼굴 근접 사진이 없어 프린팅 품질을 확인하지 못했어요."} />
                    <SignalRow tone={sellerProof === "receipt" || evidence.purchaseProof ? "good" : "warn"} title="판매자 구매 경로" copy={sellerProof === "receipt" || evidence.purchaseProof ? "공식 판매처 구매 내역이 함께 제출됐어요." : "구매처 증빙이 없어 판매자 설명에 의존하고 있어요."} />
                  </div>
                </section>

                <section className="report-section next-check">
                  <div className="section-title"><div><CircleAlert size={20} /><h3>거래 전 마지막 확인</h3></div></div>
                  <ol>
                    {!evidence.blister && <li><span>1</span><div><strong>블리스터 사진 받기</strong><p>내부 포장과 교체 파츠 누락 여부를 확인하세요.</p></div></li>}
                    {knownFake === "yes" && <li><span>{!evidence.blister ? 2 : 1}</span><div><strong>가품 비교 사진 한 번 더 대조</strong><p>이 모델은 알려진 가품 사례가 있어 세부 차이가 중요해요.</p></div></li>}
                    <li><span>{(!evidence.blister ? 1 : 0) + (knownFake === "yes" ? 1 : 0) + 1}</span><div><strong>플랫폼 안에서 결제</strong><p>수령 후 확인 전까지 구매 확정을 미루세요.</p></div></li>
                  </ol>
                </section>
              </div>

              <div className="report-actions">
                <button className="secondary-action" onClick={() => setStage("evidence")}><ArrowLeft size={17} /> 사진 수정</button>
                <button className="share-action" onClick={shareReport}><Share2 size={18} /> 거래 채팅에 공유</button>
              </div>

              <div className="report-disclaimer">
                <Info size={16} />
                <p>이 결과는 제출된 정보로 산정한 위조 위험 의견이며 정품 보증서가 아닙니다. 고가·희귀 제품은 제조사 또는 전문 감정인의 추가 확인을 권장합니다.</p>
                {listingUrl && <a href={listingUrl} target="_blank" rel="noreferrer">원본 거래글 <ExternalLink size={13} /></a>}
              </div>

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
  const active = stage === "listing" ? 1 : stage === "evidence" ? 2 : 3;
  const steps = ["상품 정보", "증거 사진", "위험도 리포트"];
  return (
    <div className="progress" aria-label={`전체 3단계 중 ${active}단계`}>
      {steps.map((label, index) => {
        const number = index + 1;
        return (
          <div className={`progress-step ${active === number ? "active" : ""} ${active > number ? "done" : ""}`} key={label}>
            <span>{active > number ? <Check size={14} /> : number}</span>
            <p>{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function SignalRow({ tone, title, copy }: { tone: "good" | "warn"; title: string; copy: string }) {
  return (
    <div className="signal-row">
      <div className={`signal-icon ${tone}`}>{tone === "good" ? <Check size={16} /> : <CircleAlert size={16} />}</div>
      <div><strong>{title}</strong><p>{copy}</p></div>
    </div>
  );
}
