"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { Agent, AgentTool } from "@/lib/types";
import { useAgentChat, type AgentMessage } from "@/hooks/use-agent-chat";
import { createThread, saveMessages, type StoredMessage } from "@/lib/store";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface ChatInterfaceProps {
  agent: Agent;
  agents?: Agent[];
  onAgentChange?: (agent: Agent) => void;
  threadId?: string;
  initialMessages?: StoredMessage[];
}

// ── Serialization helpers ─────────────────────────────────────────────────

function uiMessagesToStored(messages: UIMessage[]): StoredMessage[] {
  return messages.map((m) => {
    // Extract text content from parts
    const textContent = m.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

    return {
      id: m.id,
      role: m.role as StoredMessage["role"],
      content: textContent,
      parts: m.parts,
      createdAt: new Date().toISOString(),
    };
  });
}

function agentMessagesToStored(messages: AgentMessage[]): StoredMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    toolCalls: m.toolCalls,
    toolCallId: m.toolCallId,
    toolName: m.toolName,
    createdAt: m.timestamp?.toISOString?.() ?? new Date().toISOString(),
  }));
}

function storedToUIMessages(messages: StoredMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    parts: (m.parts as UIMessage["parts"]) ?? [{ type: "text" as const, text: m.content }],
  }));
}

function storedToAgentMessages(messages: StoredMessage[]): AgentMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as AgentMessage["role"],
    content: m.content,
    toolCalls: m.toolCalls,
    toolCallId: m.toolCallId,
    toolName: m.toolName,
    timestamp: new Date(m.createdAt),
  }));
}

export function ChatInterface({ agent, agents, onAgentChange, threadId: initialThreadId, initialMessages }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [extraTools, setExtraTools] = useState<AgentTool[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [agentMode, setAgentMode] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert initial messages for SDK mode
  const sdkInitialMessages = useMemo(
    () => (initialMessages?.length ? storedToUIMessages(initialMessages) : undefined),
    // Only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── AI SDK mode (simple streaming) ──
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

  // ── LangGraph agent mode (agentic loop) ──
  const agentInitialMessages = useMemo(
    () => (initialMessages?.length ? storedToAgentMessages(initialMessages) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const agentChat = useAgentChat(agent, extraTools, agentInitialMessages);

  // ── Unified interface ──
  const isLoading = agentMode ? agentChat.isRunning : sdkIsLoading;

  // ── Auto-save messages (debounced) ──
  const persistMessages = useCallback((tid: string, msgs: StoredMessage[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMessages(tid, msgs);
    }, 500);
  }, []);

  // Save SDK messages whenever they change
  useEffect(() => {
    if (!agentMode && activeThreadId && sdkChat.messages.length > 0) {
      persistMessages(activeThreadId, uiMessagesToStored(sdkChat.messages));
    }
  }, [agentMode, activeThreadId, sdkChat.messages, persistMessages]);

  // Save agent messages whenever they change
  useEffect(() => {
    if (agentMode && activeThreadId && agentChat.messages.length > 0) {
      persistMessages(activeThreadId, agentMessagesToStored(agentChat.messages));
    }
  }, [agentMode, activeThreadId, agentChat.messages, persistMessages]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Convert agent messages to the format MessageList expects
  const displayMessages: UIMessage[] = agentMode
    ? agentChat.messages
        .filter((m: AgentMessage) => m.role !== "tool")
        .map((m: AgentMessage) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: m.toolCalls
            ? [
                ...(m.content ? [{ type: "text" as const, text: m.content }] : []),
                ...m.toolCalls.map((tc) => ({
                  type: "dynamic-tool" as const,
                  toolName: tc.name,
                  toolCallId: tc.id,
                  state: "input-available" as const,
                  input: tc.args,
                })),
              ]
            : [{ type: "text" as const, text: m.content }],
        })) as UIMessage[]
    : sdkChat.messages;

  async function handleSubmit(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setAttachedFiles([]);

    // Create thread on first message (new conversations only)
    if (!activeThreadId) {
      const title = text.length > 50 ? text.slice(0, 50) + "…" : text;
      const thread = createThread(agent.id, title);
      setActiveThreadId(thread.id);
      // Notify sidebar about the new thread
      window.dispatchEvent(new Event("storage"));
      // Update the URL silently so refreshes work, but don't trigger a
      // Next.js navigation that would remount the component and lose the message.
      window.history.replaceState(null, "", `/chat/t/${thread.id}`);
    }

    if (agentMode) {
      await agentChat.sendMessage(text);
    } else {
      await sdkChat.sendMessage({ text });
    }
  }

  function handleStop() {
    if (agentMode) {
      agentChat.stop();
    } else {
      sdkChat.stop();
    }
  }

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Agent mode indicator */}
      {agentMode && agentChat.isRunning && agentChat.currentNode && (
        <div className="border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
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

      <MessageList messages={displayMessages} isLoading={isLoading} />
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
      />
    </div>
  );
}
