"use client";

/* eslint-disable @next/next/no-img-element */

import { X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ReportFindingImage({ src, title }: { src: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="report-finding-image-button"
        aria-label={`${title} 검증 사진 크게 보기`}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <img src={src} alt={`${title} 검증에 사용된 사진`} />
        <span aria-hidden="true"><ZoomIn size={17} /></span>
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="case-lightbox-backdrop" onMouseDown={close}>
          <section
            className="case-lightbox report-image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>검증에 사용된 원본 사진</span>
                <h2 id={titleId}>{title}</h2>
              </div>
              <button type="button" autoFocus onClick={close} aria-label="원본 사진 닫기"><X size={20} /></button>
            </header>
            <div className="case-lightbox-stage">
              <img src={src} alt={`${title} 검증에 사용된 원본 사진`} />
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
