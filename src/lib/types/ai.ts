import type { InferAgentUIMessage } from "ai";
import type { useChat } from "@ai-sdk/react";

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
  onOpenArtifact?: (artifact: {
    id: string;
    title: string;
    kind?: "document" | "html" | "code" | "report";
    content: string;
  }) => void;
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

export type PerplexitySearchResultItem = {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  lastUpdated?: string;
};

export type PerplexitySearchCardProps = {
  query: string;
  results: PerplexitySearchResultItem[];
};

export type ChatRequestBody = {
  messages?: unknown;
  model?: unknown;
};
