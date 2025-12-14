import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
};

type ChatMessagesProps = {
  messages: Message[];
  isLoading?: boolean;
};

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger scroll when message count changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-1 py-4">
        {messages.map((message) => (
          <ChatMessage
            content={message.content}
            createdAt={message.createdAt}
            key={message.id}
            role={message.role}
          />
        ))}
        {isLoading ? (
          <div className="flex gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 animate-pulse items-center justify-center rounded-full bg-muted" />
            <div className="flex max-w-[70%] animate-pulse items-center gap-1 rounded-lg bg-muted px-4 py-3">
              <div className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground/50"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground/50"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        ) : null}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
