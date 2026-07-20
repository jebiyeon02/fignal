"use client";

/* eslint-disable @next/next/no-img-element */

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export function ReportProductImage({ sources, alt }: { sources: string[]; alt: string }) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = uniqueSources.find((candidate) => !failedSources.includes(candidate));

  if (!source) return <ShieldCheck size={32} />;
  return (
    <img
      src={source}
      alt={alt}
      onError={() => setFailedSources((current) => [...new Set([...current, source])])}
    />
  );
}
