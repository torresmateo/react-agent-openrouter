import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { authClient } from "@/lib/auth-client";
import {
  createSession,
  deleteSession,
  getSession,
  getSessions,
  sendMessage,
} from "@/lib/chat-api";

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

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
};

function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch all sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: getSessions,
  });

  // Fetch selected session with messages
  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["chat-session", selectedSessionId],
    queryFn: () => (selectedSessionId ? getSession(selectedSessionId) : null),
    enabled: !!selectedSessionId,
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setSelectedSessionId(newSession.id);
    },
    onError: () => {
      toast.error("Failed to create new session");
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (selectedSessionId === deletedId) {
        setSelectedSessionId(null);
      }
      toast.success("Session deleted");
    },
    onError: () => {
      toast.error("Failed to delete session");
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => sendMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["chat-session", selectedSessionId],
      });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const handleNewSession = () => {
    createSessionMutation.mutate(undefined);
  };

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    deleteSessionMutation.mutate(id);
  };

  const handleSendMessage = async (content: string) => {
    if (selectedSessionId) {
      sendMessageMutation.mutate({ sessionId: selectedSessionId, content });
    } else {
      // Create a new session first, then send the message
      const newSession = await createSessionMutation.mutateAsync(undefined);
      sendMessageMutation.mutate({ sessionId: newSession.id, content });
    }
  };

  const messages: Message[] = (currentSession?.messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    role: m.role as "user" | "assistant",
    createdAt: m.createdAt,
  }));

  return (
    <div className="flex h-full">
      <ChatSidebar
        isLoading={sessionsLoading}
        onDeleteSession={handleDeleteSession}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        selectedSessionId={selectedSessionId}
        sessions={sessions}
      />
      <div className="flex flex-1 flex-col">
        {selectedSessionId ? (
          <>
            <ChatMessages
              isLoading={sessionLoading || sendMessageMutation.isPending}
              messages={messages}
            />
            <ChatInput
              disabled={sendMessageMutation.isPending}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">Welcome to Chat</p>
                <p className="text-sm">
                  Select a session from the sidebar or start a new one
                </p>
              </div>
            </div>
            <ChatInput
              disabled={createSessionMutation.isPending}
              onSendMessage={handleSendMessage}
              placeholder="Type a message to start a new session..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
