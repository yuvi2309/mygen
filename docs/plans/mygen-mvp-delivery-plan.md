# MyGen MVP Delivery Plan

## Goal

Ship a usable first platform that proves the wedge of portable agent-driven workflow automation.

## Phase 1 — Foundation

Scope:
- authentication
- workspace shell
- basic chat experience
- provider abstraction
- first agent schema

Deliverable:
A user can chat with one configured agent in a workspace.

## Phase 2 — Tool-Connected Value

Scope:
- tool abstraction layer
- web search
- document retrieval
- email drafting
- one internal action integration

Deliverable:
The agent can do useful work beyond answering questions.

## Phase 3 — Memory and Execution

Scope:
- short-term memory
- long-term retrieval
- async job runner
- retries
- timeouts
- execution status view

Deliverable:
The system supports longer tasks and repeatable usage.

## Phase 4 — Workflow and External Access

Scope:
- save prompt flows as workflows
- webhook trigger
- public API endpoint
- approval checkpoint
- execution logs

Deliverable:
Users can build once and run outside the main chat surface.

## Suggested Technical Boundaries

### Frontend
- app shell
- chat view
- agent settings
- workflow list
- execution history

### Domain Layer
- agent definitions
- workflow rules
- permissions
- memory policies
- run state

### Integration Layer
- model providers
- tool adapters
- external channels

### Infrastructure Layer
- database
- queue
- storage
- telemetry

## Risks to Control Early

- tool errors reducing trust
- high latency from multi-step execution
- runaway model cost
- unsafe write operations
- unclear onboarding for first-time users

## Definition of Done

The MVP is complete when a real user can automate a repeated task end-to-end and reuse it later.
