import { z } from "zod/v4";

// ─── Agent Schema ───────────────────────────────────────────────────────────
// Model IDs follow the format "provider:model-name" to support multi-provider.
// Examples: "google:gemini-2.0-flash", "openai:gpt-4o-mini", "anthropic:claude-sonnet-4"

export const AgentModelSchema = z.string().min(1);

export const AgentToolSchema = z.enum(["web_search", "document_reader"]);
export const AgentModeSchema = z.enum(["single", "council"]);
export const CouncilSynthesisStyleSchema = z.enum(["balanced", "critical", "action"]);

export const CouncilExpertSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(120),
  instructions: z.string().max(1000).optional(),
});

export const CouncilConfigSchema = z.object({
  authorityName: z.string().min(1).max(100).default("Council Lead"),
  rounds: z.number().int().min(1).max(3).default(2),
  synthesisStyle: CouncilSynthesisStyleSchema.default("balanced"),
  experts: z.array(CouncilExpertSchema).min(2).max(6),
});

const AgentBaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  purpose: z.string().max(500).optional(),
  instructions: z.string().max(5000).optional(),
  model: AgentModelSchema.default("groq:llama-3.3-70b-versatile"),
  tools: z.array(AgentToolSchema).default([]),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(16000).default(4096),
  mode: AgentModeSchema.default("single"),
  council: CouncilConfigSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AgentSchema = AgentBaseSchema.superRefine((value, ctx) => {
  if (value.mode === "council" && (!value.council || value.council.experts.length < 2)) {
    ctx.addIssue({
      code: "custom",
      path: ["council"],
      message: "Council mode requires at least two experts.",
    });
  }
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentModel = z.infer<typeof AgentModelSchema>;
export type AgentTool = z.infer<typeof AgentToolSchema>;
export type AgentMode = z.infer<typeof AgentModeSchema>;
export type CouncilExpert = z.infer<typeof CouncilExpertSchema>;
export type CouncilConfig = z.infer<typeof CouncilConfigSchema>;

// ─── Agent Creation ─────────────────────────────────────────────────────────

export const CreateAgentSchema = AgentBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).superRefine((value, ctx) => {
  if (value.mode === "council" && (!value.council || value.council.experts.length < 2)) {
    ctx.addIssue({
      code: "custom",
      path: ["council"],
      message: "Council mode requires at least two experts.",
    });
  }
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_COUNCIL_EXPERTS: CouncilExpert[] = [
  {
    id: "strategist",
    name: "Strategist",
    role: "Product and market strategist",
    instructions: "Clarify the goal, user value, trade-offs, and upside.",
  },
  {
    id: "critic",
    name: "Critic",
    role: "Risk and failure analyst",
    instructions: "Challenge weak assumptions, point out risks, and test the logic.",
  },
  {
    id: "operator",
    name: "Operator",
    role: "Execution and delivery lead",
    instructions: "Turn the idea into practical steps, sequencing, and action.",
  },
];

export const DEFAULT_COUNCIL_CONFIG: CouncilConfig = {
  authorityName: "Council Lead",
  rounds: 2,
  synthesisStyle: "action",
  experts: DEFAULT_COUNCIL_EXPERTS,
};

export const DEFAULT_AGENT: Agent = {
  id: "default",
  name: "MyGen Assistant",
  purpose: "A general-purpose AI assistant that can help with research, writing, and analysis.",
  instructions: "You are a helpful AI assistant. Be concise, accurate, and actionable. When using tools, explain what you're doing and why.",
  model: "groq:llama-3.3-70b-versatile",
  tools: ["web_search"],
  temperature: 0.7,
  maxTokens: 4096,
  mode: "single",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
