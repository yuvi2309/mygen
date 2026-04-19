# MyGen — Build Log

This file documents every change made to the codebase, the reasoning behind architectural decisions, and the progression of the project step by step. Each entry corresponds to a commit and explains **what** was built, **why** it was built that way, and **how** each piece connects.

---

## Commit 2 — Interactive Chat Workspace, Branching, and User-Scoped Memory

**Date:** April 19, 2026  
**Scope:** Advanced chat workflow upgrade — editable threads, forks, response sculpting, branch Q&A, structured rendering, and per-user workspace separation

### 1. What Was Added

This update turns the basic chat surface into a more useful AI workbench for iterative thinking and long-running conversations. The workspace now supports:

- **user-scoped persistence** so agents, chats, and message history can be isolated per workspace user
- **thread management tools** including pinning, archiving, bulk actions, tag editing, and thread forking
- **message-level controls** such as edit-and-resend, clear context, reset chat, and pinning important answers
- **selection-based workflows** where useful excerpts can be kept, trimmed down, or explored in side branches
- **structured output rendering** for JSON, markdown tables, HTML previews, and code blocks

### 2. Why This Matters

The original MVP allowed chat and agent creation, but it did not yet support how real users refine AI output over time. This release improves the product in three important ways:

1. **Better continuity** — users can keep valuable context without losing track of important messages.
2. **Safer experimentation** — users can fork threads or ask about a selected excerpt without polluting the main conversation.
3. **Improved usability at scale** — tagging, archiving, and per-user storage make the workspace more realistic for ongoing use.

### 3. Key Architectural Changes

#### Chat interaction layer

The main chat orchestration in the UI was expanded so thread state, message metadata, and selection-driven actions are all persisted together. This includes support for:

- saving message metadata such as pins, edits, curated selections, and branch conversations
- replaying edited prompts without keeping outdated downstream responses
- clearing active context while preserving the thread shell when needed

#### Store and persistence model

The local persistence layer now supports a richer workspace model:

- workspace users are stored separately and can be switched from the header
- threads now track archive state, pin state, tags, retention metadata, and fork lineage
- stored messages support branch nodes and curated excerpts as first-class data

This keeps the state model flexible enough for a future move to a database-backed implementation.

#### Presentation layer improvements

The conversation renderer now detects and formats structured content instead of showing everything as plain text. This makes tool output and AI responses much easier to inspect during real use.

### 4. Files Primarily Affected

- chat orchestration and persistence flow across the interactive workspace
- sidebar management for thread organization and bulk actions
- new selection API support for excerpt-specific branch answers
- new structured content renderer and user switcher surface

### 5. Quality Notes

This update stays aligned with the project direction by keeping AI integrations behind clear boundaries, validating request payloads for the new selection route, and preserving a path toward future multi-user and workflow expansion.

---

## Commit 1 — Phase 1 MVP: Chat UI, Agent Studio, AI Integration

**Date:** April 19, 2026
**Scope:** Full Phase 1 foundation — streaming chat, single-agent management, tool integration, workspace shell

---

### 1. What Was Built (Summary)

This commit delivers the first working version of MyGen — a multi-agent AI work platform. It includes:

- A **streaming chat UI** connected to OpenAI models via Vercel AI SDK v6
- An **Agent Studio** where users can create, edit, and delete custom AI agents
- **Tool integration** with Tavily (web search + document extraction)
- A **workspace shell** with sidebar navigation
- **Client-side persistence** using localStorage (placeholder for future database)

---

### 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.2.4 | App Router, server/client component model, API routes |
| Runtime | React | 19.2.4 | UI rendering with latest features |
| AI SDK | ai (Vercel) | 6.0.168 | LLM orchestration, streaming, tool calling |
| AI Provider | @ai-sdk/openai | 3.0.53 | OpenAI model integration |
| AI React | @ai-sdk/react | 3.0.170 | React hooks for chat (useChat) |
| Search | @tavily/core | 0.7.2 | Web search and URL content extraction |
| UI | shadcn/ui (radix-nova) | — | Accessible component primitives |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Validation | zod | 4.x | Schema validation (import from `zod/v4`) |
| Language | TypeScript | 5.x | Type safety |

**Key AI SDK v6 Breaking Changes (from v5):**
These are important to understand because they shaped many implementation decisions.

| What Changed | v5 (old) | v6 (new) |
|-------------|----------|----------|
| Tool schema property | `parameters` | `inputSchema` |
| Max steps | `maxSteps: 5` | `stopWhen: stepCountIs(5)` |
| Max tokens | `maxTokens` | `maxOutputTokens` |
| Stream response | `toDataStreamResponse()` | `toUIMessageStreamResponse()` |
| useChat return | `{ input, setInput, handleSubmit, isLoading }` | `{ messages, status, sendMessage, stop }` |
| useChat config | `useChat({ api, body })` | `useChat({ transport: new DefaultChatTransport({ api, body }) })` |
| Tool parts in messages | `part.type === "tool-invocation"` with `part.toolInvocation.toolCallId` | `part.type === "tool-<name>"` with `part.toolCallId` directly on part |
| Message conversion | `messages` passed directly | `await convertToModelMessages(messages)` |

---

### 3. Architecture Overview

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (metadata, fonts, global styles)
│   ├── page.tsx                  # Root redirect → /chat
│   ├── globals.css               # Tailwind + CSS custom properties (theme)
│   ├── (workspace)/              # Route group for workspace shell
│   │   ├── layout.tsx            # Workspace layout (sidebar + main area)
│   │   ├── page.tsx              # Workspace root redirect → /chat
│   │   ├── chat/
│   │   │   ├── page.tsx          # Default chat (uses DEFAULT_AGENT)
│   │   │   └── [agentId]/
│   │   │       └── page.tsx      # Agent-specific chat
│   │   └── agents/
│   │       ├── page.tsx          # Agent list
│   │       ├── new/
│   │       │   └── page.tsx      # Create agent form
│   │       └── [agentId]/
│   │           └── page.tsx      # Edit agent form
│   └── api/
│       └── chat/
│           └── route.ts          # Streaming chat POST endpoint
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx    # Main chat orchestrator
│   │   ├── message-list.tsx      # Message rendering + tool parts
│   │   ├── message-input.tsx     # Textarea + send/stop controls
│   │   └── tool-call-display.tsx # Tool invocation status cards
│   ├── agents/
│   │   ├── agent-form.tsx        # Create/edit agent form
│   │   └── agent-card.tsx        # Agent summary card
│   ├── workspace/
│   │   └── app-sidebar.tsx       # Navigation sidebar
│   └── ui/                       # shadcn primitives (button, card, dialog, etc.)
├── hooks/
│   ├── use-agents.ts             # Agent CRUD hook (wraps store)
│   └── use-mobile.ts             # Mobile detection hook
└── lib/
    ├── utils.ts                  # cn() className helper
    ├── store.ts                  # localStorage persistence layer
    ├── types/
    │   ├── agent.ts              # Agent schema + types (zod v4)
    │   ├── chat.ts               # Chat message + thread types
    │   └── index.ts              # Barrel export
    └── ai/
        ├── provider.ts           # OpenAI provider abstraction
        ├── tools.ts              # Tool registry (Tavily search + extract)
        ├── options.ts            # Client-safe model/tool metadata
        └── index.ts              # Barrel export
```

---

### 4. File-by-File Walkthrough

#### 4.1 Type System (`src/lib/types/`)

**`agent.ts`** — The core domain type for the entire application.

```typescript
// Uses zod v4 (imported as "zod/v4") for runtime validation + TypeScript inference
export const AgentModelSchema = z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"]);
export const AgentToolSchema = z.enum(["web_search", "document_reader"]);
```

**Why zod v4?** Next.js 16 + AI SDK v6 use zod v4 natively. The import path `zod/v4` is required (not just `zod`). Zod gives us:
- Runtime request validation in the API route
- TypeScript type inference via `z.infer<typeof Schema>`
- Single source of truth for both types and validation

The `Agent` type has:
- `id`, `name`, `purpose`, `instructions` — identity
- `model` — which LLM to use (constrained to supported models)
- `tools` — array of tool names the agent can use
- `temperature`, `maxTokens` — model behavior parameters
- `createdAt`, `updatedAt` — timestamps

`DEFAULT_AGENT` is a pre-built agent used when no specific agent is selected, so the app works immediately without setup.

**`chat.ts`** — Defines `ChatMessage`, `ToolInvocation`, and `ChatThread` interfaces. These are used for our local type references. The actual message types flowing through the AI SDK are `UIMessage` from the `ai` package.

**`index.ts`** — Barrel export so consumers can `import { Agent, AgentSchema } from "@/lib/types"` without knowing the internal file structure.

---

#### 4.2 AI Abstraction Layer (`src/lib/ai/`)

This is the most architecturally important layer. It separates AI provider details from the rest of the app.

**`provider.ts`** — A thin wrapper over the OpenAI provider:

```typescript
import { openai } from "@ai-sdk/openai";
export function getModel(modelId: AgentModel) {
  return openai(modelId);
}
```

**Why a wrapper?** When we add Anthropic, Google, or local models later, we only change this file. Every consumer calls `getModel()` without knowing which provider is behind it.

**`tools.ts`** — The tool registry. This is where AI SDK tools are defined.

Key design decisions:
1. **`inputSchema` not `parameters`**: AI SDK v6 renamed the property. Using `parameters` silently compiles but breaks at runtime.
2. **Lazy Tavily initialization**: `tavily()` requires an API key. If called at module top level, it crashes during Next.js static page generation (build time). Solution: lazy init with `getTvly()`.
3. **`resolveTools(toolNames)` returns `ToolSet`**: The function takes an array of tool name strings and returns only the tools that agent has enabled. This way each agent gets a different tool set.

```typescript
// WRONG (v5): parameters: z.object({...})
// RIGHT (v6): inputSchema: z.object({...})
const webSearchTool = tool({
  description: "...",
  inputSchema: z.object({ query: z.string(), maxResults: z.number().default(5) }),
  execute: async ({ query, maxResults }) => { /* Tavily search */ },
});
```

**`options.ts`** — Client-safe metadata arrays for models and tools. Why a separate file?

The problem: `tools.ts` imports `@tavily/core` which is server-only. If any client component imports from the barrel `@/lib/ai/index.ts`, the Tavily code leaks into the browser bundle and crashes. Solution: put the display metadata (model names, tool labels) in a separate file that has zero server dependencies. Client components import directly from `@/lib/ai/options`.

**`index.ts`** — Barrel export. The API route imports `getModel` and `resolveTools` from here. Client components NEVER import from this barrel — they import from `options.ts` directly.

---

#### 4.3 Persistence Layer (`src/lib/store.ts`)

A lightweight CRUD layer using `localStorage`. Marked `"use client"` because localStorage is browser-only.

Functions:
- `getAgents()` / `getAgent(id)` — Read agents, seeds DEFAULT_AGENT on first load
- `createAgent(input)` / `updateAgent(id, updates)` / `deleteAgent(id)` — Agent CRUD
- `getThreads(agentId?)` / `createThread(agentId, title)` / `deleteThread(id)` — Thread CRUD

**Why localStorage?** This is MVP. The store interface is deliberately simple so it can be swapped for Supabase/Postgres later without changing consumers. The `useAgents()` hook abstracts this — components never call `localStorage` directly.

---

#### 4.4 API Route (`src/app/api/chat/route.ts`)

The streaming chat endpoint. This is where the AI SDK magic happens.

**Request flow:**
1. Client sends `{ messages, agent }` via POST
2. Zod validates the request body
3. System prompt is assembled from the agent's name + instructions
4. `getModel()` gets the OpenAI model instance
5. `resolveTools()` maps agent's tool names to actual tool implementations
6. `streamText()` starts the LLM stream with tools enabled
7. `toUIMessageStreamResponse()` converts the stream to a format `useChat` understands

```typescript
const result = streamText({
  model,
  system: systemMessage,
  messages: await convertToModelMessages(messages),  // v6: async conversion
  tools,
  stopWhen: stepCountIs(5),      // v6: replaces maxSteps
  temperature: agent.temperature,
  maxOutputTokens: agent.maxTokens,  // v6: replaces maxTokens
});
return result.toUIMessageStreamResponse();  // v6: replaces toDataStreamResponse()
```

**`convertToModelMessages(messages)`** — In v6, raw UI messages must be converted to model messages before passing to `streamText`. This is an async operation.

**`stepCountIs(5)`** — Limits tool-call loops. Without this, an agent could call tools indefinitely. Each "step" is one LLM turn (including tool calls and their results).

---

#### 4.5 Chat Components (`src/components/chat/`)

**`chat-interface.tsx`** — The orchestrator. Connects the AI SDK to the UI.

```typescript
const transport = useMemo(
  () => new DefaultChatTransport({
    api: "/api/chat",
    body: { agent: { name, instructions, model, tools, temperature, maxTokens } },
  }),
  [agent]
);
const { messages, status, sendMessage, stop } = useChat({ transport });
```

**Why `DefaultChatTransport`?** In AI SDK v6, `useChat` no longer accepts `api` and `body` directly. Instead, you configure a transport object. `DefaultChatTransport` is the HTTP transport that sends messages to your API route.

**Why `useMemo` on transport?** The transport object has the agent config baked into `body`. If we create a new transport on every render, `useChat` would reinitialize. `useMemo` ensures it only recreates when the agent changes.

**Input state is managed locally** (`useState`), not by `useChat`. In v6, `useChat` no longer provides `input`/`setInput`/`handleSubmit`. You manage input yourself and call `sendMessage({ text })`.

**`status`** replaces `isLoading`. It's a union: `'submitted' | 'streaming' | 'ready' | 'error'`. We derive `isLoading` as `status === "submitted" || status === "streaming"`.

**`message-list.tsx`** — Renders the conversation. The trickiest part is tool rendering.

In AI SDK v6, message parts no longer use `part.type === "tool-invocation"` with a nested `part.toolInvocation` object. Instead:
- Static tools: `part.type === "tool-web_search"` (prefixed with `tool-`)
- Dynamic tools: `part.type === "dynamic-tool"` with `part.toolName`
- Properties like `toolCallId`, `state`, `input`, `output` are directly on the part object

```typescript
function isToolPart(part: { type: string }): boolean {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}
```

Tool states in v6:
- `"input-streaming"` — Arguments are still being generated
- `"input-available"` / `"call"` — Tool is being executed
- `"output-available"` — Tool returned a result
- `"error"` — Tool execution failed

We map these to simpler states for the display component: `"call"`, `"result"`, `"partial-call"`.

**`message-input.tsx`** — A textarea with Enter-to-send (Shift+Enter for newline) and send/stop buttons. Nothing unusual here — it receives callbacks from the parent.

**`tool-call-display.tsx`** — Shows tool invocation cards with:
- Tool icon and name
- Loading spinner (during execution) or success/error icons
- Search query or URL being read
- Result links (for web search results)

---

#### 4.6 Agent Studio (`src/components/agents/`)

**`agent-form.tsx`** — A comprehensive form for creating/editing agents:
- Name, purpose, instructions (identity section)
- Model selection (radio buttons with descriptions)
- Tool toggles (checkboxes)
- Temperature slider + max tokens input (parameters)

Uses `MODEL_OPTIONS` and `TOOL_OPTIONS` from `@/lib/ai/options` (client-safe import).

**`agent-card.tsx`** — Card component showing agent summary with Chat/Edit/Delete actions. The default agent can't be deleted (guard: `agent.id !== "default"`).

---

#### 4.7 Workspace Shell

**`src/app/(workspace)/layout.tsx`** — Server component that provides:
- `SidebarProvider` (manages sidebar open/close state)
- `AppSidebar` (navigation)
- `SidebarInset` (main content area with header + trigger button)

The `(workspace)` folder is a **route group** — it adds layout without affecting URLs. Routes like `/chat` and `/agents` all get the sidebar automatically.

**`src/components/workspace/app-sidebar.tsx`** — Client component with:
- Logo + brand link
- "New Chat" quick action
- Agent list (each links to `/chat/[agentId]`)
- "Create Agent" button
- "Manage Agents" footer link

Uses `useAgents()` to display the agent list dynamically.

---

#### 4.8 Pages (Route Components)

| Route | File | Type | Purpose |
|-------|------|------|---------|
| `/` | `app/page.tsx` | Server | Redirects to `/chat` |
| `/chat` | `app/(workspace)/chat/page.tsx` | Client | Default chat with `DEFAULT_AGENT` |
| `/chat/[agentId]` | `app/(workspace)/chat/[agentId]/page.tsx` | Client | Chat with specific agent |
| `/agents` | `app/(workspace)/agents/page.tsx` | Client | Agent list with delete |
| `/agents/new` | `app/(workspace)/agents/new/page.tsx` | Client | Create agent form |
| `/agents/[agentId]` | `app/(workspace)/agents/[agentId]/page.tsx` | Client | Edit agent form |

The chat pages use `getAgent(id)` from the store and pass the agent to `ChatInterface`. If the agent isn't found, they redirect to the fallback.

---

### 5. Data Flow

**Chat message lifecycle:**
```
User types message
  → MessageInput.onSubmit()
  → ChatInterface.handleSubmit()
  → setInput("") + sendMessage({ text })
  → useChat sends POST to /api/chat with { messages, agent }
  → route.ts validates, builds system prompt
  → streamText() calls OpenAI with tools
  → If tool needed: OpenAI returns tool call → SDK executes tool → feeds result back → OpenAI continues
  → Stream chunks flow back via toUIMessageStreamResponse()
  → useChat updates messages state
  → MessageList re-renders with new parts (text + tool results)
```

**Agent CRUD lifecycle:**
```
User fills AgentForm
  → onSave(input) called
  → useAgents().createAgent(input) or updateAgent(id, input)
  → store.ts writes to localStorage
  → hook refreshes state
  → Router navigates to /chat/[agentId]
```

---

### 6. Environment Setup

Required `.env.local`:
```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

Both keys are validated at runtime (not build time, thanks to lazy initialization).

---

### 7. What's Next (Phase 2 Preview)

According to the MVP delivery plan:
- **Supabase integration** — Replace localStorage with real database
- **Thread persistence** — Save chat history across sessions
- **Memory system** — Agents remember context across conversations
- **More tools** — Code execution, file upload, etc.
- **Observability** — Token usage tracking, error monitoring

---

## Commit 2 — Multi-Provider Architecture, LangGraph Agent Backbone, Chat & Sidebar Fixes

**Date:** April 19, 2026  
**Scope:** Multi-provider LLM support (Groq, Google, OpenAI), LangGraph agent graph, dual-mode chat, thread persistence in sidebar, error surfacing, UI polish

---

### 1. What Was Built (Summary)

This commit adds:

- **Multi-provider model routing** — Models use `provider:model` format (e.g., `groq:llama-3.3-70b-versatile`). Provider layer routes to Groq, Google, or OpenAI.
- **Groq as default free provider** — Free tier with generous limits, no credit card required. Replaces Google Gemini (quota issues).
- **LangGraph agent backbone** — A LangGraph-based execution graph for agentic workflows with tool calling, separate from the AI SDK streaming chat.
- **Dual-mode chat** — ChatInterface supports both AI SDK streaming mode and LangGraph agent mode, switchable per-agent.
- **Thread creation + sidebar visibility** — Threads are created on first message and the sidebar reactively updates via storage events.
- **Error surfacing** — API errors are caught and displayed in the chat UI instead of silently failing.
- **Chat input redesign** — Input bar restructured to container layout (textarea on top, action buttons in bottom toolbar row).

---

### 2. New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@ai-sdk/groq` | ^2.0.7 | Groq provider for AI SDK |
| `@ai-sdk/google` | ^2.1.6 | Google Gemini provider for AI SDK |
| `@langchain/langgraph` | ^1.2.9 | Graph-based agent orchestration |
| `@langchain/openai` | ^0.5.17 | LangChain ChatOpenAI (also used for Groq via custom baseURL) |
| `@langchain/google-genai` | ^0.2.14 | LangChain Google Gemini integration |
| `@langchain/core` | ^0.3.55 | LangChain base types and utilities |

---

### 3. Architecture Changes

#### 3.1 Multi-Provider Model Routing (`src/lib/ai/provider.ts`)

Model IDs changed from bare strings (`"gpt-4o"`) to `provider:model` format (`"openai:gpt-4o"`). This enables:
- Seamless provider switching without code changes
- Easy addition of new providers (just add a factory function)
- Clear identification of which API key is needed

```typescript
const providers: Record<string, ProviderFactory> = {
  google: (modelId) => google(modelId),
  groq:   (modelId) => groq(modelId),
  openai: (modelId) => openai(modelId),
};
```

The `getModel(modelSpec)` function parses the spec and delegates to the right provider. Legacy bare model names fall back to Google for backward compatibility.

`parseModelSpec()` utility splits `"provider:model"` for use in UI components and metadata lookups.

#### 3.2 Agent Type Changes (`src/lib/types/agent.ts`)

- `AgentModel` changed from `z.enum(["gpt-4o", ...])` to `z.string().min(1)` — supports any `provider:model` string
- Default agent model: `"groq:llama-3.3-70b-versatile"`

#### 3.3 Model Options (`src/lib/ai/options.ts`)

`ModelOption` interface gained a `provider` field. Models are grouped by provider:
- **Groq** (3 models) — Llama 3.3 70B (recommended), Llama 3.1 8B, Mixtral 8x7B
- **Google** (3 models) — Gemini 2.0 Flash variants
- **OpenAI** (5 models) — GPT-4o family + 4.1 series

`MODEL_PROVIDERS` is derived for grouped UI rendering.

#### 3.4 LangGraph Agent Graph (`src/lib/agent/`)

New directory with four files implementing the agent execution graph:

**`state.ts`** — Defines `AgentStateType` using LangGraph's `Annotation` system:
- `messages` (with `messagesStateReducer` for append semantics)
- `agentName`, `agentInstructions`, `agentModel`, `toolNames` — agent config
- `stepCount`, `maxSteps` — execution limits

**`nodes.ts`** — Three graph nodes:
- `agentNode` — Calls LLM with system prompt and tool bindings, returns new message
- `createToolNode(toolNames)` — LangGraph `ToolNode` that executes tool calls
- `shouldContinue(state)` — Router: go to `"tools"` if last message has tool calls, else `"__end__"`

The model factory supports Groq via `ChatOpenAI` with custom `baseURL: "https://api.groq.com/openai/v1"` — Groq's API is OpenAI-compatible.

**`tools.ts`** — Converts AI SDK tool definitions to LangChain `DynamicStructuredTool` instances. Also exports `getAvailableToolNames()`.

**`graph.ts`** — Assembles the full graph:
```
__start__ → agent → shouldContinue → tools → agent → ... → __end__
```
Configurable via `AgentGraphConfig`: model, tools, instructions, max steps, temperature.

#### 3.5 Dual-Mode Chat (`src/components/chat/chat-interface.tsx`)

The `ChatInterface` component now supports two modes:

1. **SDK mode** (default) — Uses AI SDK `useChat` with `DefaultChatTransport` for streaming. Good for simple request/response flows.
2. **Agent mode** — Uses the custom `useAgentChat` hook which calls the LangGraph graph via `/api/agent/chat`. Supports multi-step tool calling with step count tracking.

The mode is selectable in the UI. Both modes share the same `MessageList` and `MessageInput` components.

**New state:**
- `threadCreated` — Tracks whether a thread has been created for the current conversation
- `sdkError` — Displays API errors in a red banner

**Thread creation:**
On first message, `handleSubmit` calls `createThread(agent.id, title)` and dispatches a `storage` event so the sidebar updates immediately.

#### 3.6 Agent Chat API (`src/app/api/agent/chat/route.ts`)

New endpoint for LangGraph agent execution. Receives `{ messages, agent, extraTools }`, builds the graph config, invokes the graph, and returns the full message history.

#### 3.7 Thread Persistence + Sidebar Reactivity

**`src/hooks/use-threads.ts`** — New hook for thread CRUD. Listens for `storage` events so the sidebar updates when threads are created from the chat page.

**`src/components/workspace/app-sidebar.tsx`** — Enhanced with:
- Collapsible "Chats" section showing conversation threads
- Thread delete functionality
- `useThreads()` integration for reactive updates

#### 3.8 Error Handling (`src/app/api/chat/route.ts`)

Added try-catch around:
- JSON body parsing
- Model creation (catches invalid provider specs)
- Stream creation (catches API errors like 429 rate limits)

Returns structured error responses: `{ error: "message" }` with appropriate HTTP status codes.

---

### 4. Environment Setup

Required `.env.local`:
```env
# Groq — free, recommended (https://console.groq.com/keys)
GROQ_API_KEY=gsk_...

# Google Gemini — free tier (https://aistudio.google.com/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# OpenAI — paid (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Tavily — search tool (https://tavily.com)
TAVILY_API_KEY=tvly-...
```

Only one LLM provider key is needed. Groq recommended for free tier.

---

### 5. Files Changed (17 modified, 7 new)

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/ai/provider.ts` | **Modified** | Multi-provider routing with google/groq/openai factories |
| `src/lib/ai/options.ts` | **Modified** | ModelOption interface + provider field, Groq models added |
| `src/lib/ai/index.ts` | **Modified** | Exports parseModelSpec, MODEL_PROVIDERS |
| `src/lib/types/agent.ts` | **Modified** | AgentModel → z.string(), default → groq |
| `src/app/api/chat/route.ts` | **Modified** | Error handling (try-catch, structured errors) |
| `src/components/chat/chat-interface.tsx` | **Modified** | Dual-mode (SDK + agent), thread creation, error display |
| `src/components/chat/message-input.tsx` | **Modified** | Redesigned layout (textarea + toolbar row) |
| `src/components/agents/agent-form.tsx` | **Modified** | Grouped model selector by provider |
| `src/components/workspace/app-sidebar.tsx` | **Modified** | Chats section with threads, collapsible groups |
| `src/app/(workspace)/chat/page.tsx` | **Modified** | Supports agent mode toggle |
| `src/app/(workspace)/chat/[agentId]/page.tsx` | **Modified** | Supports agent mode toggle |
| `package.json` | **Modified** | Added @ai-sdk/groq, @ai-sdk/google, @langchain/* deps |
| `src/lib/agent/state.ts` | **New** | LangGraph state definition (Annotation-based) |
| `src/lib/agent/nodes.ts` | **New** | Agent, tool, and router nodes |
| `src/lib/agent/tools.ts` | **New** | LangChain tool adapter |
| `src/lib/agent/graph.ts` | **New** | Graph assembly with configurable agent |
| `src/app/api/agent/chat/route.ts` | **New** | LangGraph agent chat endpoint |
| `src/hooks/use-agent-chat.ts` | **New** | React hook for agent-mode chat |
| `src/hooks/use-threads.ts` | **New** | Thread CRUD hook with storage event listener |

---

### 6. Data Flow (Agent Mode)

```
User types message
  → MessageInput.onSubmit()
  → ChatInterface.handleSubmit()
  → createThread() on first message, dispatch storage event
  → useAgentChat.sendMessage(text)
  → POST /api/agent/chat with { messages, agent, extraTools }
  → buildAgentGraph(config) assembles state → agent → shouldContinue → tools → agent loop
  → Graph invokes LLM (Groq/Google/OpenAI via LangChain)
  → If tool call: ToolNode executes → result fed back → agent continues
  → Returns final messages array
  → useAgentChat updates state
  → MessageList renders messages + tool call displays
  → Sidebar picks up new thread via storage event listener
```

---

### 7. Recommended Next Focus

To stay aligned with the product vision, the next work should prioritize reliability and repeat usage over more platform breadth.

1. **Persist full thread history and agent memory** — Move from demo chat to reusable work by saving messages, task context, and useful outcomes.
2. **Ship one opinionated workflow template** — Pick a wedge such as research-to-brief or client follow-up and make it excellent end to end.
3. **Add run visibility and approval controls** — Show step history, failures, retries, and simple human approval for sensitive actions.
4. **Migrate to Supabase after the data model is stable** — Replace localStorage once threads, runs, and memory shape are validated in usage.
5. **Avoid premature breadth** — Hold off on many more providers, a broad workflow builder, or lots of integrations until one repeated job clearly works.

---

## Commit 3 — Thread Message Persistence, URL-Addressable Threads, Vision Tightening

**Date:** April 19, 2026
**Scope:** Full thread message save/restore, URL-addressable thread pages, sidebar thread links, agent display message fixes, product vision update

---

### 1. What Was Built (Summary)

This commit closes the first item from the recommended next-focus list: **persistent thread history**. Conversations are now saved and restored across page loads.

- **Thread message persistence** — Messages are saved per-thread in localStorage (debounced auto-save) and restored when re-opening a thread.
- **URL-addressable threads** — New route `/chat/t/[threadId]` loads a thread by ID with its full history. URLs update silently on thread creation so refreshes work.
- **Sidebar thread links** — Thread items in the sidebar now link to `/chat/t/[threadId]` with active-state highlighting.
- **Agent mode display fix** — Tool call messages in LangGraph agent mode now use the correct AI SDK v6 part format (`dynamic-tool` with `state: "input-available"`) and filter out raw tool-result messages.
- **Product vision tightened** — Spec and build log updated to focus on proving one repeated workflow before expanding platform breadth.

---

### 2. Architecture Changes

#### 2.1 Thread Message Store (`src/lib/store.ts`)

New functions:
- `getMessages(threadId)` — Reads messages from `localStorage` key `mygen_thread_msgs_{threadId}`
- `saveMessages(threadId, messages)` — Writes messages and touches `updatedAt` on the thread
- `updateThread(id, updates)` — Partial update for thread metadata
- `getThread(id)` — Fetch a single thread by ID
- `deleteThread(id)` — Now also cleans up the thread's message storage key

Messages are stored separately per thread (not inside the thread object) so loading the thread list stays fast.

**New type:** `StoredMessage` — serializable message format with `id`, `role`, `content`, `toolCalls`, `parts`, and `createdAt`.

#### 2.2 Chat Interface Persistence (`src/components/chat/chat-interface.tsx`)

New props: `threadId`, `initialMessages`

**Serialization layer** — Four helper functions convert between:
- `UIMessage` (AI SDK) ↔ `StoredMessage` (localStorage)
- `AgentMessage` (LangGraph hook) ↔ `StoredMessage`

**Auto-save** — `useEffect` watches message arrays in both SDK and agent mode. Saves are debounced (500ms) to avoid writing on every streaming token.

**Thread creation** — On first message, creates a thread, sets `activeThreadId`, and calls `window.history.replaceState()` to update the URL to `/chat/t/{id}` without triggering a Next.js navigation (which would remount the component and lose in-flight messages).

**Agent mode display** — Tool call parts now use `type: "dynamic-tool"` with `state: "input-available"` (correct AI SDK v6 format). Raw tool-result messages (`role: "tool"`) are filtered out of the display list.

#### 2.3 Thread Page (`src/app/(workspace)/chat/t/[threadId]/page.tsx`)

New route component. Loads thread metadata + messages from the store, resolves the agent, and renders `ChatInterface` with `threadId` and `initialMessages`. Redirects to `/chat` if the thread is not found.

#### 2.4 Sidebar Thread Links (`src/components/workspace/app-sidebar.tsx`)

Thread links changed from `/chat/{agentId}` to `/chat/t/{threadId}`. Added `isActive` prop based on current pathname for visual highlighting.

#### 2.5 Agent Chat Hook (`src/hooks/use-agent-chat.ts`)

Now accepts optional `initialMessages` parameter to hydrate state on mount.

#### 2.6 API Schema Fix (`src/app/api/agent/chat/route.ts`)

Changed `z.record(z.any())` to `z.record(z.string(), z.any())` for zod v4 compatibility (v4 requires explicit key type in records).

---

### 3. Files Changed (7 modified, 1 new)

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/store.ts` | **Modified** | Added `getMessages`, `saveMessages`, `updateThread`, `getThread`, `StoredMessage` type |
| `src/components/chat/chat-interface.tsx` | **Modified** | Thread persistence, auto-save, URL update, agent display fix |
| `src/hooks/use-agent-chat.ts` | **Modified** | Accept `initialMessages` parameter |
| `src/app/api/agent/chat/route.ts` | **Modified** | zod v4 record schema fix |
| `src/components/workspace/app-sidebar.tsx` | **Modified** | Thread links → `/chat/t/{id}`, active state |
| `docs/specs/mygen-product-spec.md` | **Modified** | Vision, wedge, and MVP scope tightened |
| `BUILD_LOG.md` | **Modified** | Added this entry + updated next-focus list |
| `src/app/(workspace)/chat/t/[threadId]/page.tsx` | **New** | URL-addressable thread page |

---

### 4. Data Flow (Thread Persistence)

```
New conversation:
  User sends first message
    → handleSubmit creates thread via createThread()
    → setActiveThreadId(thread.id)
    → window.history.replaceState → URL becomes /chat/t/{threadId}
    → useEffect fires on messages change → debounced saveMessages()

Returning to thread:
  User clicks thread in sidebar → navigates to /chat/t/{threadId}
    → ThreadChatPage loads thread + messages from store
    → Passes threadId + initialMessages to ChatInterface
    → ChatInterface hydrates useChat/useAgentChat with initial messages
    → Conversation continues from where it left off
```

---

### 5. Product Vision Update

The product spec and recommended focus were tightened:
- **Overview** now emphasizes repeatable outcomes over platform breadth
- **Vision** narrowed to "prove one repeated workflow" before expanding
- **Wedge** simplified to five concrete use cases
- **MVP scope** reworded to prioritize saved history, persisted context, and approval checkpoints before external triggers
