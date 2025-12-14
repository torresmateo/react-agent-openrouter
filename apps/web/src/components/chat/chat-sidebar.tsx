import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ content: string }>;
};

type ChatSidebarProps = {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isLoading?: boolean;
};

function SessionList({
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
}: Pick<
  ChatSidebarProps,
  "sessions" | "selectedSessionId" | "onSelectSession" | "onDeleteSession"
>) {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No sessions yet. Start a new one!
      </div>
    );
  }

  return (
    <>
      {sessions.map((session) => (
        <div
          className={cn(
            "group flex items-center justify-between rounded-md text-sm transition-colors",
            selectedSessionId === session.id &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          key={session.id}
        >
          <button
            className={cn(
              "flex-1 truncate px-3 py-2 text-left hover:bg-sidebar-accent",
              selectedSessionId !== session.id && "rounded-md"
            )}
            onClick={() => onSelectSession(session.id)}
            type="button"
          >
            {session.title || "Untitled Session"}
          </button>
          <button
            aria-label="Delete session"
            className="px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDeleteSession(session.id)}
            type="button"
          >
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
    </>
  );
}

export function ChatSidebar({
  sessions,
  selectedSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isLoading,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="p-3">
        <Button className="w-full gap-2" onClick={onNewSession}>
          <MessageSquarePlus className="size-4" />
          New Session
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading sessions...
            </div>
          ) : (
            <SessionList
              onDeleteSession={onDeleteSession}
              onSelectSession={onSelectSession}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
