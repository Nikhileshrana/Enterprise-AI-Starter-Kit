"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  isReasoningUIPart,
  isTextUIPart,
} from "ai";
import { ArrowUpIcon, BrainIcon, SparklesIcon, SquareIcon } from "lucide-react";
import type { StarterKitUIMessage } from "@/lib/ai/agent";
import { WeatherCard } from "@/components/ai/weather-card";
import { StockCard } from "@/components/ai/stock-card";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Skeleton } from "@/components/ui/skeleton";

function sendAutomaticallyWhen({
  messages,
}: {
  messages: StarterKitUIMessage[];
}) {
  return (
    lastAssistantMessageIsCompleteWithToolCalls({ messages }) ||
    lastAssistantMessageIsCompleteWithApprovalResponses({ messages })
  );
}

export function AiChat() {
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop, error, addToolOutput, addToolApprovalResponse } =
    useChat<StarterKitUIMessage>({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
      sendAutomaticallyWhen,
      async onToolCall({ toolCall }) {
        if (toolCall.dynamic) return;
        if (toolCall.toolName === "getBrowserTimezone") {
          addToolOutput({
            tool: "getBrowserTimezone",
            toolCallId: toolCall.toolCallId,
            output: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        }
      },
    });

  const busy = status === "submitted" || status === "streaming";

  function focusComposer() {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
    focusComposer();
  }

  React.useEffect(() => {
    if (status === "ready" || status === "error") {
      focusComposer();
    }
  }, [status]);

  React.useEffect(() => {
    focusComposer();
  }, []);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="min-h-0 flex-1 overflow-hidden">
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-4">
                {messages.length === 0 ? (
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SparklesIcon />
                      </EmptyMedia>
                      <EmptyTitle>Start a conversation</EmptyTitle>
                      <EmptyDescription>
                        Try weather, a stock symbol, timezone, a confirmation, or drafting an org
                        announcement (approval required).
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}

                {messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <Message align={message.role === "user" ? "end" : "start"}>
                      <MessageContent>
                        {message.role === "user" ? (
                          <MessageHeader>You</MessageHeader>
                        ) : null}
                        <div className="flex w-full min-w-0 flex-col gap-2">
                          {message.parts.map((part, index) => (
                            <MessagePartView
                              key={`${message.id}-${index}`}
                              role={message.role}
                              part={part}
                              addToolOutput={addToolOutput}
                              addToolApprovalResponse={addToolApprovalResponse}
                            />
                          ))}
                        </div>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}

                {status === "submitted" ? (
                  <Marker>
                    <MarkerContent>
                      <span className="shimmer">Thinking…</span>
                    </MarkerContent>
                  </Marker>
                ) : null}

                {error ? (
                  <Marker>
                    <MarkerContent>
                      {error.message || "Something went wrong with the AI request."}
                    </MarkerContent>
                  </Marker>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <form onSubmit={onSubmit} className="shrink-0 pb-1">
        <InputGroup className="h-auto items-end">
          <InputGroupTextarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Message the agent…"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(event);
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            {busy ? (
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="secondary"
                aria-label="Stop"
                onClick={() => {
                  stop();
                  focusComposer();
                }}
              >
                <SquareIcon />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                size="icon-sm"
                variant="default"
                aria-label="Send"
                disabled={!input.trim()}
              >
                <ArrowUpIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}

type ChatHelpers = {
  addToolOutput: ReturnType<typeof useChat<StarterKitUIMessage>>["addToolOutput"];
  addToolApprovalResponse: ReturnType<
    typeof useChat<StarterKitUIMessage>
  >["addToolApprovalResponse"];
};

function MessagePartView({
  role,
  part,
  addToolOutput,
  addToolApprovalResponse,
}: ChatHelpers & {
  role: StarterKitUIMessage["role"];
  part: StarterKitUIMessage["parts"][number];
}) {
  if (isTextUIPart(part)) {
    if (!part.text) return null;
    const align = role === "user" ? "end" : "start";
    return (
      <Bubble
        variant={role === "user" ? "default" : "muted"}
        align={align}
      >
        <BubbleContent className="whitespace-pre-wrap">{part.text}</BubbleContent>
      </Bubble>
    );
  }

  if (isReasoningUIPart(part)) {
    if (!part.text) return null;
    return (
      <Collapsible className="w-full max-w-lg">
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-1.5 px-2" />
          }
        >
          <BrainIcon data-icon="inline-start" />
          Reasoning
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="mt-1 whitespace-pre-wrap px-2 text-xs text-muted-foreground">
            {part.text}
          </p>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (part.type === "tool-displayWeather") {
    return <WeatherToolPart part={part} />;
  }
  if (part.type === "tool-getStockPrice") {
    return <StockToolPart part={part} />;
  }
  if (part.type === "tool-draftOrgAnnouncement") {
    return (
      <ApprovalToolPart
        part={part}
        label="Draft organization announcement"
        summary={`${part.input?.title ?? "Announcement"}`}
        addToolApprovalResponse={addToolApprovalResponse}
      />
    );
  }
  if (part.type === "tool-askForConfirmation") {
    return (
      <ConfirmationToolPart part={part} addToolOutput={addToolOutput} />
    );
  }
  if (part.type === "tool-getBrowserTimezone") {
    return <TimezoneToolPart part={part} />;
  }
  if (part.type === "tool-askQuestionnaire") {
    return (
      <QuestionnaireToolPart part={part} addToolOutput={addToolOutput} />
    );
  }

  return null;
}

function WeatherToolPart({
  part,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "tool-displayWeather" }>;
}) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <ToolPending label={`Loading weather for ${part.input?.location ?? "…"}`} />;
    case "output-available":
      return <WeatherCard {...part.output} />;
    case "output-error":
      return <ToolError text={part.errorText} />;
    case "output-denied":
      return <ToolError text="Weather tool denied." />;
    default:
      return null;
  }
}

function StockToolPart({
  part,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "tool-getStockPrice" }>;
}) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <ToolPending label={`Loading ${part.input?.symbol ?? "stock"}…`} />;
    case "output-available":
      return <StockCard {...part.output} />;
    case "output-error":
      return <ToolError text={part.errorText} />;
    case "output-denied":
      return <ToolError text="Stock tool denied." />;
    default:
      return null;
  }
}

function TimezoneToolPart({
  part,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "tool-getBrowserTimezone" }>;
}) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <ToolPending label="Reading browser timezone…" />;
    case "output-available":
      return (
        <Bubble variant="outline" align="start">
          <BubbleContent>Timezone: {part.output}</BubbleContent>
        </Bubble>
      );
    case "output-error":
      return <ToolError text={part.errorText} />;
    default:
      return null;
  }
}

function ConfirmationToolPart({
  part,
  addToolOutput,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "tool-askForConfirmation" }>;
  addToolOutput: ChatHelpers["addToolOutput"];
}) {
  switch (part.state) {
    case "input-streaming":
      return <ToolPending label="Preparing confirmation…" />;
    case "input-available":
      return (
        <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border px-3 py-2">
          <p className="text-xs">{part.input.message}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                addToolOutput({
                  tool: "askForConfirmation",
                  toolCallId: part.toolCallId,
                  output: "Yes, confirmed.",
                })
              }
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolOutput({
                  tool: "askForConfirmation",
                  toolCallId: part.toolCallId,
                  output: "No, denied.",
                })
              }
            >
              Deny
            </Button>
          </div>
        </div>
      );
    case "output-available":
      return (
        <Bubble variant="outline" align="start">
          <BubbleContent>{part.output}</BubbleContent>
        </Bubble>
      );
    case "output-error":
      return <ToolError text={part.errorText} />;
    default:
      return null;
  }
}

function ApprovalToolPart({
  part,
  label,
  summary,
  addToolApprovalResponse,
}: {
  part: Extract<
    StarterKitUIMessage["parts"][number],
    { type: "tool-draftOrgAnnouncement" }
  >;
  label: string;
  summary: string;
  addToolApprovalResponse: ChatHelpers["addToolApprovalResponse"];
}) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <ToolPending label={`${label}…`} />;
    case "approval-requested":
      if (part.approval.isAutomatic) {
        return <ToolPending label={`Checking approval for ${summary}…`} />;
      }
      return (
        <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border border-destructive/30 px-3 py-2">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
          {part.input?.body ? (
            <p className="text-xs whitespace-pre-wrap">{part.input.body}</p>
          ) : null}
          {part.approval.requestReason ? (
            <p className="text-xs text-muted-foreground">{part.approval.requestReason}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: true,
                })
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: false,
                })
              }
            >
              Deny
            </Button>
          </div>
        </div>
      );
    case "approval-responded":
      return (
        <Bubble variant="outline" align="start">
          <BubbleContent>
            {summary} was {part.approval.approved ? "approved" : "denied"}
            {part.approval.isAutomatic ? " automatically" : ""}.
          </BubbleContent>
        </Bubble>
      );
    case "output-available":
      return (
        <Bubble variant="secondary" align="start">
          <BubbleContent>
            Queued: {part.output.title} ({part.output.queuedAt})
          </BubbleContent>
        </Bubble>
      );
    case "output-denied":
      return <ToolError text={`${label} was denied.`} />;
    case "output-error":
      return <ToolError text={part.errorText} />;
    default:
      return null;
  }
}

function QuestionnaireToolPart({
  part,
  addToolOutput,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "tool-askQuestionnaire" }>;
  addToolOutput: ChatHelpers["addToolOutput"];
}) {
  switch (part.state) {
    case "input-streaming":
      return <ToolPending label="Preparing questionnaire…" />;
    case "input-available": {
      const items = part.input.questions.map((question) => ({
        name: question.id,
        required: true,
        choices: question.options.map((option) => ({ value: option.value })),
      }));

      return (
        <Questionnaire
          className="max-w-md rounded-lg border px-3 py-3"
          items={items}
          shortcuts="letters"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const answers = part.input.questions.map((question) => ({
              id: question.id,
              prompt: question.prompt,
              value: String(data.get(question.id) ?? ""),
            }));
            addToolOutput({
              tool: "askQuestionnaire",
              toolCallId: part.toolCallId,
              output: { answers },
            });
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="font-heading text-sm font-semibold">{part.input.title}</p>
            {part.input.description ? (
              <p className="text-xs text-muted-foreground">{part.input.description}</p>
            ) : null}
            <QuestionnaireProgress />
          </div>
          {part.input.questions.map((question) => (
            <QuestionnaireItem key={question.id} name={question.id} required>
              <QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
              <QuestionnaireDescription>
                Choose one option to continue.
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                {question.options.map((option) => (
                  <QuestionnaireChoice key={option.value} value={option.value}>
                    {option.label}
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
            </QuestionnaireItem>
          ))}
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </Questionnaire>
      );
    }
    case "output-available":
      return (
        <Bubble variant="outline" align="start">
          <BubbleContent>
            Answers:{" "}
            {part.output.answers
              .map((answer) => `${answer.id}=${answer.value}`)
              .join(", ")}
          </BubbleContent>
        </Bubble>
      );
    case "output-error":
      return <ToolError text={part.errorText} />;
    default:
      return null;
  }
}

function ToolPending({ label }: { label: string }) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ToolError({ text }: { text: string }) {
  return (
    <Bubble variant="destructive" align="start">
      <BubbleContent>{text}</BubbleContent>
    </Bubble>
  );
}
