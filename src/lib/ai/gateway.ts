import { CHAT_MODELS, resolveChatModelId } from "@/lib/types";

/**
 * AI Gateway auth: AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN (via `vercel env pull`).
 * @see https://vercel.com/docs/ai-gateway
 */
export function isAiGatewayConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim(),
  );
}

export function getAiGatewayModel(): string {
  return resolveChatModelId(
    process.env.AI_GATEWAY_MODEL?.trim(),
    CHAT_MODELS[2].id,
  );
}
