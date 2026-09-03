import { gateway, tool } from "ai";
import { z } from "zod";

/** Server tool — generative UI for weather. */
export const displayWeather = tool({
  description: "Display the weather for a location as a rich UI card.",
  inputSchema: z.object({
    location: z.string().describe("City or place to get weather for"),
  }),
  execute: async ({ location }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const temperature = 62 + Math.floor(Math.random() * 25);
    const conditions = ["Sunny", "Partly cloudy", "Cloudy", "Light rain"] as const;
    const weather = conditions[Math.floor(Math.random() * conditions.length)]!;
    return { location, temperature, weather, unit: "F" as const };
  },
});

/** Server tool — generative UI for stocks. */
export const getStockPrice = tool({
  description: "Get the current price for a stock symbol and show it in the UI.",
  inputSchema: z.object({
    symbol: z.string().describe("Ticker symbol, e.g. AAPL"),
  }),
  execute: async ({ symbol }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const price = Number((50 + Math.random() * 400).toFixed(2));
    const change = Number((Math.random() * 10 - 5).toFixed(2));
    return { symbol: symbol.toUpperCase(), price, change };
  },
});

/**
 * Sensitive server tool — requires human approval before execute.
 * @see https://ai-sdk.dev/docs/agents/tool-approvals
 */
export const draftOrgAnnouncement = tool({
  description:
    "Draft an organization announcement that will be stored. Requires human approval before running.",
  inputSchema: z.object({
    title: z.string().describe("Short announcement title"),
    body: z.string().describe("Announcement body"),
  }),
  execute: async ({ title, body }) => {
    return {
      status: "queued" as const,
      title,
      body,
      queuedAt: new Date().toISOString(),
    };
  },
});

/**
 * Client-side tool (no execute) — user confirms in the UI via addToolOutput.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage
 */
export const askForConfirmation = tool({
  description: "Ask the user to confirm before continuing with a sensitive action.",
  inputSchema: z.object({
    message: z.string().describe("Confirmation question to show the user"),
  }),
  outputSchema: z.string(),
});

/**
 * Client-side tool — auto-executed in onToolCall with addToolOutput.
 */
export const getBrowserTimezone = tool({
  description: "Get the user's browser timezone. Prefer confirming with the user first.",
  inputSchema: z.object({}),
  outputSchema: z.string(),
});

/**
 * Client-side tool — generative questionnaire UI; user answers via addToolOutput.
 */
export const askQuestionnaire = tool({
  description:
    "Present a short questionnaire to the user and collect their answers in the UI.",
  inputSchema: z.object({
    title: z.string(),
    description: z.string().optional(),
    questions: z
      .array(
        z.object({
          id: z.string(),
          prompt: z.string(),
          options: z.array(z.object({ value: z.string(), label: z.string() })),
        }),
      )
      .min(1)
      .max(5),
  }),
  outputSchema: z.object({
    answers: z.array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        value: z.string(),
      }),
    ),
  }),
});

/**
 * Server tool — Artifact Generator for creating rich documents, reports, proposals, HTML layouts, and code.
 */
export const createDocument = tool({
  description:
    "Generate an interactive document, report, proposal, flyer, resume, newsletter, or HTML design artifact. Always use rich HTML formatting inside content for headers, tables, styled containers, and typography.\n\nDEFAULT STYLE (use unless the user specifies otherwise):\nUse these CSS classes for a clean editorial PDF look:\n- <div class=\"doc-meta\"><span>REPORT</span><span>THURSDAY, SEPTEMBER 3 2026</span></div> — top meta row with label (left) and date (right)\n- <h1 class=\"doc-title\">Title Here</h1> — large bold black title\n- <p class=\"doc-intro\">Grey introductory paragraph...</p> — grey intro text\n- <span class=\"section-title\">I. Section Name</span> — section header with underline (use roman numerals)\n- <div class=\"doc-grid\"><div class=\"doc-grid-left\"><div class=\"sub-heading\">1. Sub-heading</div><span class=\"badge\">BADGE TEXT</span></div><div class=\"doc-grid-right\">...body content...</div></div> — two-column layout with left labels + right body\n- Use <strong> for bold lead-ins, <ul><li> for bullets, <code> for inline code/technical terms\n- Keep generous spacing, clean sans-serif feel, professional editorial layout",
  inputSchema: z.object({
    title: z.string().describe("Descriptive document or artifact title"),
    kind: z
      .enum(["document", "html", "code", "report"])
      .default("document")
      .describe("Kind of artifact being generated"),
    content: z
      .string()
      .describe("Rich HTML formatted content for the document artifact"),
  }),
  execute: async ({ title, kind, content }) => {
    return {
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      kind,
      content,
      generatedAt: new Date().toISOString(),
    };
  },
});

/**
 * Provider-executed Perplexity Search via Vercel AI Gateway.
 * Works with any chat model — Gateway routes the search to Perplexity.
 * @see https://vercel.com/docs/ai-gateway/models-and-providers/web-search
 */
export const perplexity_search = gateway.tools.perplexitySearch({
  maxResults: 8,
  searchLanguageFilter: ["en"],
});

export const agentTools = {
  displayWeather,
  getStockPrice,
  draftOrgAnnouncement,
  askForConfirmation,
  getBrowserTimezone,
  askQuestionnaire,
  createDocument,
  perplexity_search,
};
