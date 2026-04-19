// ─── LangGraph Agent Chat Route ─────────────────────────────────────────────
// POST /api/agent/chat
//
// This route uses LangGraph to run a full agentic loop:
//   plan → act (tool calls) → observe → iterate → respond
//
// It streams node-level updates back to the client as SSE events,
// so the UI can show tool execution progress in real time.

import { z } from "zod/v4";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { streamAgent, type AgentGraphConfig } from "@/lib/agent";
import { AgentModelSchema, AgentToolSchema } from "@/lib/types";

// ─── Request Schema ─────────────────────────────────────────────────────────

const AgentChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool"]),
      content: z.string(),
      toolCallId: z.string().optional(),
      toolCalls: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            args: z.record(z.string(), z.any()),
          })
        )
        .optional(),
    })
  ),
  agent: z.object({
    name: z.string(),
    instructions: z.string().optional(),
    model: AgentModelSchema,
    tools: z.array(AgentToolSchema).default([]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(16000).default(4096),
  }),
  extraTools: z.array(AgentToolSchema).default([]),
  threadId: z.string().optional(),
  maxSteps: z.number().min(1).max(20).default(10),
});

// ─── Message Conversion ─────────────────────────────────────────────────────

function toLangChainMessages(
  messages: z.infer<typeof AgentChatRequestSchema>["messages"]
) {
  return messages.map((m) => {
    switch (m.role) {
      case "user":
        return new HumanMessage(m.content);
      case "assistant":
        if (m.toolCalls && m.toolCalls.length > 0) {
          return new AIMessage({
            content: m.content,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
            })),
          });
        }
        return new AIMessage(m.content);
      case "system":
        return new SystemMessage(m.content);
      case "tool":
        return new ToolMessage({
          content: m.content,
          tool_call_id: m.toolCallId ?? "",
        });
      default:
        return new HumanMessage(m.content);
    }
  });
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = AgentChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, agent, extraTools, threadId, maxSteps } = parsed.data;

  // Merge agent tools + extra tools
  const allToolNames = [...new Set([...agent.tools, ...extraTools])];

  const config: AgentGraphConfig = {
    agentName: agent.name,
    agentInstructions: agent.instructions,
    agentModel: agent.model,
    toolNames: allToolNames,
    maxSteps,
  };

  const langchainMessages = toLangChainMessages(messages);

  // Stream response as SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const update of streamAgent(
          config,
          langchainMessages,
          threadId
        )) {
          // Each update is { nodeName: { messages: [...], ...stateUpdates } }
          const event = formatSSEUpdate(update);
          controller.enqueue(encoder.encode(event));
        }

        // Signal completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ─── SSE Formatting ─────────────────────────────────────────────────────────

function formatSSEUpdate(update: Record<string, unknown>): string {
  const events: string[] = [];

  for (const [nodeName, nodeState] of Object.entries(update)) {
    const state = nodeState as Record<string, unknown>;
    const messages = state.messages as Array<{
      content: unknown;
      tool_calls?: unknown[];
      _getType?: () => string;
    }> | undefined;

    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        const msgType =
          typeof msg._getType === "function" ? msg._getType() : "unknown";

        if (msgType === "ai") {
          const aiMsg = msg as {
            content: string;
            tool_calls?: Array<{
              id: string;
              name: string;
              args: Record<string, unknown>;
            }>;
          };

          // AI response text
          if (aiMsg.content) {
            events.push(
              `data: ${JSON.stringify({
                type: "text",
                node: nodeName,
                content: aiMsg.content,
              })}\n\n`
            );
          }

          // Tool calls initiated by the AI
          if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
            events.push(
              `data: ${JSON.stringify({
                type: "tool_calls",
                node: nodeName,
                toolCalls: aiMsg.tool_calls.map((tc) => ({
                  id: tc.id,
                  name: tc.name,
                  args: tc.args,
                })),
              })}\n\n`
            );
          }
        } else if (msgType === "tool") {
          const toolMsg = msg as {
            content: string;
            tool_call_id?: string;
            name?: string;
          };
          events.push(
            `data: ${JSON.stringify({
              type: "tool_result",
              node: nodeName,
              toolCallId: toolMsg.tool_call_id,
              name: toolMsg.name,
              content: toolMsg.content,
            })}\n\n`
          );
        }
      }
    }

    // Also emit step count updates
    if ("stepCount" in state) {
      events.push(
        `data: ${JSON.stringify({
          type: "step",
          node: nodeName,
          stepCount: state.stepCount,
        })}\n\n`
      );
    }
  }

  return events.join("");
}
