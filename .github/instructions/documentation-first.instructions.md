---
applyTo: "**/*.{md,ts,tsx,js,jsx,json,yml,yaml}"
---

# Documentation-First Instructions

Use these rules when documenting or changing the system.

## Core rules
- Keep documentation synchronized with implementation changes.
- Document intent, boundaries, assumptions, and trade-offs — not just mechanics.
- Prefer concise, high-signal writing with headings, bullets, and examples.

## Required documentation habits
- New product ideas should start with a specification in the docs folder.
- Non-trivial technical choices should be captured as an ADR.
- Features that affect setup, environment variables, or workflows must update project docs.
- Public or reusable modules should include short explanatory comments only when intent is not obvious from the code.

## AI product documentation focus
- Describe the user problem, inputs, outputs, failure modes, and safety considerations.
- Call out model dependencies, provider abstractions, latency risks, and cost-sensitive paths.
- Note what should be observable in logs or telemetry for troubleshooting.

## Writing style
- Be specific and actionable.
- Avoid filler and marketing language in engineering docs.
- Write so a new engineer can understand what exists, why it exists, and how to extend it safely.
