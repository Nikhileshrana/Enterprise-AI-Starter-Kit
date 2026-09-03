"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DownloadIcon,
  Loader2Icon,
  Maximize2Icon,
  Minimize2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderHtmlToPdfBlob } from "@/lib/export-utils";
import { cn } from "@/lib/utils";
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
  const [tab, setTab] = React.useState<"preview" | "code">("preview");
  const [expanded, setExpanded] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !artifact) return;
    setTab("preview");
    setGenerating(true);
    setPdfBlob(null);

    let cancelled = false;

    renderHtmlToPdfBlob(artifact.content)
      .then((blob) => {
        if (!cancelled) setPdfBlob(blob);
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: "Failed to render PDF", description: String(err) });
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
    if (!artifact) return;
    setDownloading(true);
    try {
      const blob = await renderHtmlToPdfBlob(artifact.content);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugTitle || "document"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.add({ title: "PDF downloaded" });
    } catch (err) {
      toast.add({ title: "Failed to download PDF", description: String(err) });
    } finally {
      setDownloading(false);
    }
  }

  const panelWidth = expanded ? "58%" : "42%";

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
              <PanelHeader
                tab={tab}
                setTab={setTab}
                downloading={downloading}
                onDownload={handleDownloadPdf}
                onExpand={() => setExpanded((v) => !v)}
                expanded={expanded}
                onClose={() => onOpenChange(false)}
              />
              <PanelBody
                tab={tab}
                artifact={artifact}
                pdfBlob={pdfBlob}
                generating={generating}
              />
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
            <PanelHeader
              tab={tab}
              setTab={setTab}
              downloading={downloading}
              onDownload={handleDownloadPdf}
              onExpand={() => setExpanded((v) => !v)}
              expanded={expanded}
              onClose={() => onOpenChange(false)}
            />
            <PanelBody
              tab={tab}
              artifact={artifact}
              pdfBlob={pdfBlob}
              generating={generating}
            />
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function PanelHeader({
  tab,
  setTab,
  downloading,
  onDownload,
  onExpand,
  expanded,
  onClose,
}: {
  tab: "preview" | "code";
  setTab: (t: "preview" | "code") => void;
  downloading: boolean;
  onDownload: () => void;
  onExpand: () => void;
  expanded: boolean;
  onClose: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
      <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            tab === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setTab("code")}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            tab === "code"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Code
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onDownload}
          title="Download PDF"
          disabled={downloading}
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

function PanelBody({
  tab,
  artifact,
  pdfBlob,
  generating,
}: {
  tab: "preview" | "code";
  artifact: ArtifactData;
  pdfBlob: Blob | null;
  generating: boolean;
}) {
  if (tab === "code") {
    return (
      <div className="flex-1 min-h-0 overflow-auto bg-zinc-950 p-4">
        <pre className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap wrap-break-word font-mono">
          <code>{artifact.content}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 bg-[#27272a]">
      <PdfViewer blob={pdfBlob} generating={generating} />
    </div>
  );
}
