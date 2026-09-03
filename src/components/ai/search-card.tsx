import type { PerplexitySearchCardProps } from "@/lib/types";

export function SearchCard({ query, results }: PerplexitySearchCardProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
        Perplexity Search
      </p>
      <p className="font-heading text-sm font-semibold">{query}</p>
      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground">No results.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.slice(0, 5).map((result) => (
            <li key={result.url} className="min-w-0">
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {result.title}
              </a>
              <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {result.snippet}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
