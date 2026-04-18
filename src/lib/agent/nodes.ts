// ─── LangGraph Agent Nodes ──────────────────────────────────────────────────
// Individual nodes in the agent execution graph.
// Each node reads from AgentState, performs work, and returns a partial update.

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AgentStateType } from "./state";
import { resolveLangChainTools } from "./tools";

// ─── Model Factory ──────────────────────────────────────────────────────────
// Parses "provider:model" spec and returns the right LangChain chat model.
// Add new providers here as they're needed.
// Groq uses OpenAI-compatible API, so we use ChatOpenAI with a custom base URL.

function createModel(modelSpec: string, temperature: number = 0.7) {
  const colonIndex = modelSpec.indexOf(":");
  const provider = colonIndex === -1 ? "groq" : modelSpec.slice(0, colonIndex);
  const modelId = colonIndex === -1 ? modelSpec : modelSpec.slice(colonIndex + 1);

  switch (provider) {
    case "groq":
      return new ChatOpenAI({
        model: modelId,
        temperature,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        },
      });
    case "google":
      return new ChatGoogleGenerativeAI({ model: modelId, temperature });
    case "openai":
      return new ChatOpenAI({ model: modelId, temperature });
    default:
      throw new Error(
        `Unknown LangChain provider "${provider}". Supported: groq, google, openai`
      );
  }
}

// ─── Agent Node ─────────────────────────────────────────────────────────────
// Calls the LLM with the current messages and bound tools.
// Returns the model response as a new message appended to state.

export async function agentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages, agentModel, agentInstructions, agentName, toolNames, stepCount } = state;

  const model = createModel(agentModel);
  const tools = resolveLangChainTools(toolNames);

  // Bind tools to model so it can generate tool calls
  const boundModel = tools.length > 0 ? model.bindTools(tools) : model;

  // Build system prompt
  const systemContent = [
    `You are ${agentName}.`,
    agentInstructions || "",
    "Be concise, helpful, and actionable.",
    "When using tools, briefly explain what you're doing.",
    tools.length > 0
      ? `You have access to these tools: ${toolNames.join(", ")}. Use them when they would help answer the user's question.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  // Prepend system message if not already present
  const systemMessage = { role: "system" as const, content: systemContent };

  const response = await boundModel.invoke([systemMessage, ...messages]);

  return {
    messages: [response],
    stepCount: stepCount + 1,
  };
}

// ─── Tool Executor Node ─────────────────────────────────────────────────────
// Uses LangGraph's built-in ToolNode to execute tool calls from the last
// AI message. Returns tool result messages appended to state.

export function createToolNode(toolNames: string[]) {
  const tools = resolveLangChainTools(toolNames);
  return new ToolNode(tools);
}

// ─── Router ─────────────────────────────────────────────────────────────────
// Decides the next step after the agent node:
// - If the LLM returned tool calls → route to "tools"
// - If max steps reached → route to END
// - Otherwise → route to END (agent is done)

export function shouldContinue(
  state: AgentStateType
): "tools" | "__end__" {
  const { messages, stepCount, maxSteps } = state;

  // Safety: enforce step limit
  if (stepCount >= maxSteps) {
    return "__end__";
  }

  // Check the last message for tool calls
  const lastMessage = messages[messages.length - 1];

  if (
    lastMessage &&
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    return "tools";
  }

  return "__end__";
}
