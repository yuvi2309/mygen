# MyGen Product Specification

## 1. Overview

MyGen is an AI work platform for small teams that need repeatable outcomes, not just chat. Users create specialized agents, connect approved tools, preserve useful context, and reuse successful runs across chat and lightweight automations.

The product is not trying to win as a generic chatbot. It is trying to become the operating layer for recurring knowledge work that teams want to run again and again with more speed, consistency, and visibility.

## 2. Problem

Most AI products are strong at answering questions but weak at operational execution. Users can chat, but they cannot reliably:

- connect AI to daily tools
- persist context across tasks
- reuse successful workflows
- coordinate multiple agents
- deploy agents outside a single app

This creates fragmented prompt usage rather than durable systems.

## 3. Vision

Help users turn one repeated workflow into a reliable AI-assisted system they can trust.

Near-term, MyGen should make high-value work like research, drafting, follow-up, and coordination repeatable, observable, and easy to reuse. Long-term, agents should be portable across chat, API, and event-driven channels, but the first proof point is dependable recurring work inside the product.

## 4. Product Wedge

The initial wedge is repeated execution workflows for founders, operators, agencies, and lean teams.

High-value starting use cases:
- research to brief
- proposal and report generation
- customer and client follow-ups
- support triage
- sales and operations coordination

## 5. Target Users

### Primary
- founders
- operators
- agencies
- customer success teams
- revenue operations teams
- small and mid-sized teams

### Secondary
- product teams
- developers
- internal automation builders

## 6. Core Value Proposition

MyGen gives users a structured way to turn repeated work into reusable agent systems with memory, tools, workflows, and external access.

Core promise:

**Build an agent once, use it anywhere.**

## 7. Product Principles

- portability over novelty
- action over pure conversation
- safe autonomy with approvals
- strong observability
- model-agnostic architecture
- cost-aware execution
- fast time to first value

## 8. Core System Primitives

| Primitive | Meaning |
|---|---|
| Agent | A reusable AI worker with a goal, instructions, tools, memory, and policy |
| Tool | A typed integration the agent can call |
| Memory | Short-term context plus long-term retrieval and structured state |
| Workflow | A sequence or graph of agent and tool steps |
| Workspace | Tenant boundary for users, secrets, billing, permissions, and data |
| Channel | The surface where an agent is used, such as chat, API, or webhook |

## 9. User Jobs To Be Done

Users need to:
1. create agents for repeated tasks
2. connect those agents to business tools and data
3. build workflows with logic and approvals
4. preserve useful context over time
5. run agents inside and outside the platform
6. monitor and improve agent performance

## 10. MVP Scope

The MVP should focus on the smallest version of the platform that proves repeat value.

### Included in MVP
- workspace and agent creation
- threaded single-agent chat with saved history
- agent definition and editing
- tool abstraction layer with 2 to 4 high-value integrations
- short-term memory and persisted task context
- async execution with status tracking
- logs and observability
- approval checkpoints for sensitive actions
- one reusable workflow path or lightweight external trigger after the in-product loop proves value

### Excluded from MVP
- marketplace
- broad enterprise customization before core repeat value is proven
- unrestricted autonomous write access
- dozens of integrations
- advanced no-code visual graph builder in the first cut

## 11. Main Product Surfaces

### Agent Studio
Users can define:
- agent name
- purpose
- instructions
- allowed tools
- memory policy
- model policy
- output style
- cost and execution constraints

### Chat Workspace
Users can:
- interact with an agent
- upload context and files
- observe tool calls
- approve actions
- save successful flows as reusable automation

### Workflow Builder
Users can:
- combine agents and tools into sequences
- set conditions and retries
- add approval gates
- trigger workflows manually, on schedule, or via events

### Integrations Layer
Users can:
- call agents through APIs
- trigger workflows through webhooks
- connect business systems
- embed agent behavior into other products

### Observability Console
Users can:
- inspect runs
- debug failures
- track latency and cost
- understand agent behavior and tool outcomes

## 12. Functional Requirements

### Workspace and Access
- sign-up and sign-in
- workspace creation
- team member roles
- permissions by workspace and tool

### Agent Management
- create, edit, version, duplicate, archive
- assign tools and policies
- test before publishing

### Model Strategy
- support OpenAI, Anthropic, and Google providers
- route by task type, speed, and price
- fail over safely when needed

### Tool System
- standard typed interface
- input validation
- permission checks
- timeout and retry rules
- full action logging

### Memory
- thread memory for current work
- long-term retrieval for relevant knowledge
- structured state for preferences, workflow variables, and outputs

### Execution Loop
- plan
- act
- observe
- iterate within bounded limits

### External Usage
- API invocation
- webhook triggers
- embeddable agent endpoints
- response streaming where appropriate

## 13. Safety and Governance

The platform must include:
- role-based access control
- tenant isolation
- secret management
- schema validation for AI output
- tool allowlists
- loop detection
- step limits
- budget limits
- human approval for sensitive actions
- audit logs

## 14. Non-Functional Requirements

The system must be:
- secure by default
- observable
- reliable under repeated usage
- cost-aware
- responsive in normal chat flows
- accessible and understandable
- maintainable as a modular monolith first

## 15. Success Metrics

### North-star metric
Successful recurring tasks completed by user-created agents per workspace per week

### Supporting metrics
- time to first useful agent
- first workflow creation rate
- weekly active workspaces
- repeat run rate
- task success rate
- cost per successful run
- number of connected integrations

## 16. Pricing Direction

- free for exploration
- pro for individuals
- team for collaboration and approvals
- enterprise for governance, SSO, and advanced control

## 17. Release Criteria for MVP

MVP is ready when users can:
- create one useful agent
- connect it to real tools
- execute a repeatable task
- review logs and outputs
- invoke that agent from outside the core app
