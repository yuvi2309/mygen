// ─── LangChain Tool Registry ────────────────────────────────────────────────
// LangGraph uses LangChain-style tools (DynamicStructuredTool).
// This file mirrors the AI SDK tool registry but for LangGraph consumption.

import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod/v3";

// Tavily client — lazily initialized
let _tvly: ReturnType<typeof tavily> | null = null;
function getTvly() {
  if (!_tvly) _tvly = tavily();
  return _tvly;
}

// ─── Web Search ─────────────────────────────────────────────────────────────

export const webSearchTool = tool(
  async ({ query, maxResults }: { query: string; maxResults: number }) => {
    const response = await getTvly().search(query, {
      maxResults,
      searchDepth: "basic",
    });
    const results = response.results.map(
      (r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })
    );
    return JSON.stringify({ results });
  },
  {
    name: "web_search",
    description:
      "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, or anything that benefits from real-time data.",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of results to return"),
    }),
  }
);

// ─── Document Reader ────────────────────────────────────────────────────────

export const documentReaderTool = tool(
  async ({ url }: { url: string }) => {
    const response = await getTvly().extract([url]);
    const result = response.results[0];
    return JSON.stringify({
      url: result?.url ?? url,
      content:
        result?.rawContent?.slice(0, 8000) ??
        "Could not extract content from URL.",
    });
  },
  {
    name: "document_reader",
    description:
      "Extract and read content from a URL. Use this when the user provides a link and wants you to analyze its content.",
    schema: z.object({
      url: z.string().url().describe("The URL to read"),
    }),
  }
);

// ─── Tool Map ───────────────────────────────────────────────────────────────

const TOOL_MAP = {
  web_search: webSearchTool,
  document_reader: documentReaderTool,
} as const;

/**
 * Resolve tool names to LangChain StructuredTool instances.
 * Used by the LangGraph agent to bind tools to the model.
 */
export function resolveLangChainTools(toolNames: string[]) {
  return toolNames
    .filter((name): name is keyof typeof TOOL_MAP => name in TOOL_MAP)
    .map((name) => TOOL_MAP[name]);
}

/**
 * Get all available LangChain tool names.
 */
export function getAvailableToolNames(): string[] {
  return Object.keys(TOOL_MAP);
}
