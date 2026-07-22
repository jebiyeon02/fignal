import type { LucideIcon } from "lucide-react";
import type { EvidenceKey } from "./api/analyze/analysis-contract";

export type Stage = "search" | "photos" | "result";
export type Observation = "missing" | "unverified" | "match" | "concern";

export type Product = {
  id: string;
  name: string;
  englishName: string;
  aliases: string[];
  number: string;
  maker: string;
  release: string;
  image: string;
  imageSource?: "official" | "none";
  imageSourceUrl?: string;
  officialUrl: string;
  verified: boolean;
  series?: string;
  seriesName?: string;
  englishSeriesName?: string;
};

export type EvidenceItem = {
  key: EvidenceKey;
  title: string;
  description: string;
  matchReason: string;
  concernReason: string;
  weight: number;
  essential: boolean;
  icon: LucideIcon;
};
