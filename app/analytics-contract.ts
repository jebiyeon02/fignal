export const siteEventNames = [
  "search_performed",
  "product_selected",
  "seller_message_copied",
  "photo_upload_started",
  "evidence_ready",
  "analysis_blocked",
  "analysis_started",
  "analysis_completed",
  "analysis_failed",
  "result_viewed",
  "case_source_clicked",
  "report_opened",
  "recheck_started",
] as const;

export type SiteEventName = (typeof siteEventNames)[number];

export const siteEventLabels: Record<SiteEventName, string> = {
  search_performed: "제품 검색",
  product_selected: "제품 선택",
  seller_message_copied: "판매자 사진 요청",
  photo_upload_started: "사진 등록 시작",
  evidence_ready: "필수 사진 준비",
  analysis_blocked: "분석 진행 막힘",
  analysis_started: "AI 분석 시작",
  analysis_completed: "AI 분석 완료",
  analysis_failed: "AI 분석 실패",
  result_viewed: "결과 확인",
  case_source_clicked: "사례 원문 확인",
  report_opened: "리포트 열람",
  recheck_started: "새 검증 시작",
};

export const siteEventNameSet = new Set<string>(siteEventNames);
