import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  type ChatAgent,
  type ChatEvent,
  type ChatSession,
  createChatSession,
  getChatSession,
  listChatAgents,
  listChatSessions,
  sendChatMessage,
} from "@/lib/chat-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
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

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composer, setComposer] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.key === selectedAgentKey) ?? null,
    [agents, selectedAgentKey]
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await listChatAgents();
        if (cancelled) {
          return;
        }
        setAgents(a);
        const saved = localStorage.getItem("chat:selectedAgentKey");
        setSelectedAgentKey(
          saved && a.some((x) => x.key === saved) ? saved : (a[0]?.key ?? "")
        );
      } catch (e) {
        toast.error("Failed to load agents", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedAgentKey) {
      return;
    }
    localStorage.setItem("chat:selectedAgentKey", selectedAgentKey);
  }, [selectedAgentKey]);

  useEffect(() => {
    if (!selectedAgentKey) {
      return;
    }
    let cancelled = false;
    setIsLoadingSessions(true);
    (async () => {
      try {
        const s = await listChatSessions({ agentKey: selectedAgentKey });
        if (cancelled) {
          return;
        }
        setSessions(s);
        const first = s[0];
        if (first) {
          setSelectedSessionId((prev) =>
            s.some((x) => x.id === prev) ? prev : first.id
          );
        } else {
          setSelectedSessionId("");
          setEvents([]);
        }
      } catch (e) {
        toast.error("Failed to load sessions", {
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAgentKey]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }
    let cancelled = false;
    setIsLoadingEvents(true);
    (async () => {
      try {
        const data = await getChatSession({ sessionId: selectedSessionId });
        if (cancelled) {
          return;
        }
        setEvents(data.events);
      } catch (e) {
        toast.error("Failed to load session", {
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) {
          setIsLoadingEvents(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const lastEventId = events.at(-1)?.id;

  useEffect(() => {
    if (!lastEventId) {
      return;
    }
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lastEventId]);

  async function onStartNewSession() {
    if (!selectedAgentKey) {
      return;
    }
    try {
      const created = await createChatSession({ agentKey: selectedAgentKey });
      const next = await listChatSessions({ agentKey: selectedAgentKey });
      setSessions(next);
      setSelectedSessionId(created.id);
    } catch (e) {
      toast.error("Failed to create session", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function onSendMessage() {
    const content = composer.trim();
    if (!selectedSessionId || content.length === 0 || isSending) {
      return;
    }
    setComposer("");
    setIsSending(true);
    try {
      const optimistic: ChatEvent = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, optimistic]);

      const res = await sendChatMessage({
        sessionId: selectedSessionId,
        content,
      });
      setEvents((prev) => {
        const withoutOptimistic = prev.filter((e) => e.id !== optimistic.id);
        return [...withoutOptimistic, ...res.events];
      });

      const nextSessions = await listChatSessions({
        agentKey: selectedAgentKey,
      });
      setSessions(nextSessions);
    } catch (e) {
      toast.error("Failed to send message", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsSending(false);
    }
  }

  const sessionsContent = (() => {
    if (isLoadingSessions) {
      return (
        <div className="text-muted-foreground text-sm">Loading sessions…</div>
      );
    }
    if (sessions.length === 0) {
      return (
        <div className="text-muted-foreground text-sm">No sessions yet.</div>
      );
    }
    return (
      <div className="space-y-1">
        {sessions.map((s) => {
          const isActive = s.id === selectedSessionId;
          const title = s.title || "Untitled session";
          const preview = s.lastEvent?.content?.slice(0, 80) ?? "";
          return (
            <button
              className={cn(
                "w-full rounded-md border px-2 py-2 text-left text-sm hover:bg-accent",
                isActive ? "bg-accent" : ""
              )}
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              type="button"
            >
              <div className="truncate font-medium">{title}</div>
              <div className="truncate text-muted-foreground text-xs">
                {preview}
              </div>
            </button>
          );
        })}
      </div>
    );
  })();

  const messagesContent = (() => {
    if (!selectedSessionId) {
      return (
        <div className="text-muted-foreground text-sm">
          Pick a session on the left, or start a new one.
        </div>
      );
    }
    if (isLoadingEvents) {
      return (
        <div className="text-muted-foreground text-sm">Loading messages…</div>
      );
    }
    if (events.length === 0) {
      return (
        <div className="text-muted-foreground text-sm">
          No messages yet. Say hi!
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {events.map((e) => {
          const isUser = e.role === "user";
          return (
            <div
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
              key={e.id}
            >
              <div
                className={cn(
                  "max-w-[min(720px,85%)] whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm",
                  isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {e.content}
              </div>
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <div className="h-full">
      <div className="flex h-full min-h-0">
        <aside className="flex w-80 min-w-0 flex-col border-r">
          <div className="space-y-2 p-2">
            <div className="font-medium text-sm">Agent</div>
            <select
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
              onChange={(e) => setSelectedAgentKey(e.target.value)}
              value={selectedAgentKey}
            >
              {agents.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button className="w-full" onClick={onStartNewSession}>
              Start new session
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-2">{sessionsContent}</div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="border-b p-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">
                  {selectedSession
                    ? selectedSession.title || "Untitled session"
                    : "No session selected"}
                </div>
                <div className="truncate text-muted-foreground text-xs">
                  {selectedAgent
                    ? `${selectedAgent.name} — ${selectedAgent.description}`
                    : "Loading agent…"}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                Signed in as {session.data?.user.email}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3" ref={scrollRef}>
            {messagesContent}
          </div>

          <form
            className="flex gap-2 border-t p-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await onSendMessage();
            }}
          >
            <Input
              disabled={!selectedSessionId || isSending}
              onChange={(e) => setComposer(e.target.value)}
              placeholder={
                selectedSessionId
                  ? "Send a message…"
                  : "Select or create a session first…"
              }
              value={composer}
            />
            <Button
              disabled={
                !selectedSessionId || isSending || composer.trim().length === 0
              }
              type="submit"
            >
              Send
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
