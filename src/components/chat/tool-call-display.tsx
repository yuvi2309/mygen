"use client";

import { Globe, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ToolCallDisplayProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "result" | "partial-call";
  result?: unknown;
}

const TOOL_META: Record<string, { label: string; icon: typeof Globe }> = {
  web_search: { label: "Web Search", icon: Globe },
  document_reader: { label: "Reading Document", icon: FileText },
};

export function ToolCallDisplay({ toolName, args, state, result }: ToolCallDisplayProps) {
  const meta = TOOL_META[toolName] ?? { label: toolName, icon: Globe };
  const Icon = meta.icon;

  return (
    <div className="my-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{meta.label}</span>
        {state === "call" || state === "partial-call" ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : result ? (
          <CheckCircle2 className="h-3 w-3 text-green-600" />
        ) : (
          <AlertCircle className="h-3 w-3 text-destructive" />
        )}
      </div>
      {"query" in args && (
        <p className="mt-1 text-xs text-muted-foreground">
          Searching: &ldquo;{String(args.query)}&rdquo;
        </p>
      )}
      {"url" in args && (
        <p className="mt-1 text-xs text-muted-foreground truncate">
          Reading: {String(args.url)}
        </p>
      )}
      {state === "result" &&
        result != null &&
        typeof result === "object" &&
        "results" in (result as Record<string, unknown>) ? (
        <div className="mt-2 space-y-1">
          {(
            (result as { results: { title: string; url: string }[] }).results ?? []
          )
            .slice(0, 3)
            .map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-xs text-primary hover:underline"
              >
                {r.title}
              </a>
            ))}
        </div>
      ) : null}
    </div>
  );
}
