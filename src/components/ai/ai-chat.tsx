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
  ImageIcon,
  MessageSquareIcon,
  MessageSquarePlusIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type {
  ChatHelpers,
  MessagePartViewProps,
  StarterKitUIMessage,
} from "@/lib/types";
import {
  CHAT_MODELS,
  resolveChatModelId,
  type ChatModelId,
} from "@/lib/ai/models";
import { WeatherCard } from "@/components/ai/weather-card";
import { StockCard } from "@/components/ai/stock-card";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { ChatConversationMeta } from "@/lib/db/chat";
import { cn } from "@/lib/utils";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ACCEPTED_FILES =
  "image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,text/csv,.csv,.pdf";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function isCsvFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "text/csv" || name.endsWith(".csv");
}

function isPdfFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

function isSupportedImage(file: File) {
  const type = file.type.toLowerCase();
  if (SUPPORTED_IMAGE_TYPES.has(type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".gif") ||
    name.endsWith(".webp")
  );
}

function isAllowedFile(file: File) {
  return isSupportedImage(file) || isPdfFile(file) || isCsvFile(file);
}

function mediaTypeForFile(file: File) {
  if (isPdfFile(file)) return "application/pdf";
  if (isCsvFile(file)) return "text/csv";
  const type = file.type.toLowerCase();
  if (SUPPORTED_IMAGE_TYPES.has(type)) {
    return type === "image/jpg" ? "image/jpeg" : type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
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
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Images + PDFs as file parts; CSV becomes prompt text (vision APIs only accept jpeg/png/gif/webp). */
async function buildAttachmentPayload(files: File[]) {
  const fileParts: FileUIPart[] = [];
  const textChunks: string[] = [];

  for (const file of files) {
    if (isCsvFile(file)) {
      const csv = await file.text();
      textChunks.push(`\n\n--- Attached CSV: ${file.name} ---\n${csv}`);
      continue;
    }

    if (isSupportedImage(file) || isPdfFile(file)) {
      fileParts.push({
        type: "file",
        filename: file.name,
        mediaType: mediaTypeForFile(file),
        url: await readFileAsDataUrl(file),
      });
    }
  }

  return { fileParts, textChunks };
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

export function AiChat({
  defaultModelId,
}: {
  defaultModelId?: string;
} = {}) {
  const [input, setInput] = React.useState("");
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [modelId, setModelId] = React.useState<ChatModelId>(() =>
    resolveChatModelId(defaultModelId) as ChatModelId,
  );
  const modelIdRef = React.useRef(modelId);
  modelIdRef.current = modelId;
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model: modelIdRef.current }),
      }),
    [],
  );
  const [conversationId, setConversationId] = React.useState<string>(
    () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  );
  const [historyList, setHistoryList] = React.useState<ChatConversationMeta[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [loadingChatId, setLoadingChatId] = React.useState<string | null>(null);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    addToolOutput,
    addToolApprovalResponse,
  } = useChat<StarterKitUIMessage>({
    transport,
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

  const fetchHistory = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/chat/history");
      if (res.ok) {
        const data = (await res.json()) as { conversations?: ChatConversationMeta[] };
        setHistoryList(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Auto-save textual history on status ready
  React.useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: conversationId,
          messages,
        }),
      })
        .then(() => fetchHistory())
        .catch((err) => console.error("Auto-save failed:", err));
    }
  }, [status, messages, conversationId, fetchHistory]);

  async function loadConversation(id: string) {
    if (id === conversationId || busy) return;
    setLoadingChatId(id);
    try {
      const res = await fetch(`/api/chat/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.messages) {
          setMessages(data.conversation.messages);
          setConversationId(id);
        }
      } else {
        toast.add({
          title: "Could not load chat",
          description: "Conversation not found",
        });
      }
    } catch (err) {
      toast.add({
        title: "Could not load chat",
        description: String(err),
      });
    } finally {
      setLoadingChatId(null);
    }
  }

  function startNewChat() {
    if (busy) return;
    const newId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setConversationId(newId);
    setMessages([]);
    setInput("");
    setPendingFiles([]);
    focusComposer();
  }

  async function handleDeleteChat(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      const res = await fetch(`/api/chat/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item.id !== id));
        if (id === conversationId) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }

  const busy = status === "submitted" || status === "streaming";
  const canSend = Boolean(input.trim() || pendingFiles.length > 0);

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
          description: `${file.name} — use JPEG/PNG/GIF/WebP, PDF, or CSV.`,
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

  async function onSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!canSend || busy) return;

    const { fileParts, textChunks } = await buildAttachmentPayload(pendingFiles);
    const text = [input.trim(), ...textChunks].filter(Boolean).join("");

    sendMessage({
      text:
        text ||
        (fileParts.length > 0 ? "Please review the attached file(s)." : ""),
      files: fileParts.length > 0 ? fileParts : undefined,
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
                        Attach JPEG/PNG/GIF/WebP, PDF, or CSV — or try tools like
                        weather, stocks, and approvals.
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
                      <MessageContent
                        className={
                          message.role === "user" ? "items-end" : undefined
                        }
                      >
                        {message.role === "user" ? (
                          <MessageHeader>You</MessageHeader>
                        ) : null}
                        <div
                          className={cn(
                            "flex w-full min-w-0 flex-col gap-2",
                            message.role === "user" && "items-end",
                          )}
                        >
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
                      {error.message ||
                        "Something went wrong with the AI request."}
                    </MarkerContent>
                  </Marker>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="shrink-0 px-1 pb-1"
      >
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

        <div className="rounded-2xl border border-border bg-muted/40 shadow-sm transition-colors focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/15">
          {pendingFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {pendingFiles.map((file, index) => (
                <PendingFileAttachment
                  key={`${file.name}-${file.size}-${index}`}
                  file={file}
                  onRemove={() => removePendingFile(index)}
                />
              ))}
            </div>
          ) : null}

          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="How can I help you today?"
            rows={2}
            className="min-h-20 border-0 bg-transparent px-4 pt-4 pb-2 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
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
                void onSubmit();
              }
            }}
          />

          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Attach files"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon />
              </Button>

              <Popover
                onOpenChange={(open) => {
                  if (open) void fetchHistory();
                }}
              >
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Chat history"
                      title="Recents"
                      disabled={busy}
                    >
                      <MessageSquareIcon />
                    </Button>
                  }
                />
                <PopoverContent align="start" side="top" className="w-40 p-1.5">
                  <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>New Chat</span>
                    </button>

                    {loadingHistory ? (
                      <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                        <Spinner className="me-2 size-3.5" /> Loading...
                      </div>
                    ) : historyList.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No saved chats yet
                      </div>
                    ) : (
                      historyList.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => void loadConversation(item.id)}
                          className={cn(
                            "group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                            item.id === conversationId
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-foreground hover:bg-muted/70",
                          )}
                        >
                          <div className="me-2 min-w-0 flex-1">
                            <p className="truncate text-xs" title={item.title}>
                              {loadingChatId === item.id ? "Loading..." : item.title}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                            onClick={(e) => void handleDeleteChat(item.id, e)}
                            title="Delete conversation"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <Select
                value={modelId}
                onValueChange={(value) => {
                  if (value) setModelId(resolveChatModelId(value) as ChatModelId);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="max-w-44 border-0 bg-transparent shadow-none dark:bg-transparent"
                  aria-label="Select model"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-52">
                  <SelectGroup>
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {busy ? (
                <Button
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
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  aria-label="Send"
                  disabled={!canSend}
                >
                  <ArrowUpIcon />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function AssistantPendingSkeleton() {
  return (
    <div className="flex w-full max-w-[80%] flex-col gap-2">
      <Skeleton className="h-4 w-40" />
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
  const filename = part.filename ?? "Attachment";

  return (
    <Attachment state="done" size="sm" className="max-w-xs self-end">
      <AttachmentMedia variant={isImage ? "image" : "icon"}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={part.url} alt={filename} />
        ) : isPdf ? (
          <FileTextIcon />
        ) : isCsv ? (
          <FileSpreadsheetIcon />
        ) : (
          <FileTextIcon />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{filename}</AttachmentTitle>
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
  const isPdf =
    mediaType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const previewUrl = React.useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage],
  );
  const thumbLabel = file.name.replace(/\.[^.]+$/, "").slice(0, 5);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex max-w-72 min-w-52 items-center gap-2.5 rounded-xl border border-border bg-background/80 py-1.5 pe-1.5 ps-1.5">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            {isPdf ? <FileTextIcon className="size-4" /> : isCsvFile(file) ? (
              <FileSpreadsheetIcon className="size-4" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </div>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/55 px-0.5 py-px text-[9px] leading-none text-white">
          {thumbLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xs font-medium">{file.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {mediaType} · {formatBytes(file.size)}
        </p>
      </div>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </div>
  );
}

function MessagePartView({
  role,
  part,
  addToolOutput,
  addToolApprovalResponse,
}: MessagePartViewProps) {
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
