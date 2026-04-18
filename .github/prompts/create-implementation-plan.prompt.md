---
mode: agent
description: Turn a feature request or specification into an implementation-ready engineering plan
tools: ['codebase', 'search', 'usages', 'findTestFiles', 'editFiles', 'problems']
---

# Create Implementation Plan

Create a practical implementation plan for this codebase.

## Inputs
- Feature or initiative: ${input:Feature or initiative}
- Scope notes: ${input:Scope and constraints}

## Instructions
1. Review relevant files and patterns in the repository.
2. Break the work into phases that can be delivered safely.
3. Save the plan under docs/plans with a descriptive file name.
4. Include explicit verification steps so the work can be proven complete.

## Plan structure
- Goal
- Current state summary
- Proposed approach
- Affected areas and file map
- Phase-by-phase tasks
- Data contracts and validation needs
- Test strategy
- Rollback or mitigation notes
- Risks, assumptions, and open questions
- Verification checklist

## Expected output
A markdown implementation plan that an engineer can execute with minimal ambiguity.
