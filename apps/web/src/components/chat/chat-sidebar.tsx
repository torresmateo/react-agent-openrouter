import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  agentName: string;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  agentName,
}: ChatSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (days === 1) {
      return "Yesterday";
    }
    if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-full w-72 flex-col border-border border-r bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-sidebar-border border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <MessageSquare className="size-4 text-white" />
          </div>
          <span className="font-semibold text-sidebar-foreground">
            {agentName}
          </span>
        </div>
      </div>

      {/* New Session Button */}
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
          onClick={onNewSession}
        >
          <Plus className="size-4" />
          Start new session
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted-foreground text-sm">
              No sessions yet.
              <br />
              Start a new conversation!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-1 rounded-lg p-3 transition-all duration-200",
                  activeSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50"
                )}
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                onMouseEnter={() => setHoveredSession(session.id)}
                onMouseLeave={() => setHoveredSession(null)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 font-medium text-sm">
                    {session.title}
                  </span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatTimestamp(session.timestamp)}
                  </span>
                </div>
                <p className="line-clamp-2 text-muted-foreground text-xs">
                  {session.lastMessage}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {session.messageCount} messages
                  </span>

                  {/* Delete button */}
                  {hoveredSession === session.id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete session</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-sidebar-border border-t p-3">
        <p className="text-center text-muted-foreground text-xs">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
