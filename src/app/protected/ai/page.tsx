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
import { isAiGatewayConfigured, getAiGatewayModel } from "@/lib/ai/gateway";
import { KeyRoundIcon } from "lucide-react";

export default function AiPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4">
            <div className="ms-auto flex w-full max-w-[80%] flex-col items-end gap-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-10 w-3/4 rounded-lg" />
            </div>
            <div className="flex w-full max-w-[80%] flex-col gap-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
            <div className="ms-auto flex w-full max-w-[80%] flex-col items-end gap-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-10 w-1/2 rounded-lg" />
            </div>
            <div className="flex w-full max-w-[80%] flex-col gap-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
            </div>
          </div>

          <div className="shrink-0 space-y-2 pb-1">
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-12 w-40 shrink-0 rounded-lg" />
              <Skeleton className="h-12 w-36 shrink-0 rounded-lg" />
            </div>
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
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
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto">
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

  return <AiChat defaultModelId={getAiGatewayModel()} />;
}
