"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  isFileUIPart,
  isReasoningUIPart,
  isTextUIPart,
  type FileUIPart,
} from "ai";
import {
  ArrowUpIcon,
  BrainIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PaperclipIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type { StarterKitUIMessage } from "@/lib/ai/agent";
import { WeatherCard } from "@/components/ai/weather-card";
import { StockCard } from "@/components/ai/stock-card";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
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
import { toast } from "@/components/ui/toast";

const ACCEPTED_FILES =
  "image/*,application/pdf,text/csv,.csv,image/png,image/jpeg,image/webp,image/gif";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function isAllowedFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.startsWith("image/") ||
    type === "application/pdf" ||
    type === "text/csv" ||
    name.endsWith(".csv") ||
    name.endsWith(".pdf")
  );
}

function mediaTypeForFile(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function toFileUIParts(files: File[]): Promise<FileUIPart[]> {
  return Promise.all(
    files.map(async (file) => ({
      type: "file" as const,
      filename: file.name,
      mediaType: mediaTypeForFile(file),
      url: await readFileAsDataUrl(file),
    })),
  );
}

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
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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

  function addFiles(list: FileList | File[]) {
    const next = Array.from(list);
    const accepted: File[] = [];
    for (const file of next) {
      if (!isAllowedFile(file)) {
        toast.add({
          title: "Unsupported file",
          description: `${file.name} — use images, PDF, or CSV.`,
        });
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.add({
          title: "File too large",
          description: `${file.name} exceeds 10 MB.`,
        });
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setPendingFiles((prev) => [...prev, ...accepted]);
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || busy) return;

    const files =
      pendingFiles.length > 0 ? await toFileUIParts(pendingFiles) : undefined;

    sendMessage({
      text: text || (files?.length ? "Please review the attached file(s)." : ""),
      files,
    });
    setInput("");
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                        Attach images, PDFs, or CSVs, or try weather, stocks, timezone,
                        confirmation, or an org announcement.
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

                {status === "submitted" ? <AssistantPendingSkeleton /> : null}

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

      <form onSubmit={(event) => void onSubmit(event)} className="shrink-0 space-y-2 pb-1">
        {pendingFiles.length > 0 ? (
          <AttachmentGroup>
            {pendingFiles.map((file, index) => (
              <PendingFileAttachment
                key={`${file.name}-${file.size}-${index}`}
                file={file}
                onRemove={() => removePendingFile(index)}
              />
            ))}
          </AttachmentGroup>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={ACCEPTED_FILES}
          multiple
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
            }
          }}
        />

        <InputGroup className="h-auto items-end">
          <InputGroupAddon align="block-start" className="pt-2">
            <InputGroupButton
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Attach files"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon />
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupTextarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Message the agent… (images, PDF, CSV)"
            rows={2}
            onPaste={(event) => {
              const items = event.clipboardData?.files;
              if (items?.length) {
                event.preventDefault();
                addFiles(items);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSubmit(event);
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
                disabled={!input.trim() && pendingFiles.length === 0}
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

function AssistantPendingSkeleton() {
  return (
    <div className="flex w-full max-w-[80%] flex-col gap-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function FilePartAttachment({
  part,
}: {
  part: Extract<StarterKitUIMessage["parts"][number], { type: "file" }>;
}) {
  const mediaType = part.mediaType ?? "application/octet-stream";
  const isImage = mediaType.startsWith("image/");
  const isPdf =
    mediaType === "application/pdf" ||
    (part.filename?.toLowerCase().endsWith(".pdf") ?? false);
  const isCsv =
    mediaType === "text/csv" ||
    (part.filename?.toLowerCase().endsWith(".csv") ?? false);

  return (
    <Attachment state="done" size="sm">
      <AttachmentMedia variant={isImage ? "image" : "icon"}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={part.url} alt={part.filename ?? "attachment"} />
        ) : isPdf ? (
          <FileTextIcon />
        ) : isCsv ? (
          <FileSpreadsheetIcon />
        ) : (
          <FileTextIcon />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{part.filename ?? "Attachment"}</AttachmentTitle>
        <AttachmentDescription>{mediaType}</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}

function PendingFileAttachment({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const mediaType = mediaTypeForFile(file);
  const isImage = mediaType.startsWith("image/");
  const previewUrl = React.useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage],
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Attachment state="done" size="sm">
      <AttachmentMedia variant={isImage ? "image" : "icon"}>
        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.name} />
        ) : mediaType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? (
          <FileTextIcon />
        ) : (
          <FileSpreadsheetIcon />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
        <AttachmentDescription>
          {mediaType} · {formatBytes(file.size)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
        >
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
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

  if (isFileUIPart(part)) {
    return <FilePartAttachment part={part} />;
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
