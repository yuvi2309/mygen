// ─── Chat Types ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolInvocations?: ToolInvocation[];
  createdAt?: Date;
}

export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "result" | "partial-call";
  result?: unknown;
}

export interface ChatThread {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
