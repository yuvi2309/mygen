---
applyTo: "src/**/*.{ts,tsx},**/*.test.{ts,tsx},**/*.spec.{ts,tsx}"
---

# Testing and Quality Instructions

Apply these rules for all implementation and bug-fix work.

## Verification standards
- For bugs, start with a failing reproduction or a clear proof of the issue when practical.
- After changes, verify the affected behavior with the most relevant command or test.
- Do not claim success without fresh evidence from the workspace.

## Test design
- Prefer testing real behavior over asserting on mocks alone.
- Mock only at boundaries that are slow, nondeterministic, or external.
- Avoid test-only production APIs and avoid hiding architectural problems behind mocks.
- Cover happy path, edge cases, and failure handling.

## Code quality
- Keep functions and components small and purposeful.
- Refactor for clarity when touching confusing code, but avoid unrelated churn.
- Preserve typing discipline and runtime validation at system boundaries.
- Keep performance and accessibility regressions in mind.

## For this project
- Validate data flowing into AI features.
- Check for empty responses, malformed payloads, timeout paths, and fallback behavior.
- Ensure new work remains maintainable for future scaling into a larger AI product platform.
