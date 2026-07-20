/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ExternalLink, FileCheck2, ImageOff, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityPostById } from "../../../db/community-posts";
import type { AnalysisFinding } from "../../api/analyze/analysis-contract";
import { expandedProducts, isOfficialProductImage } from "../../catalog";
import { communityPostStatusCopy } from "../../community";
import { verificationVerdictCopy } from "../../verification-history";
import { ReportProductImage } from "../../reports/[id]/report-product-image";

export const dynamic = "force-dynamic";

const findingStatusCopy: Record<AnalysisFinding["status"], { label: string; tone: string }> = {
  match: { label: "일치", tone: "match" },
  concern: { label: "차이 의심", tone: "concern" },
  unclear: { label: "확인 어려움", tone: "unclear" },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getCommunityPostById(id);
  if (!post) notFound();

  const report = post.verification;
  const verdict = verificationVerdictCopy[report.verdict];
  const imagesByEvidenceKey = new Map(report.images.map((image) => [image.evidenceKey, image.url]));
  const catalogProduct = expandedProducts.find((product) => product.id === report.productId);
  const productImageSources = [report.productImage, catalogProduct?.image ?? ""].filter(isOfficialProductImage);

  return (
    <main className="readonly-report community-detail-page">
      <header className="report-topbar">
        <Link href="/" className="report-brand">FIGSIGNAL</Link>
        <span><MessageCircle size={14} /> 검증 사례</span>
      </header>

      <div className="report-shell">
        <Link href="/community" className="report-back"><ArrowLeft size={16} /> 검증 사례 목록</Link>

        <article className="community-post-heading">
          <div><span>{communityPostStatusCopy[post.status]}</span><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div>
          <h1>{post.title}</h1>
          {post.body && <p>{post.body}</p>}
          <small>검증자 작성 · 검증 완료 결과에서 게시됨</small>
        </article>

        <section className={`report-hero ${verdict.tone}`}>
          <div className="report-product-image"><ReportProductImage sources={productImageSources} alt={`${report.productName} 제품 이미지`} /></div>
          <div className="report-hero-copy">
            <span>VERIFICATION RESULT · No.{report.productNumber}</span>
            <h2>{report.productName}</h2>
            <p>{report.productMaker} · 검증 {formatDate(report.createdAt)}</p>
            <strong>{verdict.label}</strong>
            <em>{report.summary}</em>
          </div>
          <div className="report-metrics">
            <div><strong>{report.photoCount}</strong><span>분석 사진</span></div>
            <div><strong>{report.riskSignalCount}</strong><span>위험 신호</span></div>
          </div>
        </section>

        <section className="report-findings" aria-labelledby="community-findings-title">
          <header><div><FileCheck2 size={20} /><h2 id="community-findings-title">게시된 검증 근거</h2></div><span>공개 사진 {report.images.length}장</span></header>
          <div className="report-finding-list">
            {report.analysis.findings.map((finding) => {
              const status = findingStatusCopy[finding.status];
              const imageUrl = imagesByEvidenceKey.get(finding.key);
              return (
                <article className={`report-finding ${status.tone}`} key={finding.key}>
                  <div className="report-finding-media">{imageUrl ? <img src={imageUrl} alt={`${finding.title} 검증 사진`} /> : <span><ImageOff size={26} /><small>{finding.key === "purchaseProof" ? "구매내역 사진 비공개" : "공개 사진 없음"}</small></span>}</div>
                  <div className="report-finding-copy">
                    <div><h3>{finding.title}</h3><span>{status.label}</span></div>
                    <p>{finding.reason}</p>
                    <dl><div><dt>사진 근거</dt><dd>{finding.visibleEvidence}</dd></div></dl>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="report-source community-post-source">
          <div><ShieldCheck size={18} /><span><strong>실제 검증 기록과 연결된 게시물</strong><small>게시자가 결론을 수정할 수 없으며 최초 AI 분석 결과가 그대로 표시됩니다.</small></span></div>
          <span className="community-source-links"><Link href={`/reports/${report.id}`}>원본 리포트 <FileCheck2 size={14} /></Link>{report.productOfficialUrl && <a href={report.productOfficialUrl} target="_blank" rel="noreferrer">공식 제품 <ExternalLink size={14} /></a>}</span>
        </section>
      </div>
    </main>
  );
}
