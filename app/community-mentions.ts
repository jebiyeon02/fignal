import generatedCommunityMentions from "./data/community-mentions.generated.json";
import domesticCommunityMentions from "./data/domestic-community-mentions.generated.json";

export type CommunityMentionStatus =
  | "community_catalog_asserted"
  | "author_asserted"
  | "community_reference"
  | "unverified_question";

export type CommunityMention = {
  mentionId: string;
  sourceCaseId: string;
  productId: string;
  productName: string;
  nendoroidNumber: string;
  status: CommunityMentionStatus;
  statusLabel: string;
  publicTitle: string;
  publicSummary: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  sourceName?: string;
  sourceLocale?: "domestic" | "international";
  signalTags: string[];
  imageReferenceCount: number;
  rightsStatus: string;
  exactMatchBasis: "curated_mapping" | "number" | "number_and_name" | "name";
  verdictImpact: "none";
  requiresHumanReview: true;
};

export const communityMentions = [
  ...domesticCommunityMentions.mentions,
  ...generatedCommunityMentions.mentions,
] as CommunityMention[];
