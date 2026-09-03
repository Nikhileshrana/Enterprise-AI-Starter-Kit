"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";

interface PdfViewerProps {
  blob: Blob | null;
  generating: boolean;
}

export function PdfViewer({ blob, generating }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!blob) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setError(null);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  if (generating || (!blobUrl && !error)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        <span className="text-xs font-medium">
          {generating ? "Generating PDF…" : "Loading…"}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Failed to render PDF: {error}
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No PDF to display.
      </div>
    );
  }

  return (
    <iframe
      src={`${blobUrl}#view=FitH&toolbar=0`}
      title="PDF Preview"
      className="h-full w-full border-0 bg-[#525659]"
    />
  );
}
