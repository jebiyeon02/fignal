"use client";

/* eslint-disable @next/next/no-img-element */

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE_LABEL } from "../../product-image-default";

export function ReportProductImage({ sources, alt }: { sources: string[]; alt: string }) {
  const uniqueSources = [...new Set([...sources.filter(Boolean), DEFAULT_PRODUCT_IMAGE])];
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = uniqueSources.find((candidate) => !failedSources.includes(candidate));

  if (!source) return <ShieldCheck size={32} />;
  const isDefaultImage = source === DEFAULT_PRODUCT_IMAGE;
  return <>
    <img
      src={source}
      className={isDefaultImage ? "default-product-image" : undefined}
      alt={isDefaultImage ? `${alt}가 없어 표시한 대체 이미지` : alt}
      onError={() => setFailedSources((current) => [...new Set([...current, source])])}
    />
    {isDefaultImage && <span className="default-product-image-label">{DEFAULT_PRODUCT_IMAGE_LABEL}</span>}
  </>;
}
