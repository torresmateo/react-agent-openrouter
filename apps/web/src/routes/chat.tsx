import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatInput,
  ChatMessage,
  type ChatSession,
  ChatSidebar,
  type Message,
  TypingIndicator,
} from "@/components/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

// Mock data for demonstration
const MOCK_SESSIONS: ChatSession[] = [
  {
    id: "1",
    title: "Help with TypeScript generics",
    lastMessage: "Thanks for explaining that! Now I understand how to use...",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    messageCount: 12,
  },
  {
    id: "2",
    title: "React performance optimization",
    lastMessage: "The useMemo hook should be used sparingly...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    messageCount: 8,
  },
  {
    id: "3",
    title: "Database schema design",
    lastMessage: "For a many-to-many relationship, you would typically...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    messageCount: 15,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "1-1",
      role: "user",
      content: "Can you explain TypeScript generics to me?",
      timestamp: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      id: "1-2",
      role: "assistant",
      content:
        "Of course! TypeScript generics are a way to create reusable components that can work with a variety of types rather than a single one. Think of them as type variables.\n\nHere's a simple example:\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n```\n\nThe `<T>` is a type parameter that acts as a placeholder for a type that will be determined when the function is called.",
      timestamp: new Date(Date.now() - 1000 * 60 * 34),
    },
    {
      id: "1-3",
      role: "user",
      content: "That makes sense! How would I use this with arrays?",
      timestamp: new Date(Date.now() - 1000 * 60 * 32),
    },
    {
      id: "1-4",
      role: "assistant",
      content:
        "Great question! With arrays, you can use generics to ensure type safety while maintaining flexibility:\n\n```typescript\nfunction getFirstElement<T>(arr: T[]): T | undefined {\n  return arr[0];\n}\n\n// Usage:\nconst numbers = [1, 2, 3];\nconst first = getFirstElement(numbers); // type is number | undefined\n\nconst strings = ['a', 'b', 'c'];\nconst firstStr = getFirstElement(strings); // type is string | undefined\n```\n\nTypeScript infers the type automatically based on the argument you pass!",
      timestamp: new Date(Date.now() - 1000 * 60 * 31),
    },
  ],
  "2": [
    {
      id: "2-1",
      role: "user",
      content: "My React app is rendering slowly. Any tips?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
    },
    {
      id: "2-2",
      role: "assistant",
      content:
        "There are several strategies to optimize React performance:\n\n1. **Use React.memo()** for components that render often with the same props\n2. **useMemo()** for expensive calculations\n3. **useCallback()** for functions passed as props\n4. **Virtualization** for long lists (react-window or react-virtualized)\n5. **Code splitting** with React.lazy() and Suspense\n\nWould you like me to elaborate on any of these?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.4),
    },
  ],
  "3": [
    {
      id: "3-1",
      role: "user",
      content:
        "I need to design a database schema for a blog with tags. How should I structure it?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
    },
    {
      id: "3-2",
      role: "assistant",
      content:
        "For a blog with tags, you'll need a many-to-many relationship. Here's a suggested schema:\n\n**Posts table:**\n- id (primary key)\n- title\n- content\n- created_at\n- updated_at\n\n**Tags table:**\n- id (primary key)\n- name (unique)\n- slug\n\n**PostTags table (junction):**\n- post_id (foreign key)\n- tag_id (foreign key)\n- Primary key: (post_id, tag_id)\n\nThis allows each post to have multiple tags and each tag to be used by multiple posts.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.9),
    },
  ],
};

function ChatPage() {
  const { session } = Route.useRouteContext();
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    MOCK_SESSIONS[0]?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES["1"] ?? []);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages(MOCK_MESSAGES[sessionId] ?? []);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setActiveSessionId(remaining[0]?.id ?? null);
      setMessages(remaining[0] ? (MOCK_MESSAGES[remaining[0].id] ?? []) : []);
    }
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Update session
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              lastMessage: content,
              timestamp: new Date(),
              messageCount: s.messageCount + 1,
              title:
                s.messageCount === 0 ? content.slice(0, 50) + "..." : s.title,
            }
          : s
      )
    );

    // Simulate agent response
    setIsTyping(true);
    setTimeout(() => {
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Thanks for your message, ${session.data?.user.name ?? "there"}! This is a demo response. In a real implementation, this would connect to your agent backend and stream the response.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                lastMessage: agentMessage.content.slice(0, 50) + "...",
                messageCount: s.messageCount + 1,
              }
            : s
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        activeSessionId={activeSessionId}
        agentName="Assistant"
        onDeleteSession={handleDeleteSession}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        sessions={sessions}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {activeSessionId ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <svg
                        className="size-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">
                        Start a conversation
                      </h2>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Send a message to begin chatting with the agent.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
              disabled={isTyping}
              onSend={handleSendMessage}
              placeholder="Type a message..."
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="font-semibold text-lg">No session selected</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Select a session from the sidebar or start a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
