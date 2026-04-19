"use client";

interface StructuredMessageContentProps {
  text: string;
}

interface CodeSegment {
  type: "text" | "code";
  value: string;
  language?: string;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseCodeSegments(text: string): CodeSegment[] {
  const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
  const segments: CodeSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: "code",
      language: match[1] || "text",
      value: match[2].trimEnd(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function parseMarkdownTable(text: string): ParsedTable | null {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !lines[0].includes("|") || !/^[\s|:-]+$/.test(lines[1])) {
    return null;
  }

  const toCells = (row: string) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, index, arr) => !(index === 0 && arr[index] === "") && !(index === arr.length - 1 && arr[index] === ""));

  const headers = toCells(lines[0]);
  const rows = lines.slice(2).map(toCells).filter((row) => row.length > 0);

  if (headers.length === 0 || rows.length === 0) {
    return null;
  }

  return { headers, rows };
}

function looksLikeHtml(text: string) {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || /^<([a-z][\w-]*)(\s|>)/.test(trimmed);
}

function looksLikeCode(text: string) {
  const trimmed = text.trim();
  return (
    trimmed.includes("function ") ||
    trimmed.includes("const ") ||
    trimmed.includes("import ") ||
    trimmed.includes("export ") ||
    /<[A-Za-z][^>]*>/.test(trimmed) === false && /[{};]/.test(trimmed)
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function JsonTable({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "object" || item === null)) {
    return null;
  }

  const rows = value as Array<Record<string, unknown>>;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t align-top">
              {headers.map((header) => (
                <td key={`${index}-${header}`} className="px-3 py-2 text-muted-foreground">
                  {formatValue(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownTable({ table }: { table: ParsedTable }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index} className="border-t align-top">
              {table.headers.map((_, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-3 py-2 text-muted-foreground">
                  {row[cellIndex] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StructuredMessageContent({ text }: StructuredMessageContentProps) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const jsonValue = tryParseJson(trimmed);
  if (jsonValue !== null) {
    return (
      <div className="space-y-3">
        <JsonTable value={jsonValue} />
        <pre className="overflow-x-auto rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
          <code>{JSON.stringify(jsonValue, null, 2)}</code>
        </pre>
      </div>
    );
  }

  const markdownTable = parseMarkdownTable(trimmed);
  if (markdownTable) {
    return <MarkdownTable table={markdownTable} />;
  }

  if (looksLikeHtml(trimmed)) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border bg-background">
          <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            HTML preview
          </div>
          <iframe
            title="HTML preview"
            sandbox=""
            srcDoc={trimmed}
            className="h-64 w-full bg-white"
          />
        </div>
        <pre className="overflow-x-auto rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
          <code>{trimmed}</code>
        </pre>
      </div>
    );
  }

  const segments = parseCodeSegments(text);
  if (segments.some((segment) => segment.type === "code")) {
    return (
      <div className="space-y-3">
        {segments.map((segment, index) =>
          segment.type === "code" ? (
            <div key={index} className="rounded-md border overflow-hidden">
              <div className="border-b bg-muted/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {segment.language ?? "code"}
              </div>
              <pre className="overflow-x-auto bg-slate-950 p-3 text-xs text-slate-100">
                <code>{segment.value}</code>
              </pre>
            </div>
          ) : segment.value.trim() ? (
            <div key={index} className="whitespace-pre-wrap break-words text-sm leading-6">
              {segment.value}
            </div>
          ) : null
        )}
      </div>
    );
  }

  if (looksLikeCode(trimmed)) {
    return (
      <pre className="overflow-x-auto rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
        <code>{trimmed}</code>
      </pre>
    );
  }

  return <div className="whitespace-pre-wrap break-words text-sm leading-6">{text}</div>;
}
