---
mode: agent
description: Generate or refresh feature documentation after implementation work
tools: ['codebase', 'search', 'usages', 'editFiles']
---

# Generate Feature Documentation

Create or update developer-facing documentation for a feature in this repository.

## Inputs
- Feature name: ${input:Feature name}
- Target audience: ${input:Audience}

## Instructions
1. Inspect the implementation and any related configuration.
2. Summarize how the feature works, how to use it, and how to extend it.
3. Save the output in docs or update an existing relevant document.
4. Ensure the documentation matches the current code and avoids placeholders.

## Include
- Purpose
- Entry points and files involved
- Configuration or environment variables
- Example usage
- Limitations and failure cases
- Maintenance notes

## Expected output
Clear markdown documentation that reduces onboarding and support cost.
