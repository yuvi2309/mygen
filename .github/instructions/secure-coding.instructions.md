---
applyTo: "src/**/*.{ts,tsx,js,jsx}"
---

# Secure Coding Instructions

Apply secure-by-default practices in this workspace.

## Rules
- Validate and sanitize all external input.
- Treat AI model output as untrusted until checked.
- Never hardcode secrets or expose private tokens to the client.
- Prefer least privilege for tools, API routes, and integrations.
- Fail safely with clear error handling and no sensitive leakage.

## For web and AI features
- Guard against prompt injection, data leakage, and unsafe tool execution.
- Protect server-only logic and environment variables.
- Validate structured responses with runtime schemas before use.
- Be careful with logging so prompts, secrets, and PII are not leaked.
