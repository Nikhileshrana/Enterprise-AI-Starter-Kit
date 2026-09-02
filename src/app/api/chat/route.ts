import { createAgentUIStreamResponse } from "ai";
import { headers } from "next/headers";
import { starterKitAgent } from "@/lib/ai/agent";
import { isAiGatewayConfigured } from "@/lib/ai/gateway";
import { auth } from "@/lib/auth/server";

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

  const { messages } = (await request.json()) as { messages: unknown };

  return createAgentUIStreamResponse({
    agent: starterKitAgent,
    uiMessages: messages as never[],
    sendReasoning: true,
  });
}
