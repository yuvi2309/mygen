"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { Agent, AgentTool } from "@/lib/types";
import { useAgentChat, type AgentMessage } from "@/hooks/use-agent-chat";
import { Button } from "@/components/ui/button";
import { clearThreadMessages, createThread, forkThread, saveMessages, type StoredMessage } from "@/lib/store";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface ChatInterfaceProps {
  agent: Agent;
  agents?: Agent[];
  onAgentChange?: (agent: Agent) => void;
  threadId?: string;
  initialMessages?: StoredMessage[];
}

function uiMessagesToStored(
  messages: UIMessage[],
  metaMap: Record<string, Partial<StoredMessage>> = {},
  createdAtMap: Record<string, string> = {}
): StoredMessage[] {
  return messages.map((message) => {
    const textContent =
      message.parts
        ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("") ?? "";

    const existing = metaMap[message.id] ?? {};
    const createdAt = createdAtMap[message.id] ?? existing.createdAt ?? new Date().toISOString();
    createdAtMap[message.id] = createdAt;

    return {
      id: message.id,
      role: message.role as StoredMessage["role"],
      content: textContent,
      parts: message.parts,
      createdAt,
      editedAt: existing.editedAt,
      isPinned: existing.isPinned ?? false,
      originalContent: existing.originalContent,
      curatedSelections: existing.curatedSelections ?? [],
      branches: existing.branches ?? [],
    };
  });
}

function agentMessagesToStored(
  messages: AgentMessage[],
  metaMap: Record<string, Partial<StoredMessage>> = {},
  createdAtMap: Record<string, string> = {}
): StoredMessage[] {
  return messages.map((message) => {
    const existing = metaMap[message.id] ?? {};
    const createdAt = createdAtMap[message.id] ?? existing.createdAt ?? message.timestamp?.toISOString?.() ?? new Date().toISOString();
    createdAtMap[message.id] = createdAt;

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      toolCalls: message.toolCalls,
      toolCallId: message.toolCallId,
      toolName: message.toolName,
      createdAt,
      editedAt: existing.editedAt,
      isPinned: existing.isPinned ?? false,
      originalContent: existing.originalContent,
      curatedSelections: existing.curatedSelections ?? [],
      branches: existing.branches ?? [],
    };
  });
}

function storedToUIMessages(messages: StoredMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as UIMessage["role"],
    parts: (message.parts as UIMessage["parts"]) ?? [{ type: "text" as const, text: message.content }],
  }));
}

function storedToAgentMessages(messages: StoredMessage[]): AgentMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as AgentMessage["role"],
    content: message.content,
    toolCalls: message.toolCalls,
    toolCallId: message.toolCallId,
    toolName: message.toolName,
    timestamp: new Date(message.createdAt),
  }));
}

export function ChatInterface({
  agent,
  agents,
  onAgentChange,
  threadId: initialThreadId,
  initialMessages,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [extraTools, setExtraTools] = useState<AgentTool[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [agentMode, setAgentMode] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);
  const [pendingResend, setPendingResend] = useState<string | null>(null);
  const [messageMeta, setMessageMeta] = useState<Record<string, Partial<StoredMessage>>>(() =>
    Object.fromEntries(
      (initialMessages ?? []).map((message) => [
        message.id,
        {
          createdAt: message.createdAt,
          editedAt: message.editedAt,
          isPinned: message.isPinned,
          originalContent: message.originalContent,
          curatedSelections: message.curatedSelections ?? [],
          branches: message.branches ?? [],
        },
      ])
    )
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sdkInitialMessages = useMemo(
    () => (initialMessages?.length ? storedToUIMessages(initialMessages) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          agent: {
            name: agent.name,
            instructions: agent.instructions,
            model: agent.model,
            tools: agent.tools,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
          },
          extraTools,
        },
      }),
    [agent, extraTools]
  );

  const sdkChat = useChat({ transport, messages: sdkInitialMessages });
  const sdkIsLoading = sdkChat.status === "submitted" || sdkChat.status === "streaming";
  const sdkError = sdkChat.error;

  const agentInitialMessages = useMemo(
    () => (initialMessages?.length ? storedToAgentMessages(initialMessages) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const agentChat = useAgentChat(agent, extraTools, agentInitialMessages);

  const isLoading = agentMode ? agentChat.isRunning : sdkIsLoading;

  const storedDisplayMessages = useMemo(
    () =>
      agentMode
        ? agentMessagesToStored(agentChat.messages, messageMeta)
        : uiMessagesToStored(sdkChat.messages, messageMeta),
    [agentMode, agentChat.messages, sdkChat.messages, messageMeta]
  );

  const persistMessages = useCallback((threadId: string, messages: StoredMessage[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMessages(threadId, messages);
    }, 300);
  }, []);

  useEffect(() => {
    const missingMeta = storedDisplayMessages.some((message) => !messageMeta[message.id]?.createdAt);
    if (!missingMeta) return;

    queueMicrotask(() => {
      setMessageMeta((prev) => {
        const next = { ...prev };
        let changed = false;

        for (const message of storedDisplayMessages) {
          if (!next[message.id]?.createdAt) {
            next[message.id] = {
              ...next[message.id],
              createdAt: message.createdAt,
            };
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    });
  }, [storedDisplayMessages, messageMeta]);

  useEffect(() => {
    if (activeThreadId && storedDisplayMessages.length > 0) {
      persistMessages(activeThreadId, storedDisplayMessages);
    }
  }, [activeThreadId, storedDisplayMessages, persistMessages]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingResend || isLoading) return;

    const resend = async () => {
      if (agentMode) {
        await agentChat.sendMessage(pendingResend);
      } else {
        await sdkChat.sendMessage({ text: pendingResend });
      }
      setPendingResend(null);
    };

    void resend();
  }, [pendingResend, isLoading, agentMode, agentChat, sdkChat]);

  const displayMessages: UIMessage[] = agentMode
    ? agentChat.messages
        .filter((message: AgentMessage) => message.role !== "tool")
        .map((message: AgentMessage) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          parts: message.toolCalls
            ? [
                ...(message.content ? [{ type: "text" as const, text: message.content }] : []),
                ...message.toolCalls.map((toolCall) => ({
                  type: "dynamic-tool" as const,
                  toolName: toolCall.name,
                  toolCallId: toolCall.id,
                  state: "input-available" as const,
                  input: toolCall.args,
                })),
              ]
            : [{ type: "text" as const, text: message.content }],
        })) as UIMessage[]
    : sdkChat.messages;

  async function handleSubmit(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setAttachedFiles([]);

    let currentThreadId = activeThreadId;
    if (!currentThreadId) {
      const title = text.length > 50 ? `${text.slice(0, 50)}…` : text;
      const thread = createThread(agent.id, title);
      currentThreadId = thread.id;
      setActiveThreadId(thread.id);
      window.history.replaceState(null, "", `/chat/t/${thread.id}`);
    }

    if (agentMode) {
      await agentChat.sendMessage(text);
    } else {
      await sdkChat.sendMessage({ text });
    }

    if (currentThreadId) {
      window.dispatchEvent(new Event("storage"));
    }
  }

  function handleStop() {
    if (agentMode) {
      agentChat.stop();
    } else {
      sdkChat.stop();
    }
  }

  function updateDisplayedMessageText(messageId: string, nextText: string) {
    if (agentMode) {
      agentChat.setMessages(
        agentChat.messages.map((message) =>
          message.id === messageId ? { ...message, content: nextText } : message
        )
      );
      return;
    }

    sdkChat.setMessages(
      sdkChat.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              parts: [
                { type: "text" as const, text: nextText },
                ...(message.parts?.filter((part) => part.type !== "text") ?? []),
              ],
            }
          : message
      )
    );
  }

  function handlePinMessage(messageId: string) {
    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPinned: !prev[messageId]?.isPinned,
      },
    }));
  }

  function handleKeepSelection(messageId: string, selectedText: string) {
    const snippet = selectedText.trim();
    if (!snippet) return;

    setMessageMeta((prev) => {
      const current = prev[messageId] ?? {};
      const curatedSelections = current.curatedSelections ?? [];
      if (curatedSelections.includes(snippet)) {
        return prev;
      }

      const currentMessage = storedDisplayMessages.find((message) => message.id === messageId);
      return {
        ...prev,
        [messageId]: {
          ...current,
          originalContent: current.originalContent ?? currentMessage?.content,
          curatedSelections: [...curatedSelections, snippet],
        },
      };
    });
  }

  function handleRemoveSelection(messageId: string, selectionText: string) {
    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        curatedSelections: (prev[messageId]?.curatedSelections ?? []).filter((item) => item !== selectionText),
      },
    }));
  }

  function handleTrimMessage(messageId: string) {
    const curatedSelections = messageMeta[messageId]?.curatedSelections ?? [];
    if (curatedSelections.length === 0) return;

    const nextText = curatedSelections.join("\n\n");
    updateDisplayedMessageText(messageId, nextText);
    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        originalContent:
          prev[messageId]?.originalContent ??
          storedDisplayMessages.find((message) => message.id === messageId)?.content,
        editedAt: new Date().toISOString(),
      },
    }));
  }

  function handleRestoreMessage(messageId: string) {
    const originalContent = messageMeta[messageId]?.originalContent;
    if (!originalContent) return;

    updateDisplayedMessageText(messageId, originalContent);
    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        editedAt: new Date().toISOString(),
      },
    }));
  }

  async function resolveBranchReply(
    messageId: string,
    branchId: string,
    selectedText: string,
    question: string,
    assistantMessageId: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) {
    try {
      const response = await fetch("/api/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText,
          question,
          history,
          agent: {
            name: agent.name,
            instructions: agent.instructions,
            model: agent.model,
            tools: agent.tools,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
          },
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create branch answer");
      }

      setMessageMeta((prev) => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          branches: (prev[messageId]?.branches ?? []).map((branch) =>
            branch.id === branchId
              ? {
                  ...branch,
                  messages: branch.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, content: data.answer ?? "No answer returned.", status: "done" as const }
                      : message
                  ),
                }
              : branch
          ),
        },
      }));
    } catch (error) {
      setMessageMeta((prev) => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          branches: (prev[messageId]?.branches ?? []).map((branch) =>
            branch.id === branchId
              ? {
                  ...branch,
                  messages: branch.messages.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          content: error instanceof Error ? error.message : "Branch request failed",
                          status: "error" as const,
                        }
                      : message
                  ),
                }
              : branch
          ),
        },
      }));
    }
  }

  async function handleAskSelectionBranch(messageId: string, selectedText: string) {
    const snippet = selectedText.trim();
    if (!snippet) return;

    const question = window.prompt("Ask a question about this selected portion")?.trim();
    if (!question) return;

    const now = new Date().toISOString();
    const branchId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const history = [{ role: "user" as const, content: question }];

    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        branches: [
          ...(prev[messageId]?.branches ?? []),
          {
            id: branchId,
            selectedText: snippet,
            createdAt: now,
            title: question.slice(0, 60),
            messages: [
              {
                id: crypto.randomUUID(),
                role: "user" as const,
                content: question,
                createdAt: now,
                status: "done" as const,
              },
              {
                id: assistantMessageId,
                role: "assistant" as const,
                content: "Thinking…",
                createdAt: now,
                status: "loading" as const,
              },
            ],
          },
        ],
      },
    }));

    await resolveBranchReply(messageId, branchId, snippet, question, assistantMessageId, history);
  }

  async function handleSendBranchMessage(messageId: string, branchId: string, question: string) {
    const branch = (messageMeta[messageId]?.branches ?? []).find((item) => item.id === branchId);
    if (!branch) return;

    const now = new Date().toISOString();
    const assistantMessageId = crypto.randomUUID();
    const history = [
      ...branch.messages
        .filter((message) => message.status !== "loading")
        .map((message) => ({ role: message.role, content: message.content })),
      { role: "user" as const, content: question },
    ];

    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        branches: (prev[messageId]?.branches ?? []).map((item) =>
          item.id === branchId
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "user" as const,
                    content: question,
                    createdAt: now,
                    status: "done" as const,
                  },
                  {
                    id: assistantMessageId,
                    role: "assistant" as const,
                    content: "Thinking…",
                    createdAt: now,
                    status: "loading" as const,
                  },
                ],
              }
            : item
        ),
      },
    }));

    await resolveBranchReply(messageId, branchId, branch.selectedText, question, assistantMessageId, history);
  }

  function handleEditMessage(messageId: string, text: string) {
    const nextText = window.prompt("Edit this prompt and resend it", text)?.trim();
    if (!nextText || isLoading) return;

    handleStop();

    if (agentMode) {
      const index = agentChat.messages.findIndex((message) => message.id === messageId);
      if (index >= 0) {
        agentChat.setMessages(agentChat.messages.slice(0, index));
      }
    } else {
      const index = sdkChat.messages.findIndex((message) => message.id === messageId);
      if (index >= 0) {
        sdkChat.setMessages(sdkChat.messages.slice(0, index));
      }
    }

    if (activeThreadId) {
      const index = storedDisplayMessages.findIndex((message) => message.id === messageId);
      if (index >= 0) {
        saveMessages(activeThreadId, storedDisplayMessages.slice(0, index));
      }
    }

    setMessageMeta((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        editedAt: new Date().toISOString(),
      },
    }));
    setPendingResend(nextText);
  }

  function clearConversationState() {
    handleStop();
    if (agentMode) {
      agentChat.reset();
    } else {
      sdkChat.setMessages([]);
    }
    setInput("");
    setAttachedFiles([]);
    setPendingResend(null);
    setMessageMeta({});

    if (activeThreadId) {
      clearThreadMessages(activeThreadId);
    }
  }

  function handleClearContext() {
    if (!window.confirm("Clear the current chat context?")) return;
    clearConversationState();
  }

  function handleResetChat() {
    if (!window.confirm("Reset this chat and start fresh?")) return;
    clearConversationState();
    setActiveThreadId(null);
    window.history.replaceState(null, "", "/chat");
  }

  function handleForkFromMessage(messageId: string) {
    if (!activeThreadId) return;
    const forked = forkThread(activeThreadId, { upToMessageId: messageId });
    if (forked) {
      window.location.href = `/chat/t/${forked.id}`;
    }
  }

  function handleForkCurrentThread() {
    if (!activeThreadId) return;
    const forked = forkThread(activeThreadId);
    if (forked) {
      window.location.href = `/chat/t/${forked.id}`;
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            {activeThreadId ? `${storedDisplayMessages.length} messages in this thread` : "Draft chat · no thread yet"}
          </div>
          {activeThreadId && (
            <Button type="button" variant="ghost" size="sm" onClick={handleForkCurrentThread}>
              Fork thread
            </Button>
          )}
        </div>
      </div>

      {agentMode && agentChat.isRunning && agentChat.currentNode && (
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Agent executing: <span className="font-medium">{agentChat.currentNode}</span>
          {agentChat.stepCount > 0 && <span>· Step {agentChat.stepCount}</span>}
        </div>
      )}
      {agentChat.error && (
        <div className="border-b bg-destructive/10 px-4 py-1.5 text-xs text-destructive">
          Error: {agentChat.error}
        </div>
      )}
      {!agentMode && sdkError && (
        <div className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
          Error: {sdkError.message ?? "Something went wrong. Check your API key and try again."}
        </div>
      )}

      <MessageList
        messages={displayMessages}
        isLoading={isLoading}
        messageMeta={storedDisplayMessages}
        onEditMessage={handleEditMessage}
        onPinMessage={handlePinMessage}
        onForkFromMessage={handleForkFromMessage}
        onKeepSelection={handleKeepSelection}
        onAskSelectionBranch={handleAskSelectionBranch}
        onTrimMessage={handleTrimMessage}
        onRestoreMessage={handleRestoreMessage}
        onRemoveSelection={handleRemoveSelection}
        onSendBranchMessage={handleSendBranchMessage}
      />
      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={handleStop}
        agent={agent}
        agents={agents}
        onAgentChange={onAgentChange}
        extraTools={extraTools}
        onExtraToolsChange={setExtraTools}
        attachedFiles={attachedFiles}
        onFilesChange={setAttachedFiles}
        agentMode={agentMode}
        onAgentModeChange={setAgentMode}
        onClearContext={handleClearContext}
        onResetChat={handleResetChat}
      />
    </div>
  );
}
