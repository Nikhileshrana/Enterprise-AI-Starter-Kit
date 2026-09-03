/**
 * Models available in the AI chat picker (Vercel AI Gateway ids).
 * @see https://vercel.com/ai-gateway/models
 */

export const CHAT_MODELS = [
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    shortLabel: "Gemini",
  },
  {
    id: "anthropic/claude-sonnet-5",
    label: "Claude Sonnet 5",
    shortLabel: "Sonnet 5",
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    shortLabel: "GPT-5.4",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    shortLabel: "DeepSeek",
  },
  {
    id: "zai/glm-5.3",
    label: "GLM-5.3",
    shortLabel: "GLM",
  },
  {
    id: "moonshotai/kimi-k3",
    label: "Kimi K3",
    shortLabel: "Kimi",
  },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

const CHAT_MODEL_IDS = new Set<string>(CHAT_MODELS.map((model) => model.id));

export function isChatModelId(value: unknown): value is ChatModelId {
  return typeof value === "string" && CHAT_MODEL_IDS.has(value);
}

export function getChatModel(id: string) {
  return CHAT_MODELS.find((model) => model.id === id);
}

/** Resolve a request model to an allowlisted Gateway id, else the default. */
export function resolveChatModelId(
  requested: unknown,
  fallback: string = "openai/gpt-5.4",
): string {
  if (isChatModelId(requested)) return requested;
  if (typeof fallback === "string" && CHAT_MODEL_IDS.has(fallback)) {
    return fallback;
  }
  return "openai/gpt-5.4";
}
