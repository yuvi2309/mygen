"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { ArrowUp, Bot, ChevronDown, GitBranch, GitFork, Pencil, Pin, PinOff, Scissors, User, X } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import type { StoredMessage } from "@/lib/store";
import { ToolCallDisplay } from "./tool-call-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StructuredMessageContent } from "./structured-message-content";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  messageMeta?: StoredMessage[];
  onEditMessage?: (messageId: string, text: string) => void;
  onPinMessage?: (messageId: string) => void;
  onForkFromMessage?: (messageId: string) => void;
  onKeepSelection?: (messageId: string, text: string) => void;
  onAskSelectionBranch?: (messageId: string, text: string) => void;
  onTrimMessage?: (messageId: string) => void;
  onRestoreMessage?: (messageId: string) => void;
  onRemoveSelection?: (messageId: string, selectionText: string) => void;
  onSendBranchMessage?: (messageId: string, branchId: string, text: string) => void;
}

interface SelectionState {
  messageId: string;
  text: string;
  x: number;
  y: number;
}

function isToolPart(part: { type: string }): boolean {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function getToolName(part: { type: string }): string {
  if (part.type === "dynamic-tool") {
    return (part as unknown as { toolName: string }).toolName;
  }
  return part.type.replace(/^tool-/, "");
}

function getToolState(part: Record<string, unknown>): "call" | "result" | "partial-call" {
  const state = part.state as string;
  if (state === "output-available" || state === "error") return "result";
  if (state === "input-streaming") return "partial-call";
  return "call";
}

function formatTimestamp(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function getTextContent(message: UIMessage) {
  return (
    message.parts
      ?.filter((part): part is { type: "text"; text: string } => part.type === "text" && !!part.text)
      .map((part) => part.text)
      .join("\n") ?? ""
  );
}

export function MessageList({
  messages,
  isLoading,
  messageMeta = [],
  onEditMessage,
  onPinMessage,
  onForkFromMessage,
  onKeepSelection,
  onAskSelectionBranch,
  onTrimMessage,
  onRestoreMessage,
  onRemoveSelection,
  onSendBranchMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});
  const [branchInputs, setBranchInputs] = useState<Record<string, string>>({});

  const metaById = useMemo(
    () => Object.fromEntries(messageMeta.map((message) => [message.id, message])),
    [messageMeta]
  );

  const pinnedMessages = useMemo(
    () => messages.filter((message) => metaById[message.id]?.isPinned),
    [messages, metaById]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const clearToolbarIfNeeded = () => {
      const selectedText = window.getSelection()?.toString().trim();
      if (!selectedText) {
        setSelectionState(null);
      }
    };

    document.addEventListener("selectionchange", clearToolbarIfNeeded);
    return () => document.removeEventListener("selectionchange", clearToolbarIfNeeded);
  }, []);

  function handleTextSelection(messageId: string) {
    queueMicrotask(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!selection || !text || selection.rangeCount === 0) return;

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectionState({
        messageId,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    });
  }

  function clearSelectionState() {
    setSelectionState(null);
    window.getSelection()?.removeAllRanges();
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="space-y-3 text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium">Start an interactive conversation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit prompts, fork ideas, pin answers, and clear context anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="relative mx-auto max-w-4xl space-y-6 px-4 py-6">
        {selectionState && (
          <div
            className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background p-1 shadow-lg"
            style={{ left: selectionState.x, top: selectionState.y }}
          >
            {onKeepSelection && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onKeepSelection(selectionState.messageId, selectionState.text);
                  clearSelectionState();
                }}
                className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Keep cut
              </button>
            )}
            {onAskSelectionBranch && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onAskSelectionBranch(selectionState.messageId, selectionState.text);
                  clearSelectionState();
                }}
                className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Ask in branch
              </button>
            )}
          </div>
        )}

        {pinnedMessages.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Pin className="h-4 w-4" />
              Quick pins
            </div>
            <div className="flex flex-wrap gap-2">
              {pinnedMessages.map((message) => (
                <button
                  key={`pin-${message.id}`}
                  type="button"
                  onClick={() =>
                    document.getElementById(`message-${message.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                  }
                  className="max-w-full rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {getTextContent(message).slice(0, 80) || "Pinned item"}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const meta = metaById[message.id];
          const textContent = getTextContent(message);
          const curatedSelections = meta?.curatedSelections ?? [];
          const branches = meta?.branches ?? [];
          const isTrimmed = !!meta?.originalContent && meta.originalContent !== textContent;

          return (
            <div key={message.id} id={`message-${message.id}`} className="group flex gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{message.role === "user" ? "You" : "Agent"}</span>
                  {meta?.isPinned && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Pinned</span>}
                  {meta?.editedAt && <span className="rounded-full bg-muted px-2 py-0.5">Edited</span>}
                  {isTrimmed && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Trimmed</span>}
                  {meta?.createdAt && <span>{formatTimestamp(meta.createdAt)}</span>}
                </div>

                <div className="space-y-3 rounded-xl border bg-background/60 p-3">
                  {message.parts?.map((part, i) => {
                    if (part.type === "text" && part.text) {
                      return (
                        <div key={i} onMouseUp={() => handleTextSelection(message.id)} className="select-text">
                          <StructuredMessageContent text={part.text} />
                        </div>
                      );
                    }
                    if (isToolPart(part)) {
                      const p = part as Record<string, unknown>;
                      return (
                        <ToolCallDisplay
                          key={(p.toolCallId as string) ?? `${message.id}-${i}`}
                          toolName={getToolName(part)}
                          args={(p.input ?? {}) as Record<string, unknown>}
                          state={getToolState(p)}
                          result={p.output}
                        />
                      );
                    }
                    return null;
                  })}
                </div>

                {curatedSelections.length > 0 && (
                  <div className="rounded-xl border border-dashed bg-primary/5 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        <Scissors className="h-4 w-4" />
                        Kept parts for this answer
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {onTrimMessage && (
                          <button
                            type="button"
                            onClick={() => onTrimMessage(message.id)}
                            className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Trim response
                          </button>
                        )}
                        {onRestoreMessage && meta?.originalContent && (
                          <button
                            type="button"
                            onClick={() => onRestoreMessage(message.id)}
                            className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Restore full
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {curatedSelections.map((selection, index) => (
                        <div key={`${message.id}-selection-${index}`} className="flex items-start gap-2 rounded-lg border bg-background px-2 py-2">
                          <div className="min-w-0 flex-1 text-sm text-muted-foreground">{selection}</div>
                          {onRemoveSelection && (
                            <button
                              type="button"
                              onClick={() => onRemoveSelection(message.id, selection)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Remove kept part"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {branches.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setOpenNodes((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
                      className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      {branches.length} branch node{branches.length > 1 ? "s" : ""}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openNodes[message.id] ? "rotate-180" : "")} />
                    </button>

                    {openNodes[message.id] && (
                      <div className="ml-3 space-y-3 border-l-2 border-primary/20 pl-4">
                        {branches.map((branch) => (
                          <div key={branch.id} className="rounded-xl border bg-muted/20 p-3">
                            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <GitBranch className="h-3.5 w-3.5" />
                              {branch.title || "Side branch"}
                            </div>
                            <div className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                              {branch.selectedText}
                            </div>

                            <div className="mt-3 space-y-2">
                              {branch.messages.map((branchMessage) => (
                                <div
                                  key={branchMessage.id}
                                  className={cn(
                                    "rounded-lg border px-2.5 py-2 text-sm",
                                    branchMessage.role === "user" ? "bg-background" : "bg-primary/5"
                                  )}
                                >
                                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {branchMessage.role === "user" ? "You" : "Branch AI"}
                                  </div>
                                  {branchMessage.status === "loading" ? "Thinking…" : <StructuredMessageContent text={branchMessage.content} />}
                                </div>
                              ))}
                            </div>

                            {onSendBranchMessage && (
                              <form
                                className="mt-3 flex items-center gap-2"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const value = branchInputs[branch.id]?.trim();
                                  if (!value) return;
                                  onSendBranchMessage(message.id, branch.id, value);
                                  setBranchInputs((prev) => ({ ...prev, [branch.id]: "" }));
                                }}
                              >
                                <input
                                  value={branchInputs[branch.id] ?? ""}
                                  onChange={(event) =>
                                    setBranchInputs((prev) => ({ ...prev, [branch.id]: event.target.value }))
                                  }
                                  placeholder="Continue this branch..."
                                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                                />
                                <button
                                  type="submit"
                                  className="rounded-md border bg-background p-2 text-muted-foreground hover:text-foreground"
                                  aria-label="Send branch message"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {onPinMessage && (
                    <button
                      type="button"
                      onClick={() => onPinMessage(message.id)}
                      className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {meta?.isPinned ? (
                        <span className="inline-flex items-center gap-1"><PinOff className="h-3.5 w-3.5" />Unpin</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Pin className="h-3.5 w-3.5" />Pin</span>
                      )}
                    </button>
                  )}

                  {message.role === "user" && onEditMessage && textContent && (
                    <button
                      type="button"
                      onClick={() => onEditMessage(message.id, textContent)}
                      className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="inline-flex items-center gap-1"><Pencil className="h-3.5 w-3.5" />Edit and resend</span>
                    </button>
                  )}

                  {onForkFromMessage && (
                    <button
                      type="button"
                      onClick={() => onForkFromMessage(message.id)}
                      className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />Fork here</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 pt-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
