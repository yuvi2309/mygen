"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { ArrowUp, Bot, ChevronDown, GitBranch, GitFork, Pencil, Pin, PinOff, Scissors, User, X } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import type { StoredMessage } from "@/lib/store";
import { ToolCallDisplay } from "./tool-call-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  onCreateBranch?: (messageId: string, text: string) => string | undefined;
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

interface ActiveBranchState {
  messageId: string;
  branchId: string;
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

function formatNodeLabel(value?: string) {
  if (!value) return "Agent";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  onCreateBranch,
  onTrimMessage,
  onRestoreMessage,
  onRemoveSelection,
  onSendBranchMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [activeBranchState, setActiveBranchState] = useState<ActiveBranchState | null>(null);
  const [branchInputs, setBranchInputs] = useState<Record<string, string>>({});
  const [collapsedMessages, setCollapsedMessages] = useState<Record<string, boolean>>({});

  const metaById = useMemo(
    () => Object.fromEntries(messageMeta.map((message) => [message.id, message])),
    [messageMeta]
  );

  const pinnedMessages = useMemo(
    () => messages.filter((message) => metaById[message.id]?.isPinned),
    [messages, metaById]
  );

  const activeBranch = useMemo(() => {
    if (!activeBranchState) return null;

    const branch = (metaById[activeBranchState.messageId]?.branches ?? []).find(
      (item) => item.id === activeBranchState.branchId
    );

    return branch ? { ...activeBranchState, branch } : null;
  }, [activeBranchState, metaById]);

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
          const isCollapsed = !!collapsedMessages[message.id];
          const isExpertMessage = message.role === "assistant" && !!meta?.node && meta.node !== "agent";

          return (
            <div key={message.id} id={`message-${message.id}`} className="group flex items-start gap-3">
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
                  <span className="font-medium">{message.role === "user" ? "You" : formatNodeLabel(meta?.node)}</span>
                  {meta?.isPinned && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Pinned</span>}
                  {meta?.editedAt && <span className="rounded-full bg-muted px-2 py-0.5">Edited</span>}
                  {isTrimmed && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Trimmed</span>}
                  {meta?.createdAt && <span>{formatTimestamp(meta.createdAt)}</span>}
                </div>

                <div className="space-y-3 rounded-xl border bg-background/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <div className="text-xs text-muted-foreground">
                      {isExpertMessage ? "Council expert response" : message.role === "assistant" ? "Response" : "Message"}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {isExpertMessage && (
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedMessages((prev) => ({
                              ...prev,
                              [message.id]: !prev[message.id],
                            }))
                          }
                          className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                          {isCollapsed ? "Expand" : "Minimize"}
                        </button>
                      )}

                      {message.role === "assistant" && (onTrimMessage || onCreateBranch) && (
                        <>
                          {onTrimMessage && (
                            <button
                              type="button"
                              onClick={() => onTrimMessage(message.id)}
                              disabled={curatedSelections.length === 0}
                              title={curatedSelections.length === 0 ? "Select text and keep cuts first" : "Trim this response"}
                              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Scissors className="h-3.5 w-3.5" />
                              Trim response
                            </button>
                          )}

                          {onCreateBranch && textContent && (
                            <button
                              type="button"
                              onClick={() => {
                                const branchId = onCreateBranch(message.id, textContent);
                                if (branchId) {
                                  setActiveBranchState({ messageId: message.id, branchId });
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <GitBranch className="h-3.5 w-3.5" />
                              Create branch
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && message.parts?.map((part, i) => {
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

                  {isCollapsed && (
                    <div className="text-sm text-muted-foreground">
                      Response hidden. Expand to view this expert&rsquo;s reasoning.
                    </div>
                  )}
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

              {branches.length > 0 && (
                <div className="flex max-h-44 w-11 shrink-0 flex-col gap-1 overflow-y-auto rounded-xl border bg-muted/30 p-1">
                  {branches.map((branch, index) => {
                    const isActive =
                      activeBranchState?.messageId === message.id &&
                      activeBranchState.branchId === branch.id;

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => setActiveBranchState({ messageId: message.id, branchId: branch.id })}
                        className={cn(
                          "flex min-h-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground",
                          isActive && "border-primary text-primary"
                        )}
                        title={branch.title || `Branch ${index + 1}`}
                        aria-label={branch.title || `Branch ${index + 1}`}
                      >
                        <GitBranch className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
              )}
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

        <Sheet open={!!activeBranchState} onOpenChange={(open) => !open && setActiveBranchState(null)}>
          <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
            {activeBranch && (
              <>
                <SheetHeader className="border-b">
                  <SheetTitle>{activeBranch.branch.title || "Branch chat"}</SheetTitle>
                  <SheetDescription>Side conversation for this response</SheetDescription>
                  <div className="mt-2 line-clamp-4 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {activeBranch.branch.selectedText}
                  </div>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col">
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 p-4">
                      {activeBranch.branch.messages.length === 0 && (
                        <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                          Start a side chat about this response.
                        </div>
                      )}

                      {activeBranch.branch.messages.map((branchMessage) => (
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
                  </ScrollArea>

                  {onSendBranchMessage && (
                    <form
                      className="border-t p-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!activeBranch) return;
                        const value = branchInputs[activeBranch.branch.id]?.trim();
                        if (!value) return;
                        onSendBranchMessage(activeBranch.messageId, activeBranch.branch.id, value);
                        setBranchInputs((prev) => ({ ...prev, [activeBranch.branch.id]: "" }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={activeBranch ? branchInputs[activeBranch.branch.id] ?? "" : ""}
                          onChange={(event) => {
                            if (!activeBranch) return;
                            setBranchInputs((prev) => ({ ...prev, [activeBranch.branch.id]: event.target.value }));
                          }}
                          placeholder="Message this branch..."
                          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          type="submit"
                          className="rounded-md border bg-background p-2 text-muted-foreground hover:text-foreground"
                          aria-label="Send branch message"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
