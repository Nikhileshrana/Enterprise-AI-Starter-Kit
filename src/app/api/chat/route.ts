import { createAgentUIStreamResponse } from "ai";
import { headers } from "next/headers";
import { starterKitAgent } from "@/lib/ai/agent";
import { isAiGatewayConfigured, getAiGatewayModel } from "@/lib/ai/gateway";
import { resolveChatModelId } from "@/lib/ai/models";
import { auth } from "@/lib/auth/server";
import type { ChatRequestBody } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAiGatewayConfigured()) {
    return Response.json(
      {
        error:
          "AI Gateway is not configured. Set AI_GATEWAY_API_KEY or run `vercel env pull` for VERCEL_OIDC_TOKEN.",
      },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ChatRequestBody;

  const modelId = resolveChatModelId(body.model, getAiGatewayModel());

  return createAgentUIStreamResponse({
    agent: starterKitAgent,
    uiMessages: (body.messages ?? []) as never[],
    options: { modelId },
    sendReasoning: true,
  });
}
