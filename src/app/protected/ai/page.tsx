import { Suspense } from "react";
import { AiChat } from "@/components/ai/ai-chat";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { isAiGatewayConfigured } from "@/lib/ai/gateway";
import { KeyRoundIcon } from "lucide-react";

export default function AiPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="min-h-0 flex-1 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      }
    >
      <AiPageContent />
    </Suspense>
  );
}

async function AiPageContent() {
  if (!isAiGatewayConfigured()) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI</h1>
          <p className="text-sm text-muted-foreground">
            Requires Vercel AI Gateway authentication.
          </p>
        </div>
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRoundIcon />
            </EmptyMedia>
            <EmptyTitle>AI Gateway not configured</EmptyTitle>
            <EmptyDescription>
              Set <code className="font-mono">AI_GATEWAY_API_KEY</code> or run{" "}
              <code className="font-mono">vercel env pull</code> for{" "}
              <code className="font-mono">VERCEL_OIDC_TOKEN</code>. Demo chat
              without a key is disabled.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <AiChat />;
}
