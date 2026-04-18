// ─── LangGraph Agent State ───────────────────────────────────────────────────
// Defines the shared state that flows through the agentic graph.
// Uses LangGraph's Annotation system with a messages reducer for
// accumulating conversation history across nodes.

import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Extend the built-in MessagesAnnotation with agent-specific metadata
export const AgentState = Annotation.Root({
  // Inherit the messages array with built-in reducer
  ...MessagesAnnotation.spec,

  // Agent identity — set once at graph entry, read by all nodes
  agentName: Annotation<string>,
  agentInstructions: Annotation<string>,
  agentModel: Annotation<string>,

  // Tool names the agent is allowed to use
  toolNames: Annotation<string[]>,

  // Current step in the execution loop (plan → act → observe → iterate)
  stepCount: Annotation<number>,
  maxSteps: Annotation<number>,

  // Final output flag — set by the router when done
  done: Annotation<boolean>,
});

export type AgentStateType = typeof AgentState.State;
export type AgentStateUpdate = typeof AgentState.Update;
