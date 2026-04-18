---
mode: agent
description: Create a high-quality product specification for an AI-native feature or workflow
tools: ['codebase', 'search', 'usages', 'fetch', 'editFiles', 'problems']
---

# Create Product Specification

Create or update a product specification for this workspace.

## Inputs
- Feature name: ${input:Feature name}
- Problem to solve: ${input:Problem statement}
- Primary user: ${input:Primary user or persona}
- Success metric: ${input:Success metric}

## Instructions
1. Inspect the current workspace to understand the existing product direction and technical stack.
2. Draft a specification focused on real product value and delivery clarity.
3. Save the output under docs/specs using a short kebab-case file name.
4. Keep the spec implementation-ready and aligned with AI-native product constraints.

## Include these sections
- Summary
- Problem and opportunity
- User personas
- Jobs to be done
- User stories
- Acceptance criteria
- UX expectations
- Technical considerations
- AI-specific considerations such as latency, fallbacks, cost, and safety
- Non-functional requirements
- Risks and open questions
- Recommended next step

## Expected output
A complete markdown specification file that can be used immediately for planning and implementation.
