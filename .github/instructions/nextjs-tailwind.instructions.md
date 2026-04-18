---
applyTo: "src/**/*.{ts,tsx,js,jsx,css}"
---

# Next.js and Tailwind Instructions

Use modern Next.js and Tailwind practices for this repository.

## Rules
- Prefer composable UI primitives and keep components small.
- Use Tailwind classes consistently and avoid scattered style duplication.
- Separate presentational concerns from business logic.
- Keep accessibility, responsive behavior, and empty states in mind.
- Follow existing design patterns in the workspace before introducing new ones.

## App Router guidance
- Prefer server-driven data flow where practical.
- Use client components only for interaction, browser APIs, or local state.
- Keep route-level components clean and delegate reusable logic downward.
