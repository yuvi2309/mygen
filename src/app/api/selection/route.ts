import { generateText } from "ai";
import { z } from "zod/v4";
import { getModel } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";
import { AgentModelSchema, AgentToolSchema } from "@/lib/types";

const SelectionRequestSchema = z.object({
  selectedText: z.string().min(1).max(12000),
  question: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
  agent: z.object({
    name: z.string(),
    instructions: z.string().optional(),
    model: AgentModelSchema,
    tools: z.array(AgentToolSchema).default([]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(16000).default(4096),
  }),
});

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

  const parsed = SelectionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  const { selectedText, question, history, agent } = parsed.data;

  try {
    const model = getModel(agent.model);

    const result = await generateText({
      model,
      system: [
        `You are ${agent.name}.`,
        agent.instructions ?? "",
        "Answer using only the selected excerpt as context.",
        "If the answer is not supported by the excerpt, say so clearly.",
        "Be concise and useful.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      prompt: `Selected excerpt:\n"""\n${selectedText}\n"""\n\nBranch history:\n${history
        .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
        .join("\n") || "No previous branch messages."}\n\nQuestion: ${question}`,
      temperature: Math.min(agent.temperature, 0.7),
      maxOutputTokens: Math.min(agent.maxTokens, 1200),
    });

    return Response.json({ answer: result.text });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
