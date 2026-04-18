import type { AgentTool } from "@/lib/types";

// ─── Client-Safe Metadata ───────────────────────────────────────────────────
// These constants are safe to import from client components.
// Tool and model execution logic lives in server-only files.

// Provider groupings for the model selector UI.
export interface ModelOption {
  id: string;        // "provider:model-name"
  label: string;
  provider: string;  // "google" | "openai" | "anthropic" etc.
  description: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Groq (free tier — fast inference) ────────────────────────────────────
  { id: "groq:llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "groq", description: "Powerful and free — recommended" },
  { id: "groq:llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "groq", description: "Ultra-fast, lightweight" },
  { id: "groq:mixtral-8x7b-32768", label: "Mixtral 8x7B", provider: "groq", description: "Strong reasoning, 32K context" },

  // ── Google (free tier) ──────────────────────────────────────────────────
  { id: "google:gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google", description: "Fast and free" },
  { id: "google:gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", provider: "google", description: "Lightest, lowest latency" },
  { id: "google:gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash (preview)", provider: "google", description: "Latest preview model" },

  // ── OpenAI ──────────────────────────────────────────────────────────────
  { id: "openai:gpt-4o", label: "GPT-4o", provider: "openai", description: "Most capable, higher cost" },
  { id: "openai:gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", description: "Fast and affordable" },
  { id: "openai:gpt-4.1", label: "GPT-4.1", provider: "openai", description: "Latest flagship model" },
  { id: "openai:gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", description: "Balanced speed and quality" },
  { id: "openai:gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "openai", description: "Fastest, lowest cost" },
];

/** Group models by provider for UI display. */
export const MODEL_PROVIDERS = [...new Set(MODEL_OPTIONS.map((m) => m.provider))];

export const TOOL_OPTIONS: { id: AgentTool; label: string; description: string }[] = [
  { id: "web_search", label: "Web Search", description: "Search the web for current information" },
  { id: "document_reader", label: "Document Reader", description: "Extract content from URLs" },
];
