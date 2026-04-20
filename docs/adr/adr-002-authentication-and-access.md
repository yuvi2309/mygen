# ADR: Authentication and Access for MyGen

## Status
Accepted

## Context
MyGen needs multi-user access with protected workspace routes, secure sign-in, email/password onboarding, and an option for verification or Google-based login.

## Decision
Use a managed auth provider pattern with secure cookie sessions, route protection in the Next.js proxy layer, server-side authorization checks in layouts and API routes, and per-user workspace scoping in the client store.

## Why this decision
- Keeps password handling outside the browser
- Supports email verification and OAuth providers like Google
- Makes route protection consistent across the app
- Gives a clearer path toward compliance-focused hosting and retention controls

## Consequences
### Positive
- Cleaner separation between public and private app surfaces
- Better security defaults for personal multi-user usage
- Easy to extend later with roles, audit logs, and server-side data storage

### Negative
- Requires provider configuration for live production authentication
- Current workspace data remains browser-local unless a database layer is added next
