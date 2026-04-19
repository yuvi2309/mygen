"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Popover, DropdownMenu } from "radix-ui";
import { ArrowUp, Bot, Check, ChevronDown, Eraser, Loader2, Paperclip, RotateCcw, Wrench, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Agent, AgentTool } from "@/lib/types";
import { TOOL_OPTIONS } from "@/lib/ai/options";

interface MessageInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e?: { preventDefault?: () => void }) => void;
  onStop: () => void;
  agent?: Agent;
  agents?: Agent[];
  onAgentChange?: (agent: Agent) => void;
  extraTools?: AgentTool[];
  onExtraToolsChange?: (tools: AgentTool[]) => void;
  attachedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  agentMode?: boolean;
  onAgentModeChange?: (mode: boolean) => void;
  onClearContext?: () => void;
  onResetChat?: () => void;
}

export function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  agent,
  agents,
  onAgentChange,
  extraTools = [],
  onExtraToolsChange,
  attachedFiles = [],
  onFilesChange,
  agentMode = false,
  onAgentModeChange,
  onClearContext,
  onResetChat,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && onFilesChange) {
      onFilesChange([...attachedFiles, ...Array.from(files)]);
    }
    // Reset so same file can be attached again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    onFilesChange?.(attachedFiles.filter((_, i) => i !== index));
  }

  function toggleTool(toolId: AgentTool) {
    if (!onExtraToolsChange) return;
    if (extraTools.includes(toolId)) {
      onExtraToolsChange(extraTools.filter((t) => t !== toolId));
    } else {
      onExtraToolsChange([...extraTools, toolId]);
    }
  }

  // Tools already on the agent (not toggleable, just shown as context)
  const agentToolIds = agent?.tools ?? [];

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="mx-auto max-w-3xl space-y-2">
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
              >
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extra tools badges */}
        {extraTools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {extraTools.map((toolId) => {
              const toolOption = TOOL_OPTIONS.find((t) => t.id === toolId);
              return (
                <span
                  key={toolId}
                  className="flex items-center gap-1 rounded-full border bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  <Wrench className="h-3 w-3" />
                  {toolOption?.label ?? toolId}
                  <button
                    type="button"
                    onClick={() => toggleTool(toolId)}
                    className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                    aria-label={`Remove ${toolOption?.label ?? toolId}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Input row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col rounded-lg border bg-muted/30 focus-within:ring-1 focus-within:ring-ring"
        >
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            rows={1}
            disabled={isLoading}
            autoFocus
          />

          {/* Bottom toolbar */}
          <div className="flex items-center gap-1 px-2 pb-2">
            {/* Agent selector */}
            {agents && agents.length > 0 && onAgentChange && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 max-w-[160px] h-8"
                  >
                    <Bot className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">{agent?.name ?? "Select agent"}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
                    side="top"
                    align="start"
                    sideOffset={8}
                  >
                    {agents.map((a) => (
                      <DropdownMenu.Item
                        key={a.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
                        onSelect={() => onAgentChange(a)}
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span className="truncate">{a.name}</span>
                        {agent?.id === a.id && <Check className="ml-auto h-3.5 w-3.5" />}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}

            {/* Agent mode toggle */}
            {onAgentModeChange && (
              <Button
                type="button"
                variant={agentMode ? "default" : "ghost"}
                size="sm"
                className={`shrink-0 gap-1 h-8 px-2 ${agentMode ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => onAgentModeChange(!agentMode)}
                title={agentMode ? "Agent mode (LangGraph)" : "Simple mode"}
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs hidden sm:inline">{agentMode ? "Agent" : "Simple"}</span>
              </Button>
            )}

            {onClearContext && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={onClearContext}
                title="Clear chat context"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span className="sr-only">Clear chat context</span>
              </Button>
            )}

            {onResetChat && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={onResetChat}
                title="Reset chat"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="sr-only">Reset chat</span>
              </Button>
            )}

            {/* File attach button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={handleFileSelect}
              title="Attach files"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span className="sr-only">Attach files</span>
            </Button>

            {/* Tool attach button */}
            <Popover.Root open={toolsOpen} onOpenChange={setToolsOpen}>
              <Popover.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  title="Attach tools"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="sr-only">Attach tools</span>
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 w-[220px] rounded-md border bg-popover p-2 shadow-md"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Add extra tools</p>
                  {TOOL_OPTIONS.map((tool) => {
                    const isAgentTool = agentToolIds.includes(tool.id);
                    const isExtra = extraTools.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={isAgentTool}
                        onClick={() => toggleTool(tool.id)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${isAgentTool || isExtra ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                          {(isAgentTool || isExtra) && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block text-sm">{tool.label}</span>
                          {isAgentTool && (
                            <span className="block text-[10px] text-muted-foreground">From agent</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  <Popover.Arrow className="fill-popover" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Send / Stop button */}
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onStop}
                className="shrink-0 h-8 w-8"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="sr-only">Stop generating</span>
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="shrink-0 h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
