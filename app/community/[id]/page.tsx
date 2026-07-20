/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ExternalLink, FileCheck2, ImageOff, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "../../brand-mark";
import { getCommunityPostById } from "../../../db/community-posts";
import { listCommunityComments } from "../../../db/community-comments";
import type { AnalysisFinding } from "../../api/analyze/analysis-contract";
import { expandedProducts, isOfficialProductImage } from "../../catalog";
import { verificationVerdictCopy } from "../../verification-history";
import { ReportProductImage } from "../../reports/[id]/report-product-image";
import { CommunityComments } from "./comments";

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

export default async function CommunityPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const post = await getCommunityPostById(id);
  if (!post) notFound();
  const comments = await listCommunityComments(post.id);
  const reportTabActive = tab === "report";

  const report = post.verification;
  const verdict = verificationVerdictCopy[report.verdict];
  const imagesByEvidenceKey = new Map(report.images.map((image) => [image.evidenceKey, image.url]));
  const catalogProduct = expandedProducts.find((product) => product.id === report.productId);
  const productImageSources = [report.productImage, catalogProduct?.image ?? ""].filter(isOfficialProductImage);

  return (
    <main className="readonly-report community-detail-page">
      <header className="report-topbar">
        <Link href="/" className="report-brand" aria-label="FIGNAL BETA 홈"><BrandMark /></Link>
        <span><MessageCircle size={14} /> 검증 사례</span>
      </header>

      <div className="report-shell">
        <Link href="/community" className="report-back"><ArrowLeft size={16} /> 검증 사례 목록</Link>

        <article className="community-post-article">
          <header>
            <span className="community-author-avatar"><UserRound size={18} /></span>
            <span className="community-author-copy"><strong>익명 검증자</strong></span>
            <span className="community-post-state"><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></span>
          </header>
          <div className="community-post-body">
            <h1>{post.title}</h1>
            <p>{post.body || "이 검증 결과에서 놓친 부분이나 다른 판본 정보가 있다면 의견을 남겨주세요."}</p>
          </div>
          <section className={`community-inline-result ${verdict.tone}`} aria-label="게시글의 검증 결과 요약">
            <div className="community-inline-product-image"><ReportProductImage sources={productImageSources} alt={`${report.productName} 제품 이미지`} /></div>
            <div className="community-inline-product-copy"><span>검증 결과 · No.{report.productNumber}</span><strong>{report.productName}</strong><small>{report.productMaker}</small></div>
            <div className="community-inline-verdict"><strong>{verdict.label}</strong><small>{report.summary}</small></div>
            <dl><div><dt>사진</dt><dd>{report.photoCount}</dd></div><div><dt>위험 신호</dt><dd>{report.riskSignalCount}</dd></div></dl>
          </section>
          <footer>
            <a href="#community-comments"><MessageCircle size={15} /> 의견 {comments.length}</a>
            <span>검증 사례 #{post.id.slice(0, 8)}</span>
          </footer>
        </article>

        <nav className="community-post-tabs" aria-label="게시글 보기 전환">
          <Link href={`/community/${post.id}`} className={!reportTabActive ? "active" : ""} aria-current={!reportTabActive ? "page" : undefined}>게시글 <span>{comments.length}</span></Link>
          <Link href={`/community/${post.id}?tab=report`} className={reportTabActive ? "active" : ""} aria-current={reportTabActive ? "page" : undefined}>검증 리포트</Link>
        </nav>

        {reportTabActive ? (
          <section className="community-report-tab" aria-labelledby="community-report-tab-title">
            <header><span><strong id="community-report-tab-title">전체 검증 리포트</strong><small>사진별 판정 근거와 원본 자료를 확인하세요.</small></span><Link href={`/reports/${report.id}`}>읽기 전용 원본 <ExternalLink size={13} /></Link></header>
          <div className={`report-hero ${verdict.tone}`}>
            <div className="report-product-image"><ReportProductImage sources={productImageSources} alt={`${report.productName} 제품 이미지`} /></div>
            <div className="report-hero-copy">
              <h2>{report.productName}</h2>
              <p>{report.productMaker} · 검증 {formatDate(report.createdAt)}</p>
              <strong>{verdict.label}</strong>
              <em>{report.summary}</em>
            </div>
            <div className="report-metrics">
              <div><strong>{report.photoCount}</strong><span>분석 사진</span></div>
              <div><strong>{report.riskSignalCount}</strong><span>위험 신호</span></div>
            </div>
          </div>
            <section className="report-findings" aria-labelledby="community-findings-title">
              <header><div><FileCheck2 size={20} /><h2 id="community-findings-title">사진별 판정 근거</h2></div><span>공개 사진 {report.images.length}장</span></header>
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
              <div><ShieldCheck size={18} /><span><strong>최초 AI 분석 결과</strong><small>게시자가 판정과 근거를 수정할 수 없습니다.</small></span></div>
              <span className="community-source-links"><Link href={`/reports/${report.id}`}>원본 리포트 <FileCheck2 size={14} /></Link>{report.productOfficialUrl && <a href={report.productOfficialUrl} target="_blank" rel="noreferrer">공식 제품 <ExternalLink size={14} /></a>}</span>
            </section>
          </section>
        ) : (
          <CommunityComments postId={post.id} initialComments={comments} />
        )}
      </div>
    </main>
  );
}
