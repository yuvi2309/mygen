import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod/v4";
import { getModel, resolveTools } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
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
  extraTools: z.array(AgentToolSchema).default([]),
});

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, agent, extraTools } = parsed.data;

  const systemMessage = [
    `You are ${agent.name}.`,
    agent.instructions ?? "",
    "Be concise, helpful, and actionable.",
    "When using tools, briefly explain what you're doing.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let model;
  try {
    model = getModel(agent.model);
  } catch (err) {
    return Response.json(
      { error: `Model error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  const allToolNames = [...new Set([...agent.tools, ...extraTools])];
  const tools = resolveTools(allToolNames as import("@/lib/types").AgentTool[]);

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
