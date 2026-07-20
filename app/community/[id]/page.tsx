/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ExternalLink, FileCheck2, Image as ImageIcon, ImageOff, MessageCircle, Paperclip, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityPostById } from "../../../db/community-posts";
import { listCommunityComments } from "../../../db/community-comments";
import type { AnalysisFinding } from "../../api/analyze/analysis-contract";
import { expandedProducts, isOfficialProductImage } from "../../catalog";
import { communityPostStatusCopy } from "../../community";
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

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getCommunityPostById(id);
  if (!post) notFound();
  const comments = await listCommunityComments(post.id);

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

        <article className="community-post-article">
          <header>
            <span className="community-author-avatar"><UserRound size={18} /></span>
            <span className="community-author-copy"><strong>익명 검증자</strong><small>검증 완료 결과로 작성한 게시글</small></span>
            <span className="community-post-state"><em>{communityPostStatusCopy[post.status]}</em><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></span>
          </header>
          <div className="community-post-body">
            <span>VERIFICATION COMMUNITY POST</span>
            <h1>{post.title}</h1>
            <p>{post.body || "이 검증 결과에서 놓친 부분이나 다른 판본 정보가 있다면 의견을 남겨주세요."}</p>
          </div>
          <footer>
            <a href="#community-comments"><MessageCircle size={15} /> 의견 {comments.length}</a>
            <span><ImageIcon size={15} /> 공개 사진 {report.images.length}장</span>
            <span><ShieldCheck size={15} /> 검증 결과 연결됨</span>
          </footer>
        </article>

        <section className="community-report-attachment" aria-labelledby="attached-report-title">
          <header><span><Paperclip size={17} /><span><strong id="attached-report-title">첨부된 검증 결과</strong><small>게시자가 수정할 수 없는 최초 AI 분석입니다.</small></span></span><Link href={`/reports/${report.id}`}>원본 리포트 <ExternalLink size={13} /></Link></header>
          <div className={`report-hero ${verdict.tone}`}>
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

        <CommunityComments postId={post.id} initialComments={comments} />
      </div>
    </main>
  );
}
