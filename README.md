This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## AI development workflow

This repository is now configured for GitHub Copilot with:

- project-wide instruction files for architecture, documentation, testing, security, and performance
- reusable prompt files for specifications, planning, debugging, refactoring, and reviews
- custom agents for architecture, implementation, debugging, and engineering review
- MCP integrations for SigMap and Omni to improve context quality and terminal workflows

See the project workflow guide in [docs/copilot-workflows.md](docs/copilot-workflows.md).

## Interactive chat workspace

The chat UI now supports a richer workflow for multi-step AI work:

- bulk archive and delete for chats from the sidebar
- pinned chats and pinned message references for long threads
- tag-based organization and archived chat management
- edit-and-resend for earlier user prompts
- response sculpting: select multiple parts of a long answer, keep only the useful cuts, and trim the rest away
- tree-style side branches: ask about a selected excerpt without polluting the main chat flow
- thread forking to branch a conversation without losing the original
- clear-context and reset controls to save tokens and restart quickly
- timestamped messages and structured rendering for JSON, HTML, tables, tool output, and code
- user-level workspace segregation so each user has isolated agents, chats, and thread history

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
