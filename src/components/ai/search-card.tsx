"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  PerplexitySearchCardProps,
  PerplexitySearchResultItem,
} from "@/lib/types";

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconFromUrl(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=64`;
  } catch {
    return undefined;
  }
}

export function SearchCard({ results }: PerplexitySearchCardProps) {
  const items = results.slice(0, 5);
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No results.</p>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {items.map((result) => (
        <SearchResultRow key={result.url} result={result} />
      ))}
    </div>
  );
}

function SearchResultRow({ result }: { result: PerplexitySearchResultItem }) {
  const host = hostnameFromUrl(result.url);
  const favicon = faviconFromUrl(result.url);

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9 rounded-lg after:rounded-lg">
          {favicon ? (
            <AvatarImage
              src={favicon}
              alt=""
              className="rounded-lg object-contain p-1.5"
            />
          ) : null}
          <AvatarFallback className="rounded-lg text-xs">
            {host.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-card-foreground">
            {result.title}
          </p>
          <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {host}
          </p>
        </div>
      </div>
      <Button
        nativeButton={false}
        render={<a href={result.url} target="_blank" rel="noreferrer" />}
        size="sm"
        variant="secondary"
        className="shrink-0 text-xs"
      >
        <ArrowUpRightIcon data-icon="inline-start" />
        Open
      </Button>
    </div>
  );
}
