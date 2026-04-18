# ADR: Platform Direction for MyGen

## Status
Accepted

## Context

The product could be built as a generic AI chat app, a no-code workflow tool, or a portable multi-agent platform. The strongest market direction is the third option because it creates durable platform value and a clearer moat.

## Decision

MyGen will be built as a portable agent platform for work automation, starting with a narrow wedge in knowledge-work workflows.

The system will:
- use a modular monolith architecture first
- abstract model providers behind a routing layer
- treat agents, tools, memory, and workflows as first-class objects
- support both chat and external invocation
- include observability and guardrails from the start

## Why this decision

This direction:
- aligns with repeatable business value
- avoids becoming just another chat interface
- supports future SDK and ecosystem growth
- keeps the path open for multi-agent orchestration
- differentiates through portability and execution

## Consequences

### Positive
- clearer market position
- stronger retention potential
- reusable platform primitives
- easier enterprise expansion later

### Negative
- more system complexity than a simple chat app
- heavier need for permissions, logging, and state handling
- longer time to first polished release unless MVP remains tight

## Trade-off Decision

The product will prioritize operational usefulness over breadth of chat features.
