---
mode: chat
description: Review a feature or change set for architecture, quality, documentation, and release readiness
tools: ['changes', 'codebase', 'search', 'usages', 'findTestFiles', 'problems']
---

# Review Feature Readiness

Review the current change or a selected feature for production readiness.

## Inputs
- Feature or change set: ${input:Feature or change set}
- Review focus: ${input:Primary focus area}

## Instructions
1. Review the implementation, related tests, and documentation.
2. Evaluate architecture, maintainability, validation, UX coverage, and operational risk.
3. Return findings in priority order.
4. Do not make changes unless explicitly asked.

## Output format
- Ready / not ready summary
- High-priority issues
- Medium-priority improvements
- Documentation gaps
- Verification recommendations
