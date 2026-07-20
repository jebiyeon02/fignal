import type { VerificationHistoryItem } from "./verification-history";

export type CommunityPostStatus = "collecting" | "supplemented" | "reviewed";

export type CommunityPost = {
  id: string;
  verificationId: string;
  title: string;
  body: string;
  status: CommunityPostStatus;
  helpfulCount: number;
  createdAt: string;
  verification: VerificationHistoryItem;
};

export type CommunityComment = {
  id: string;
  postId: string;
  nickname: string;
  body: string;
  createdAt: string;
};

export const communityPostStatusCopy: Record<CommunityPostStatus, string> = {
  collecting: "의견 수집 중",
  supplemented: "근거 보완됨",
  reviewed: "검토 완료",
};
