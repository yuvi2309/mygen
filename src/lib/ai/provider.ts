import { openai } from "@ai-sdk/openai";
import type { AgentModel } from "@/lib/types";

// ─── Provider Abstraction ───────────────────────────────────────────────────
// Thin layer over AI SDK providers. Swap or add providers here without
// changing consumers. Currently OpenAI-only; extend for Anthropic/Google later.

export function getModel(modelId: AgentModel) {
  return openai(modelId);
}


