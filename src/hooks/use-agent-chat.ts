"use client";

import { useState, useCallback, useRef } from "react";
import type { Agent, AgentTool } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  toolCallId?: string;
  toolName?: string;
  timestamp: Date;
}

export interface AgentChatState {
  messages: AgentMessage[];
  isRunning: boolean;
  currentNode: string | null;
  stepCount: number;
  error: string | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAgentChat(agent: Agent, extraTools: AgentTool[] = []) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isRunning) return;

      setError(null);
      setIsRunning(true);
      setStepCount(0);
      setCurrentNode(null);

      // Add user message
      const userMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Prepare request
      const requestMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
        ...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
      }));

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: requestMessages,
            agent: {
              name: agent.name,
              instructions: agent.instructions,
              model: agent.model,
              tools: agent.tools,
              temperature: agent.temperature,
              maxTokens: agent.maxTokens,
            },
            extraTools,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Agent request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr);
              handleSSEEvent(event, setMessages, setCurrentNode, setStepCount);
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled
        } else {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        setIsRunning(false);
        setCurrentNode(null);
        abortRef.current = null;
      }
    },
    [messages, isRunning, agent, extraTools]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setStepCount(0);
    setCurrentNode(null);
  }, []);

  return {
    messages,
    isRunning,
    currentNode,
    stepCount,
    error,
    sendMessage,
    stop,
    reset,
  };
}

// ─── SSE Event Handler ──────────────────────────────────────────────────────

function handleSSEEvent(
  event: Record<string, unknown>,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  setCurrentNode: React.Dispatch<React.SetStateAction<string | null>>,
  setStepCount: React.Dispatch<React.SetStateAction<number>>
) {
  const type = event.type as string;
  const node = event.node as string | undefined;

  if (node) setCurrentNode(node);

  switch (type) {
    case "text": {
      const content = event.content as string;
      if (!content) break;

      setMessages((prev) => {
        // If last message is an assistant message from the same node, append
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.toolCalls?.length) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + content },
          ];
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ];
      });
      break;
    }

    case "tool_calls": {
      const toolCalls = event.toolCalls as Array<{
        id: string;
        name: string;
        args: Record<string, unknown>;
      }>;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          toolCalls,
          timestamp: new Date(),
        },
      ]);
      break;
    }

    case "tool_result": {
      const content = event.content as string;
      const toolCallId = event.toolCallId as string | undefined;
      const toolName = event.name as string | undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "tool",
          content,
          toolCallId,
          toolName,
          timestamp: new Date(),
        },
      ]);
      break;
    }

    case "step": {
      const count = event.stepCount as number;
      setStepCount(count);
      break;
    }

    case "error": {
      // Error events are handled by the fetch catch
      break;
    }

    case "done":
      break;
  }
}
