---
applyTo: "src/**/*.{ts,tsx,js,jsx,css}"
---

# Performance Instructions

Apply performance-aware engineering practices to all new work.

## Rules
- Prefer simple, efficient solutions before adding complexity.
- Avoid unnecessary client-side rendering and large dependency additions.
- Keep component trees lean and move heavy work to the server when possible.
- Design AI features with latency, retries, batching, and cost in mind.
- Measure or verify performance-sensitive changes instead of guessing.

## Next.js guidance
- Default to Server Components when interactivity is not needed.
- Minimize blocking work during page load.
- Keep bundle size under control and avoid shipping server concerns to the browser.
