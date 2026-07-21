import { TriangleAlert } from "lucide-react";

export function DecisionDisclaimer() {
  return (
    <aside className="decision-disclaimer" aria-label="거래 주의사항">
      <TriangleAlert size={17} aria-hidden="true" />
      <span>
        <strong>구매 전 확인해 주세요</strong>
        이 결과는 사진 기반 참고 정보이며 정품을 보증하지 않습니다. 최종 구매 및 거래 결정과 그에 따른 책임은 사용자에게 있습니다.
      </span>
    </aside>
  );
}
