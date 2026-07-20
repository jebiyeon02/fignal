/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ExternalLink, FileCheck2, ImageOff, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AnalysisFinding } from "../../api/analyze/analysis-contract";
import { expandedProducts, isOfficialProductImage } from "../../catalog";
import { verificationVerdictCopy } from "../../verification-history";
import { getVerificationHistoryById } from "../../../db/verification-history";
import { ReportProductImage } from "./report-product-image";

const findingStatusCopy: Record<AnalysisFinding["status"], { label: string; tone: string }> = {
  match: { label: "일치", tone: "match" },
  concern: { label: "차이 의심", tone: "concern" },
  unclear: { label: "확인 어려움", tone: "unclear" },
};

function formatReportDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function VerificationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getVerificationHistoryById(id);
  if (!report) notFound();

  const verdict = verificationVerdictCopy[report.verdict];
  const imagesByEvidenceKey = new Map(report.images.map((image) => [image.evidenceKey, image.url]));
  const currentCatalogProduct = expandedProducts.find((product) => product.id === report.productId);
  const productImageSources = [
    report.productImage,
    currentCatalogProduct?.image ?? "",
  ].filter(isOfficialProductImage);

  return (
    <main className="readonly-report">
      <header className="report-topbar">
        <Link href="/" className="report-brand">FIGSIGNAL</Link>
        <span><LockKeyhole size={14} /> 읽기 전용 리포트</span>
      </header>

      <div className="report-shell">
        <Link href="/#recent-verifications" className="report-back"><ArrowLeft size={16} /> 최근 검증 사례</Link>

        <section className={`report-hero ${verdict.tone}`}>
          <div className="report-product-image">
            <ReportProductImage sources={productImageSources} alt={`${report.productName} 제품 이미지`} />
          </div>
          <div className="report-hero-copy">
            <h1>{report.productName}</h1>
            <p>{report.productMaker} · {formatReportDate(report.createdAt)}</p>
            <strong>{verdict.label}</strong>
            <em>{report.summary}</em>
          </div>
          <div className="report-metrics">
            <div><strong>{report.photoCount}</strong><span>분석 사진</span></div>
            <div><strong>{report.riskSignalCount}</strong><span>위험 신호</span></div>
          </div>
        </section>

        <section className="report-findings" aria-labelledby="report-findings-title">
          <header>
            <div><FileCheck2 size={20} /><h2 id="report-findings-title">사진별 판정 근거</h2></div>
            <span>공개 사진 {report.images.length}장</span>
          </header>

          <div className="report-finding-list">
            {report.analysis.findings.map((finding) => {
              const status = findingStatusCopy[finding.status];
              const imageUrl = imagesByEvidenceKey.get(finding.key);
              const internalAction = finding.userAction.toLowerCase().replace(/[\s-]+/g, "_");
              const userAction = finding.status !== "match" && internalAction !== "not_applicable" && internalAction !== "n/a"
                ? finding.userAction
                : null;
              return (
                <article className={`report-finding ${status.tone}`} key={finding.key}>
                  <div className="report-finding-media">
                    {imageUrl
                      ? <img src={imageUrl} alt={`${finding.title} 검증에 사용된 사진`} />
                      : <span><ImageOff size={26} /><small>{finding.key === "purchaseProof" ? "구매내역 사진 비공개" : "공개 사진 없음"}</small></span>}
                  </div>
                  <div className="report-finding-copy">
                    <div><h3>{finding.title}</h3><span>{status.label}</span></div>
                    <p>{finding.reason}</p>
                    <dl>
                      <div><dt>사진 근거</dt><dd>{finding.visibleEvidence}</dd></div>
                      {userAction && <div><dt>다음 확인</dt><dd>{userAction}</dd></div>}
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="report-source">
          <div><ShieldCheck size={18} /><span><strong>공식 제품 정보와 검수 사례를 기준으로 분석</strong><small>이 리포트는 사진 기반 참고 의견이며 정품 보증서나 제조사 판정이 아닙니다.</small></span></div>
          {report.productOfficialUrl && <a href={report.productOfficialUrl} target="_blank" rel="noreferrer">제품 정보 페이지 <ExternalLink size={14} /></a>}
        </section>
      </div>
    </main>
  );
}
