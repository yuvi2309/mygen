"use client";

import { useState, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Agent, AgentTool } from "@/lib/types";
import { useAgentChat, type AgentMessage } from "@/hooks/use-agent-chat";
import { createThread } from "@/lib/store";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface ChatInterfaceProps {
  agent: Agent;
  agents?: Agent[];
  onAgentChange?: (agent: Agent) => void;
}

export function ChatInterface({ agent, agents, onAgentChange }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [extraTools, setExtraTools] = useState<AgentTool[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [agentMode, setAgentMode] = useState(false);
  const [threadCreated, setThreadCreated] = useState(false);

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

  const sdkChat = useChat({ transport });
  const sdkIsLoading = sdkChat.status === "submitted" || sdkChat.status === "streaming";
  const sdkError = sdkChat.error;

  // ── LangGraph agent mode (agentic loop) ──
  const agentChat = useAgentChat(agent, extraTools);

  // ── Unified interface ──
  const isLoading = agentMode ? agentChat.isRunning : sdkIsLoading;

  // Convert agent messages to the format MessageList expects
  const displayMessages = agentMode
    ? agentChat.messages.map((m: AgentMessage) => ({
        id: m.id,
        role: m.role as string,
        content: m.content,
        parts: m.toolCalls
          ? [
              ...(m.content ? [{ type: "text" as const, text: m.content }] : []),
              ...m.toolCalls.map((tc) => ({
                type: "tool-invocation" as const,
                toolInvocation: {
                  toolCallId: tc.id,
                  toolName: tc.name,
                  args: tc.args,
                  state: "call" as const,
                },
              })),
            ]
          : [{ type: "text" as const, text: m.content }],
      }))
    : sdkChat.messages;

  async function handleSubmit(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setAttachedFiles([]);

    // Create thread on first message so it appears in sidebar
    if (!threadCreated) {
      const title = text.length > 50 ? text.slice(0, 50) + "…" : text;
      createThread(agent.id, title);
      setThreadCreated(true);
      // Notify other components (sidebar) about the storage change
      window.dispatchEvent(new Event("storage"));
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
