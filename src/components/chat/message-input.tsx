"use client";

import { useRef, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e?: { preventDefault?: () => void }) => void;
  onStop: () => void;
}

export function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-t bg-background px-4 py-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mx-auto flex max-w-3xl items-end gap-2"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[44px] max-h-[200px] resize-none"
          rows={1}
          disabled={isLoading}
          autoFocus
        />
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onStop}
            className="shrink-0"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="sr-only">Stop generating</span>
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </form>
    </div>
  );
}
