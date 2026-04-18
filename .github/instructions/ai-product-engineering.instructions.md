---
applyTo: "src/**/*.{ts,tsx},src/**/*.{js,jsx},src/**/*.{css,md},*.{ts,tsx,js,jsx}"
---

# AI Product Engineering Instructions

Apply these standards when generating or updating code for this workspace.

## Delivery mindset
- Build in this order whenever possible: idea → specification → implementation plan → code → verification → documentation.
- Favor production-ready solutions over demos or shortcuts.
- Keep changes incremental, reversible, and easy to review.

## Architecture
- Prefer clear boundaries between UI, domain logic, integrations, and data access.
- Keep components focused; move business logic into reusable functions, services, or server-side modules.
- Avoid tightly coupling model providers, storage, and UI.
- For major structural changes, recommend an ADR before implementation.

## Next.js and TypeScript
- Prefer Server Components by default and use Client Components only when interactivity is required.
- Validate external input and AI responses with strong runtime schemas such as zod.
- Use explicit types for app state, API contracts, tool payloads, and persisted data.
- Keep environment variables and secret-dependent logic on the server side.

## AI-native product standards
- Treat LLM output as untrusted input until validated.
- Design for latency, retries, fallbacks, rate limits, and token cost awareness.
- Keep provider-specific code behind a thin abstraction layer so models can be swapped later.
- Preserve user privacy and avoid leaking secrets, prompts, or sensitive business data.
- Include observability hooks for errors, degraded responses, and important workflow events.

## UX expectations
- Always consider loading, empty, error, and success states.
- Maintain accessible semantics, keyboard support, and readable copy.
- Prefer polished defaults over placeholder experiences.

## Definition of done
A feature is not complete until relevant code, docs, validation, and verification steps are updated together.
