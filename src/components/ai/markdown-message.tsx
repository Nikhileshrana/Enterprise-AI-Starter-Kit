"use client";

import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { cn } from "@/lib/utils";

const remarkPlugins = [remarkGfm, remarkBreaks];

export function MarkdownMessage({
  children,
  className,
  isAnimating = false,
}: {
  children: string;
  className?: string;
  isAnimating?: boolean;
}) {
  return (
    <Streamdown
      animated
      isAnimating={isAnimating}
      remarkPlugins={remarkPlugins}
      className={cn(
        "max-w-none text-xs/relaxed [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-2 [&_table]:w-full [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:list-decimal [&_ol]:ps-4",
        className,
      )}
    >
      {children}
    </Streamdown>
  );
}
