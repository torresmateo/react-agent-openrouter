import { Paperclip, Send, Sparkles } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-border border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-all",
            "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
          )}
        >
          {/* Attachment button placeholder */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="shrink-0 text-muted-foreground hover:text-foreground"
                disabled
                size="icon"
                variant="ghost"
              >
                <Paperclip className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attachments (coming soon)</TooltipContent>
          </Tooltip>

          {/* Text input */}
          <textarea
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={textareaRef}
            rows={1}
            value={value}
          />

          {/* Tools button placeholder */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="shrink-0 text-muted-foreground hover:text-foreground"
                disabled
                size="icon"
                variant="ghost"
              >
                <Sparkles className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tools (coming soon)</TooltipContent>
          </Tooltip>

          {/* Send button */}
          <Button
            className={cn(
              "shrink-0 transition-all",
              value.trim()
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                : ""
            )}
            disabled={!value.trim() || disabled}
            onClick={handleSend}
            size="icon"
          >
            <Send className="size-4" />
          </Button>
        </div>

        {/* Model picker placeholder */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Button
            className="h-7 gap-1 text-muted-foreground text-xs hover:text-foreground"
            disabled
            size="sm"
            variant="ghost"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            GPT-4 Turbo
            <span className="text-muted-foreground/50">(coming soon)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
