import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-4 transition-colors",
        isUser ? "bg-transparent" : "bg-muted/30"
      )}
    >
      <Avatar
        className={cn(
          "mt-0.5 size-8 shrink-0",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-cyan-500"
            : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
        )}
      >
        <AvatarFallback
          className={cn(
            "text-white",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-cyan-500"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
          )}
        >
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? "You" : "Agent"}
          </span>
          <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  agentName?: string;
}

export function TypingIndicator({ agentName = "Agent" }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 bg-muted/30 px-4 py-4">
      <Avatar className="mt-0.5 size-8 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        <span className="font-semibold text-sm">{agentName}</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
