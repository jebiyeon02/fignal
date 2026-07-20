"use client";

import { FileCheck2, Image as ImageIcon, Info, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { FeedbackWidget } from "./feedback-widget";
import styles from "./floating-utility-rail.module.css";

export function FloatingUtilityRail({ context }: { context: "search" | "photos" | "result" }) {
  const [betaOpen, setBetaOpen] = useState(false);

  return (
    <div className={styles.rail} aria-label="서비스 안내 및 피드백">
      <section className={`${styles.betaWidget} ${betaOpen ? styles.pinned : ""}`}>
        <button
          className={styles.betaTrigger}
          type="button"
          aria-expanded={betaOpen}
          aria-controls="floating-beta-guide"
          onClick={() => setBetaOpen((current) => !current)}
        >
          <Info size={16} />
          <span><strong>BETA</strong> 안내</span>
        </button>

        <div className={styles.betaPanel} id="floating-beta-guide">
          <header>
            <span><em>BETA GUIDE</em><strong>함께 정확해지는 검증을 만들고 있어요</strong></span>
            <button type="button" onClick={() => setBetaOpen(false)} aria-label="BETA 안내 닫기"><X size={15} /></button>
          </header>
          <p>FIGNAL은 아직 초기 단계의 사진 기반 검증 보조 서비스입니다.</p>
          <ul>
            <li><TriangleAlert size={15} /><span>사진 품질과 촬영 환경에 따라 AI 분석이 부정확할 수 있어요.</span></li>
            <li><ImageIcon size={15} /><span>일부 제품은 확인 가능한 공식 대표 이미지가 없어요.</span></li>
            <li><FileCheck2 size={15} /><span>제품별 가품 비교 사례를 계속 보완하고 있어요.</span></li>
          </ul>
          <footer><strong>더 신뢰할 수 있는 서비스를 향해</strong><span>검증 자료와 커뮤니티 피드백을 바탕으로 기준을 꾸준히 보완합니다.</span><small>분석 결과는 정품 보증이나 제조사 판정을 대신하지 않습니다.</small></footer>
        </div>
      </section>

      <FeedbackWidget context={context} />
    </div>
  );
}
