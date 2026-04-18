---
mode: agent
description: Refactor code for clarity, maintainability, and architecture without changing intended behavior
tools: ['codebase', 'search', 'usages', 'editFiles', 'findTestFiles', 'problems']
---

# Refactor Code

Refactor a selected area of the codebase while preserving behavior.

## Inputs
- Target area: ${input:Target area}
- Refactor goal: ${input:Refactor goal}

## Instructions
1. Understand the existing behavior and constraints.
2. Improve clarity, separation of concerns, and maintainability.
3. Avoid unrelated churn.
4. Update documentation or tests if required.
5. Verify that behavior remains intact.
