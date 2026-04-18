"use client";

import { useRef, useEffect } from "react";
import { Bot, User } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { ToolCallDisplay } from "./tool-call-display";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

function isToolPart(part: { type: string }): boolean {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function getToolName(part: { type: string }): string {
  if (part.type === "dynamic-tool") {
    return (part as unknown as { toolName: string }).toolName;
  }
  // type is "tool-<name>"
  return part.type.replace(/^tool-/, "");
}

function getToolState(part: Record<string, unknown>): "call" | "result" | "partial-call" {
  const state = part.state as string;
  if (state === "output-available" || state === "error") return "result";
  if (state === "input-streaming") return "partial-call";
  return "call"; // input-available, approval-requested, etc.
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="font-medium text-lg">Start a conversation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ask a question, request research, or give a task.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {message.role === "user" ? "You" : "Agent"}
              </p>
              {message.parts?.map((part, i) => {
                if (part.type === "text" && part.text) {
                  return (
                    <div
                      key={i}
                      className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words"
                    >
                      {part.text}
                    </div>
                  );
                }
                if (isToolPart(part)) {
                  const p = part as Record<string, unknown>;
                  return (
                    <ToolCallDisplay
                      key={p.toolCallId as string}
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
          </div>
        ))}

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
