import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

// ─── Provider Abstraction ───────────────────────────────────────────────────
// Multi-provider routing. Model IDs use the format "provider:model-name".
// Add new providers here without changing any consumers.
//
// Supported providers:
//   google   → GOOGLE_GENERATIVE_AI_API_KEY (free tier available)
//   groq     → GROQ_API_KEY (free tier, generous limits)
//   openai   → OPENAI_API_KEY
//
// Extend with anthropic, mistral, etc. by adding a new entry.

type ProviderFactory = (modelId: string) => ReturnType<typeof google> | ReturnType<typeof openai> | ReturnType<typeof groq>;

const providers: Record<string, ProviderFactory> = {
  google: (modelId) => google(modelId),
  groq: (modelId) => groq(modelId),
  openai: (modelId) => openai(modelId),
};

export function getModel(modelSpec: string) {
  const colonIndex = modelSpec.indexOf(":");
  if (colonIndex === -1) {
    // Legacy fallback: bare model names default to Google
    return google(modelSpec);
  }

  const provider = modelSpec.slice(0, colonIndex);
  const modelId = modelSpec.slice(colonIndex + 1);

  const factory = providers[provider];
  if (!factory) {
    throw new Error(
      `Unknown provider "${provider}". Supported: ${Object.keys(providers).join(", ")}`
    );
  }

  return factory(modelId);
}

/** Parse a "provider:model" spec into parts. */
export function parseModelSpec(modelSpec: string): { provider: string; modelId: string } {
  const colonIndex = modelSpec.indexOf(":");
  if (colonIndex === -1) {
    return { provider: "google", modelId: modelSpec };
  }
  return {
    provider: modelSpec.slice(0, colonIndex),
    modelId: modelSpec.slice(colonIndex + 1),
  };
}


