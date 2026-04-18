import { z } from "zod/v4";

// ─── Agent Schema ───────────────────────────────────────────────────────────

export const AgentModelSchema = z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"]);

export const AgentToolSchema = z.enum(["web_search", "document_reader"]);

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  purpose: z.string().max(500).optional(),
  instructions: z.string().max(5000).optional(),
  model: AgentModelSchema.default("gpt-4o-mini"),
  tools: z.array(AgentToolSchema).default([]),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(16000).default(4096),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentModel = z.infer<typeof AgentModelSchema>;
export type AgentTool = z.infer<typeof AgentToolSchema>;

// ─── Agent Creation ─────────────────────────────────────────────────────────

export const CreateAgentSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_AGENT: Agent = {
  id: "default",
  name: "MyGen Assistant",
  purpose: "A general-purpose AI assistant that can help with research, writing, and analysis.",
  instructions: "You are a helpful AI assistant. Be concise, accurate, and actionable. When using tools, explain what you're doing and why.",
  model: "gpt-4o-mini",
  tools: ["web_search"],
  temperature: 0.7,
  maxTokens: 4096,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
