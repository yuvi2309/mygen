import type { AgentModel, AgentTool } from "@/lib/types";

// ─── Client-Safe Metadata ───────────────────────────────────────────────────
// These constants are safe to import from client components.
// Tool and model execution logic lives in server-only files.

export const MODEL_OPTIONS: { id: AgentModel; label: string; description: string }[] = [
  { id: "gpt-4o", label: "GPT-4o", description: "Most capable, higher cost" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast and affordable" },
  { id: "gpt-4.1", label: "GPT-4.1", description: "Latest flagship model" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", description: "Balanced speed and quality" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", description: "Fastest, lowest cost" },
];

export const TOOL_OPTIONS: { id: AgentTool; label: string; description: string }[] = [
  { id: "web_search", label: "Web Search", description: "Search the web for current information" },
  { id: "document_reader", label: "Document Reader", description: "Extract content from URLs" },
];
