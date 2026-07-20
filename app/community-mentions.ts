import generatedCommunityMentions from "./data/community-mentions.generated.json";
import domesticCommunityMentions from "./data/domestic-community-mentions.generated.json";
import overseasCommunityMentions from "./data/overseas-community-mentions.generated.json";

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

function inferSourceMeta(sourceUrl: string): Pick<CommunityMention, "sourceName" | "sourceLocale"> {
  const hostname = new URL(sourceUrl).hostname;
  if (hostname.endsWith("dcinside.com")) return { sourceName: "디시인사이드", sourceLocale: "domestic" };
  if (hostname.endsWith("reddit.com")) return { sourceName: "Reddit", sourceLocale: "international" };
  if (hostname.endsWith("atwiki.jp")) return { sourceName: "일본 ATWiki", sourceLocale: "international" };
  if (hostname.endsWith("myfigurecollection.net")) return { sourceName: "MyFigureCollection", sourceLocale: "international" };
  return { sourceName: "해외 커뮤니티", sourceLocale: "international" };
}

const mergedCommunityMentions = [
  ...domesticCommunityMentions.mentions,
  ...overseasCommunityMentions.mentions,
  ...generatedCommunityMentions.mentions,
] as CommunityMention[];

function communityMentionKey(mention: CommunityMention) {
  const sourceUrl = new URL(mention.sourceUrl);
  sourceUrl.hash = "";
  if (sourceUrl.hostname.endsWith("dcinside.com")) {
    sourceUrl.searchParams.delete("page");
    sourceUrl.searchParams.delete("search_pos");
  }
  return `${mention.productId}|${sourceUrl.href.replace(/\/$/, "")}`;
}

const communityMentionsByKey = new Map<string, CommunityMention>();
for (const mention of mergedCommunityMentions) {
  const sourceMeta = inferSourceMeta(mention.sourceUrl);
  const enrichedMention = {
    ...mention,
    sourceName: mention.sourceName ?? sourceMeta.sourceName,
    sourceLocale: mention.sourceLocale ?? sourceMeta.sourceLocale,
  };
  const key = communityMentionKey(mention);
  if (!communityMentionsByKey.has(key)) communityMentionsByKey.set(key, enrichedMention);
}

export const communityMentions = [...communityMentionsByKey.values()];
