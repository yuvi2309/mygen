import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod/v4";
import { getModel, resolveTools } from "@/lib/ai";
import { AgentModelSchema, AgentToolSchema } from "@/lib/types";

// ─── Request Validation ─────────────────────────────────────────────────────

const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
  agent: z.object({
    name: z.string(),
    instructions: z.string().optional(),
    model: AgentModelSchema,
    tools: z.array(AgentToolSchema).default([]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(16000).default(4096),
  }),
});

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, agent } = parsed.data;

  const systemMessage = [
    `You are ${agent.name}.`,
    agent.instructions ?? "",
    "Be concise, helpful, and actionable.",
    "When using tools, briefly explain what you're doing.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const model = getModel(agent.model);
  const tools = resolveTools(agent.tools);

  const result = streamText({
    model,
    system: systemMessage,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    temperature: agent.temperature,
    maxOutputTokens: agent.maxTokens,
  });

  return result.toUIMessageStreamResponse();
}
