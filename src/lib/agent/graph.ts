// ─── LangGraph Agent Graph ──────────────────────────────────────────────────
// Compiles the agentic execution graph. This is the core of the system:
//
//   START → agent → (router) → tools → agent → ... → END
//
// The graph follows the plan-act-observe-iterate loop from the product spec.
// It supports configurable tools, models, and step limits per agent.

import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./state";
import { agentNode, createToolNode, shouldContinue } from "./nodes";

export interface AgentGraphConfig {
  agentName: string;
  agentInstructions?: string;
  agentModel: string;
  toolNames: string[];
  temperature?: number;
  maxSteps?: number;
}

/**
 * Build a compiled LangGraph agent for the given configuration.
 *
 * The graph shape:
 *   START → agent → conditional_edge(shouldContinue)
 *                     ├─ "tools" → toolNode → agent (loop)
 *                     └─ END
 *
 * Each invocation returns the full state including all messages.
 */
export function buildAgentGraph(config: AgentGraphConfig) {
  const toolNode = createToolNode(config.toolNames);

  const graph = new StateGraph(AgentState)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  // Compile with in-memory checkpointer for thread persistence
  const checkpointer = new MemorySaver();
  return graph.compile({ checkpointer });
}

/**
 * Convenience: build and invoke the agent graph in one call.
 * Returns all messages after execution completes.
 */
export async function runAgent(
  config: AgentGraphConfig,
  messages: import("@langchain/core/messages").BaseMessage[],
  threadId?: string
) {
  const app = buildAgentGraph(config);

  const result = await app.invoke(
    {
      messages,
      agentName: config.agentName,
      agentInstructions: config.agentInstructions ?? "",
      agentModel: config.agentModel,
      toolNames: config.toolNames,
      maxSteps: config.maxSteps ?? 10,
    },
    {
      configurable: { thread_id: threadId ?? crypto.randomUUID() },
    }
  );

  return result;
}

/**
 * Stream the agent graph execution, yielding state updates as they happen.
 * Used for real-time UI streaming.
 */
export async function* streamAgent(
  config: AgentGraphConfig,
  messages: import("@langchain/core/messages").BaseMessage[],
  threadId?: string
) {
  const app = buildAgentGraph(config);

  const stream = await app.stream(
    {
      messages,
      agentName: config.agentName,
      agentInstructions: config.agentInstructions ?? "",
      agentModel: config.agentModel,
      toolNames: config.toolNames,
      maxSteps: config.maxSteps ?? 10,
    },
    {
      configurable: { thread_id: threadId ?? crypto.randomUUID() },
      streamMode: "updates",
    }
  );

  for await (const update of stream) {
    yield update;
  }
}
