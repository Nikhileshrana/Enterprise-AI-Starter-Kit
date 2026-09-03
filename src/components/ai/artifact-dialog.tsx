"use client";

import * as React from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  Maximize2Icon,
  Minimize2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToHtml, exportToPdf, exportToPng } from "@/lib/export-utils";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export interface ArtifactData {
  id: string;
  title: string;
  kind?: "document" | "html" | "code" | "report";
  content: string;
}

interface ArtifactDialogProps {
  artifact: ArtifactData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactDialog({
  artifact,
  open,
  onOpenChange,
}: ArtifactDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const paperRef = React.useRef<HTMLDivElement>(null);

  if (!open || !artifact) {
    return null;
  }

  const slugTitle = artifact.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(artifact?.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.add({ title: "Copied document content to clipboard" });
    } catch {
      toast.add({ title: "Failed to copy" });
    }
  }

  async function handleExportPdf() {
    if (!paperRef.current) return;
    setExporting(true);
    try {
      await exportToPdf(paperRef.current, `${slugTitle}.pdf`);
      toast.add({ title: "PDF exported successfully" });
    } catch (err) {
      toast.add({ title: "Failed to export PDF", description: String(err) });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPng() {
    if (!paperRef.current) return;
    setExporting(true);
    try {
      await exportToPng(paperRef.current, `${slugTitle}.png`);
      toast.add({ title: "Image exported successfully" });
    } catch (err) {
      toast.add({ title: "Failed to export Image", description: String(err) });
    } finally {
      setExporting(false);
    }
  }

  function handleExportHtml() {
    exportToHtml(artifact?.content || "", `${slugTitle}.html`);
    toast.add({ title: "HTML exported successfully" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        className={cn(
          "flex flex-col w-full bg-zinc-950 text-zinc-100 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
          isFullscreen ? "h-full max-w-none rounded-none border-0" : "h-[90vh] max-w-5xl",
        )}
      >
        {/* Sleek Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950 px-6 py-2">
          {/* Left Title & Format Tag */}
          <div className="flex items-center gap-2 min-w-0 flex-1 me-4">
            <h2 className="truncate text-sm font-medium tracking-tight text-zinc-100">
              {artifact.title || "Untitled Document"}
            </h2>
            <span className="text-xs text-zinc-500 font-normal select-none">·</span>
            <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase select-none shrink-0">
              {artifact.kind === "html" ? "HTML" : "PDF"}
            </span>
          </div>

          {/* Right Action Icons: Copy | Download | Fullscreen | Close */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Copy Button */}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handleCopyCode}
              title="Copy Content"
              className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-800/70"
            >
              {copied ? (
                <CheckIcon className="size-4 text-emerald-400" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </Button>

            {/* Download / Export Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    title="Export / Download"
                    disabled={exporting}
                    className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-800/70"
                  >
                    <DownloadIcon className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-48 bg-zinc-900 border-zinc-800 text-zinc-200">
                <DropdownMenuItem onClick={handleExportPdf} className="gap-2 focus:bg-zinc-800 focus:text-white">
                  <FileTextIcon className="size-4" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPng} className="gap-2 focus:bg-zinc-800 focus:text-white">
                  <ImageIcon className="size-4" />
                  <span>Export as PNG Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportHtml} className="gap-2 focus:bg-zinc-800 focus:text-white">
                  <GlobeIcon className="size-4" />
                  <span>Download HTML</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enlarge / Restore Fullscreen */}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Restore size" : "Enlarge"}
              className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-800/70"
            >
              {isFullscreen ? (
                <Minimize2Icon className="size-4" />
              ) : (
                <Maximize2Icon className="size-4" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              title="Close"
              className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-800/70"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </header>

        {/* Paper Document Canvas */}
        <div className="relative flex-1 min-h-0 overflow-y-auto bg-[#0c0c0e] p-4 sm:p-8 flex flex-col items-center">
          <div
            ref={paperRef}
            className="w-full max-w-3xl bg-white text-zinc-900 rounded-sm p-8 sm:p-12 md:p-16 shadow-2xl relative my-auto min-h-[850px]"
          >
            <div
              className="prose prose-zinc max-w-none text-zinc-900 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: artifact.content }}
            />
          </div>

          {/* Floating Page Counter Pill */}
          <div className="sticky bottom-4 ms-auto me-4 z-10 rounded-md bg-zinc-800/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-zinc-200 shadow-xl border border-zinc-700/60 select-none">
            Page 1 / 1
          </div>
        </div>
      </div>
    </div>
  );
}
