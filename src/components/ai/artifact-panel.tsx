"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DownloadIcon,
  Loader2Icon,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderHtmlToPdfBlob } from "@/lib/export-utils";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { PdfViewer } from "@/components/ai/pdf-viewer";

export interface ArtifactData {
  id: string;
  title: string;
  kind?: "document" | "html" | "code" | "report";
  content: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactPanel({
  artifact,
  open,
  onOpenChange,
}: ArtifactPanelProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    if (!open || !artifact) {
      setPdfBlob(null);
      setZoom(1);
      return;
    }

    let cancelled = false;
    setGenerating(true);
    setPdfBlob(null);

    renderHtmlToPdfBlob(artifact.content)
      .then((blob) => {
        if (!cancelled) setPdfBlob(blob);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.add({ title: "Failed to render PDF", description: String(err) });
        }
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, artifact]);

  const slugTitle = artifact
    ? artifact.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    : "";

  async function handleDownloadPdf() {
    const blob = pdfBlob;
    if (!blob) {
      toast.add({ title: "PDF is still generating" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugTitle || "document"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.add({ title: "PDF downloaded" });
  }

  const panelWidth = expanded ? "58%" : "42%";
  const header = (
    <PanelHeader
      title={artifact?.title}
      downloading={downloading}
      generating={generating}
      zoom={zoom}
      onZoomOut={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
      onZoomIn={() => setZoom((z) => Math.min(2, Math.round((z + 0.25) * 100) / 100))}
      onDownload={() => void handleDownloadPdf()}
      onExpand={() => setExpanded((v) => !v)}
      expanded={expanded}
      onClose={() => onOpenChange(false)}
    />
  );
  const body = (
    <div className="relative min-h-0 flex-1">
      <PdfViewer blob={pdfBlob} generating={generating} zoom={zoom} />
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && artifact ? (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-card p-3"
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {header}
              {body}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && artifact ? (
        <motion.aside
          key="artifact-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: panelWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="flex min-h-0 shrink-0 flex-col overflow-hidden"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {header}
            {body}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function PanelHeader({
  title,
  downloading,
  generating,
  zoom,
  onZoomOut,
  onZoomIn,
  onDownload,
  onExpand,
  expanded,
  onClose,
}: {
  title?: string;
  downloading: boolean;
  generating: boolean;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onDownload: () => void;
  onExpand: () => void;
  expanded: boolean;
  onClose: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
      <p className="min-w-0 truncate text-xs font-medium">
        {title || "Document"}
        <span className="ms-2 font-normal text-muted-foreground">· PDF</span>
      </p>
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onZoomOut}
          title="Zoom out"
          disabled={generating || zoom <= 0.5}
          className="size-8"
        >
          <MinusIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onZoomIn}
          title="Zoom in"
          disabled={generating || zoom >= 2}
          className="size-8"
        >
          <PlusIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onDownload}
          title="Download PDF"
          disabled={downloading || generating}
          className="size-8"
        >
          {downloading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <DownloadIcon className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onExpand}
          title={expanded ? "Restore size" : "Expand"}
          className="hidden size-8 lg:inline-flex"
        >
          {expanded ? (
            <Minimize2Icon className="size-4" />
          ) : (
            <Maximize2Icon className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          title="Close"
          className="size-8"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
