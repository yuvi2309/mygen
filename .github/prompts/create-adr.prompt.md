---
mode: chat
description: Create an architecture decision record for an important technical or product decision
tools: ['codebase', 'search', 'usages', 'editFiles']
---

# Create Architecture Decision Record

Capture a meaningful technical decision in ADR format.

## Inputs
- Decision title: ${input:Decision title}
- Context summary: ${input:Context}
- Proposed decision: ${input:Decision}
- Alternatives considered: ${input:Alternatives}

## Instructions
1. Review current architecture and related files.
2. Write an ADR in docs/adr with a clear, dated file name.
3. Keep the content concise, honest, and future-friendly.

## Required sections
- Status
- Context
- Decision
- Alternatives considered
- Consequences
- Follow-up actions

## Expected output
A markdown ADR file suitable for long-term project governance.
