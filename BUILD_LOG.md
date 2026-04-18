# MyGen — Build Log

This file documents every change made to the codebase, the reasoning behind architectural decisions, and the progression of the project step by step. Each entry corresponds to a commit and explains **what** was built, **why** it was built that way, and **how** each piece connects.

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
