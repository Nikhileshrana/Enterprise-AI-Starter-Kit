import {
  ToolLoopAgent,
  isStepCount,
  type InferAgentUIMessage,
} from "ai";
import { getAiGatewayModel } from "@/lib/ai/gateway";
import { agentTools } from "@/lib/ai/tools";

/**
 * Tool-loop agent routed through Vercel AI Gateway (`provider/model` string).
 * @see https://ai-sdk.dev/docs/agents/building-agents
 * @see https://vercel.com/docs/ai-gateway
 */
export const starterKitAgent = new ToolLoopAgent({
  model: getAiGatewayModel(),
  instructions: `You are the Starter Kit assistant inside a multi-tenant app.
Use tools when they help: weather and stock cards for live-feeling UI, timezone from the browser,
confirmation / questionnaire for human-in-the-loop, and draftOrgAnnouncement only when the user
asks to announce something (it requires approval).
Keep replies concise. Prefer tools over inventing weather, stock, or timezone data.`,
  tools: agentTools,
  stopWhen: isStepCount(12),
  reasoning: "medium",
  toolApproval: {
    draftOrgAnnouncement: "user-approval",
  },
  experimental_toolApprovalSecret:
    process.env.TOOL_APPROVAL_SECRET ?? process.env.BETTER_AUTH_SECRET,
});

export type StarterKitUIMessage = InferAgentUIMessage<typeof starterKitAgent>;
