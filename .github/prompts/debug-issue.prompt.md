---
mode: agent
description: Investigate a bug systematically and verify the fix with evidence
tools: ['codebase', 'search', 'usages', 'problems', 'runCommands', 'runTasks', 'runTests', 'testFailure', 'editFiles']
---

# Debug Issue

Investigate and fix a bug in this repository.

## Inputs
- Issue summary: ${input:Issue summary}
- Reproduction steps: ${input:Reproduction steps}

## Instructions
1. Reproduce or localize the issue.
2. Identify the root cause before changing code.
3. Apply the smallest correct fix.
4. Verify the result with relevant evidence.
5. Summarize the cause and the proof of resolution.
