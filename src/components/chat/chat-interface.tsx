"use client";

import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Agent } from "@/lib/types";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface ChatInterfaceProps {
  agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const [input, setInput] = useState("");

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
        },
      }),
    [agent]
  );

  const { messages, status, sendMessage, stop } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  async function handleSubmit(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  );
}
