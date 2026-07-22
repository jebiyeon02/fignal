"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  Image as ImageIcon,
  MessageCircle,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { AnalysisFinding, AnalysisResult, EvidenceKey } from "./api/analyze/analysis-contract";
import type { Observation, Product } from "./home-types";
import type { ReviewPath } from "./review-path";

type AiFinding = AnalysisFinding;
type AiAnalysis = AnalysisResult;

export function ReviewPathSection({
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
        <div className="review-path-heading"><TriangleAlert size={21} /><span><strong>명확한 비정상 신호 {riskSignalCount}개를 감지했어요</strong></span></div>
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

export function AiFindingsSection({ analysis, observations, previews, reviewed, onReview, onResetReview }: {
  analysis: AiAnalysis;
  observations: Record<EvidenceKey, Observation>;
  previews: Partial<Record<EvidenceKey, string>>;
  reviewed: Partial<Record<EvidenceKey, boolean>>;
  onReview: (finding: AiFinding, value: Observation) => void;
  onResetReview: (finding: AiFinding) => void;
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
      {isEditing && <p className="ai-review-intro">사진에서 실제로 보이는 내용을 확인한 뒤 판정을 선택해 주세요.</p>}
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
                    <button
                      type="button"
                      className="review-reset"
                      disabled={!reviewed[finding.key]}
                      onClick={() => onResetReview(finding)}
                      aria-label={`${finding.title}을 AI 판단으로 초기화`}
                    >
                      <RotateCcw size={12} /> 초기화
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
