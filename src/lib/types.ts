/** Shared app types — single source of truth. */

import type { InferAgentUIMessage } from "ai";
import type { useChat } from "@ai-sdk/react";
import type { LucideIcon } from "lucide-react";

// — Auth —

export type Session = typeof import("@/lib/auth/server").auth.$Infer.Session;

export type CurrentUser = {
  id: string;
  name: string;
  image?: string | null;
};

export type NavUserData = {
  name: string;
  email: string;
  image?: string | null;
};

// — Navigation —

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

// — Organization —

export type OrganizationRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
};

export type MemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type MemberTableMeta = {
  currentUserId?: string;
  canManage: boolean;
  busyId: string | null;
  onMakeOwner: (member: MemberRow) => void;
  onRemove: (member: MemberRow) => void;
};

export type OrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  required?: boolean;
  onCreated?: (organization: Organization) => void | Promise<void>;
};

export type OrganizationGateProps = {
  userId: string;
};

export type OrganizationSwitcherProps = {
  variant?: "sidebar" | "logo";
};

export type NavUserProps = {
  user: NavUserData;
  variant?: "sidebar" | "header";
};

export const ORGANIZATION_ROLES = [
  "member",
  "admin",
  "owner",
] as const satisfies readonly OrganizationRole[];

// — API —

export type ApiErrorBody = {
  error?: string;
};

export type AddMemberRequest = {
  email?: string;
  role?: string;
};

export type AddMemberResult =
  | { status: "added"; member: unknown }
  | { status: "invited"; invitation: unknown };

export type AddMemberResponse = AddMemberResult | ApiErrorBody;

export function isAddMemberResult(
  body: AddMemberResponse,
): body is AddMemberResult {
  return "status" in body;
}

export type ChatRequestBody = {
  messages?: unknown;
  model?: unknown;
};

// — AI —

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

export type StarterKitAgentCallOptions = {
  modelId?: string;
};

export type StarterKitUIMessage = InferAgentUIMessage<
  typeof import("@/lib/ai/agent").starterKitAgent
>;

export type ChatHelpers = {
  addToolOutput: ReturnType<typeof useChat<StarterKitUIMessage>>["addToolOutput"];
  addToolApprovalResponse: ReturnType<
    typeof useChat<StarterKitUIMessage>
  >["addToolApprovalResponse"];
};

export type MessagePartViewProps = ChatHelpers & {
  role: StarterKitUIMessage["role"];
  part: StarterKitUIMessage["parts"][number];
};

export type StockCardProps = {
  symbol: string;
  price: number;
  change: number;
};

export type WeatherCardProps = {
  location: string;
  temperature: number;
  weather: string;
  unit?: string;
};

// — Helpers —

export function roleHas(
  role: string | null | undefined,
  target: OrganizationRole,
) {
  if (!role) return false;
  return role
    .split(",")
    .some((part) => part.trim().toLowerCase() === target);
}

export function isOrganizationManager(role: string | null | undefined) {
  return roleHas(role, "owner") || roleHas(role, "admin");
}

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
