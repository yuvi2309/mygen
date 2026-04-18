import { tool, type ToolSet } from "ai";
import { z } from "zod/v4";
import { tavily } from "@tavily/core";
import type { AgentTool } from "@/lib/types";

// ─── Tool Registry ──────────────────────────────────────────────────────────
// Each tool uses the AI SDK `tool()` helper with typed input/output.
// Tools are registered here and resolved by name at runtime.
// AI SDK v6 uses `inputSchema` (not `parameters`).
// Tavily client is lazily initialized to avoid build-time errors.

let _tvly: ReturnType<typeof tavily> | null = null;
function getTvly() {
  if (!_tvly) _tvly = tavily();
  return _tvly;
}

const webSearchTool = tool({
  description: "Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, or anything that benefits from real-time data.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z.number().min(1).max(10).default(5).describe("Maximum number of results to return"),
  }),
  execute: async ({ query, maxResults }) => {
    const response = await getTvly().search(query, {
      maxResults,
      searchDepth: "basic",
    });
    return {
      results: response.results.map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  },
});

const documentReaderTool = tool({
  description: "Extract and read content from a URL. Use this when the user provides a link and wants you to analyze its content.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to read"),
  }),
  execute: async ({ url }) => {
    const response = await getTvly().extract([url]);
    const result = response.results[0];
    return {
      url: result?.url ?? url,
      content: result?.rawContent?.slice(0, 8000) ?? "Could not extract content from URL.",
    };
  },
});

// ─── Tool Resolution ────────────────────────────────────────────────────────

const TOOL_MAP: Record<string, ToolSet[string]> = {
  web_search: webSearchTool,
  document_reader: documentReaderTool,
};

export function resolveTools(toolNames: AgentTool[]): ToolSet {
  const tools: ToolSet = {};
  for (const name of toolNames) {
    if (name in TOOL_MAP) {
      tools[name] = TOOL_MAP[name];
    }
  }
  return tools;
}


