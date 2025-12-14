import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  content: string;
  role: "user" | "assistant";
  createdAt?: string;
};

export function ChatMessage({ content, role, createdAt }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{content}</p>
        {createdAt ? (
          <time className="mt-1 block text-xs opacity-70">
            {new Date(createdAt).toLocaleTimeString()}
          </time>
        ) : null}
      </div>
    </div>
  );
}
