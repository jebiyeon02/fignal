/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ArrowRight, Image as ImageIcon, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../brand-mark";
import { listCommunityPosts } from "../../db/community-posts";
import { expandedProducts, isOfficialProductImage } from "../catalog";
import { communityPostStatusCopy } from "../community";
import { verificationVerdictCopy } from "../verification-history";

export const dynamic = "force-dynamic";

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export default async function CommunityPage() {
  const posts = await listCommunityPosts();

  return (
    <main className="community-page">
      <header className="report-topbar">
        <Link href="/" className="report-brand" aria-label="FIGNAL BETA 홈"><BrandMark /></Link>
        <span><ShieldCheck size={14} /> 검증 결과 기반 커뮤니티</span>
      </header>

      <div className="community-shell">
        <Link href="/" className="report-back"><ArrowLeft size={16} /> 피규어 검증</Link>
        <section className="community-intro">
          <h1>검증 사례</h1>
          <p>실제 사진 검증을 완료한 결과만 게시됩니다. 의견은 참고 자료이며 제조사 판정이나 정품 보증이 아닙니다.</p>
          <div><strong>{posts.length}</strong><span>공개 사례</span></div>
        </section>

        {posts.length === 0 ? (
          <section className="community-empty">
            <MessageCircle size={25} />
            <strong>아직 게시된 검증 사례가 없어요</strong>
            <p>피규어 사진 검증을 완료하면 결과 화면에서 첫 사례를 게시할 수 있습니다.</p>
            <Link href="/">피규어 검증 시작하기 <ArrowRight size={15} /></Link>
          </section>
        ) : (
          <section className="community-post-grid" aria-label="검증 사례 목록">
            {posts.map((post) => {
              const verdict = verificationVerdictCopy[post.verification.verdict];
              const catalogImage = expandedProducts.find((product) => product.id === post.verification.productId)?.image ?? "";
              const image = [post.verification.productImage, catalogImage].find(isOfficialProductImage) ?? "";
              return (
                <Link href={`/community/${post.id}`} className={`community-post-card ${verdict.tone}`} key={post.id}>
                  <span className="community-post-thumb">{image ? <img src={image} alt={`${post.verification.productName} 공식 제품 이미지`} /> : <ImageIcon size={25} />}</span>
                  <span className="community-post-content">
                    <span className="community-post-meta"><em>{communityPostStatusCopy[post.status]}</em><time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time></span>
                    <strong>{post.title}</strong>
                    <small>No.{post.verification.productNumber} · {post.verification.productName}</small>
                    <span className="community-post-verdict">{verdict.label}</span>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
