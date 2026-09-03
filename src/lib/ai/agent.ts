import { ToolLoopAgent, isStepCount } from "ai";
import { getAiGatewayModel } from "@/lib/ai/gateway";
import { agentTools } from "@/lib/ai/tools";
import type { StarterKitAgentCallOptions } from "@/lib/types";

/**
 * Tool-loop agent routed through Vercel AI Gateway (`provider/model` string).
 * Call options can override the model per request (chat model picker).
 * @see https://ai-sdk.dev/docs/agents/building-agents
 * @see https://vercel.com/docs/ai-gateway
 */
export const starterKitAgent = new ToolLoopAgent<
  StarterKitAgentCallOptions,
  typeof agentTools
>({
  model: getAiGatewayModel(),
  instructions: `You are the Starter Kit assistant inside a multi-tenant app.
Use tools when they help: weather and stock cards for live-feeling UI, timezone from the browser,
confirmation / questionnaire for human-in-the-loop, draftOrgAnnouncement only when the user
asks to announce something, perplexity_search for current web facts / news / research (do not invent
live information), and createDocument whenever the user asks to write, generate, or design
a document, report, proposal, flyer, resume, newsletter, HTML component, or online page.
Users may attach images, PDFs, or CSV files — read and use their contents when relevant.
Keep replies concise. Prefer tools over inventing weather, stock, timezone, or current-events data.
Call perplexity_search at most once per reply. Never search twice for the same or similar query.`,
  tools: agentTools,
  stopWhen: isStepCount(12),
  reasoning: "medium",
  toolApproval: {
    draftOrgAnnouncement: "user-approval",
  },
  experimental_toolApprovalSecret:
    process.env.TOOL_APPROVAL_SECRET ?? process.env.BETTER_AUTH_SECRET,
  prepareCall: ({ options, ...rest }) => ({
    ...rest,
    model: options?.modelId ?? rest.model ?? getAiGatewayModel(),
  }),
});
