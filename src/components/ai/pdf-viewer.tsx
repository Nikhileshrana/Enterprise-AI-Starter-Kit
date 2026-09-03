"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PdfViewerProps {
  blob: Blob | null;
  generating: boolean;
  zoom?: number;
}

export function PdfViewer({ blob, generating, zoom = 1 }: PdfViewerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pdfRef = React.useRef<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [hasPages, setHasPages] = React.useState(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      setViewportWidth((prev) => (Math.abs(prev - next) < 4 ? prev : next));
    });
    observer.observe(el);
    setViewportWidth(Math.floor(el.clientWidth));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!blob) {
      pdfRef.current = null;
      setPageCount(0);
      setHasPages(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setHasPages(false);
    setError(null);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const data = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();

    return () => {
      cancelled = true;
      const doc = pdfRef.current;
      pdfRef.current = null;
      if (doc) void doc.cleanup();
    };
  }, [blob]);

  React.useEffect(() => {
    const container = containerRef.current;
    const pdf = pdfRef.current;
    if (!blob || !container || !pdf || viewportWidth < 32) return;

    let cancelled = false;

    (async () => {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const first = await pdf.getPage(1);
        if (cancelled) return;
        const unscaled = first.getViewport({ scale: 1 });
        const fit = (viewportWidth - 32) / unscaled.width;
        const scale = fit * zoom;
        const fragment = document.createDocumentFragment();

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = i === 1 ? first : await pdf.getPage(i);
          if (cancelled) return;
          const viewport = page.getViewport({ scale });
          const cssWidth = Math.floor(viewport.width);
          const cssHeight = Math.floor(viewport.height);

          const pageWrap = document.createElement("div");
          pageWrap.style.cssText =
            "position:relative;margin:0 auto 16px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.28);border-radius:2px;overflow:hidden;width:" +
            cssWidth +
            "px";

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(cssWidth * dpr);
          canvas.height = Math.floor(cssHeight * dpr);
          canvas.style.cssText =
            "display:block;width:" + cssWidth + "px;height:" + cssHeight + "px";
          pageWrap.appendChild(canvas);

          const badge = document.createElement("div");
          badge.textContent = `Page ${i} / ${pdf.numPages}`;
          badge.style.cssText =
            "position:absolute;bottom:14px;right:14px;background:rgba(39,39,42,0.92);color:#fff;font-size:11px;font-weight:500;padding:5px 11px;border-radius:999px;pointer-events:none;";
          pageWrap.appendChild(badge);

          fragment.appendChild(pageWrap);

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) continue;
          await page.render({
            canvas,
            canvasContext: ctx,
            viewport,
            transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
          }).promise;
        }

        if (cancelled) return;
        container.replaceChildren(fragment);
        setError(null);
        setHasPages(true);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob, pageCount, zoom, viewportWidth]);

  const showSpinner = generating || (!!blob && !hasPages && !error);

  return (
    <div
      ref={scrollRef}
      className="relative h-full min-h-0 overflow-auto bg-[#3f3f46] p-4"
    >
      {showSpinner ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#3f3f46] text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          <span className="text-xs font-medium">
            {generating ? "Generating PDF…" : "Loading pages…"}
            {pageCount > 0 ? ` (${pageCount})` : ""}
          </span>
        </div>
      ) : null}
      {error ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Failed to render PDF: {error}
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
