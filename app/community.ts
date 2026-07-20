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
  canManage: boolean;
  createdAt: string;
};

export function isCommunityPostStatus(value: unknown): value is CommunityPostStatus {
  return value === "collecting" || value === "supplemented" || value === "reviewed";
}
