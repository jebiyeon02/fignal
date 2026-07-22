"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { Clipboard, X } from "lucide-react";
import type { EvidenceKey } from "./api/analyze/analysis-contract";
import type { EvidenceItem, Observation } from "./home-types";

export default function EvidenceCard({ item, observation, fileName, preview, onFile, onRemove, onPaste }: {
  item: EvidenceItem;
  observation: Observation;
  fileName?: string;
  preview?: string;
  onFile: (key: EvidenceKey, event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (key: EvidenceKey) => void;
  onPaste: (key: EvidenceKey) => void;
}) {
  const Icon = item.icon;
  return (
    <article className={`photo-card ${observation}`}>
      <label className="photo-upload">
        <input type="file" accept="image/*" onChange={(event) => onFile(item.key, event)} />
        {preview ? <img src={preview} alt={`${item.title} 업로드 사진`} /> : <div><Icon size={26} /><span>사진 추가</span></div>}
      </label>
      <div className="photo-card-copy"><div><strong>{item.title}</strong>{fileName && <button onClick={() => onRemove(item.key)} aria-label={`${item.title} 삭제`}><X size={14} /></button>}</div><p>{item.description}</p></div>
      <button
        type="button"
        className="paste-target-button"
        onClick={() => void onPaste(item.key)}
        aria-label={`${item.title}에 클립보드 이미지 붙여넣기`}
      >
        <Clipboard size={13} /> 붙여넣기
      </button>
    </article>
  );
}
