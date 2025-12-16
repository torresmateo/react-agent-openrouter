export type ChatAgent = {
  key: string;
  name: string;
  description: string;
};

export type ChatEvent = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  agentKey: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastEvent: Pick<ChatEvent, "role" | "content" | "createdAt"> | null;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function listChatAgents(): Promise<ChatAgent[]> {
  const data = await apiFetch<{ agents: ChatAgent[] }>("/api/chat/agents");
  return data.agents;
}

export async function listChatSessions(args: {
  agentKey?: string;
}): Promise<ChatSession[]> {
  const qs = args.agentKey
    ? `?agentKey=${encodeURIComponent(args.agentKey)}`
    : "";
  const data = await apiFetch<{ sessions: ChatSession[] }>(
    `/api/chat/sessions${qs}`
  );
  return data.sessions;
}

export async function createChatSession(args: {
  agentKey: string;
  title?: string;
}): Promise<ChatSession> {
  const data = await apiFetch<{ session: ChatSession }>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify(args),
  });
  return data.session;
}

export async function getChatSession(args: {
  sessionId: string;
}): Promise<{ session: ChatSession; events: ChatEvent[] }> {
  return await apiFetch<{ session: ChatSession; events: ChatEvent[] }>(
    `/api/chat/sessions/${encodeURIComponent(args.sessionId)}`
  );
}

export async function sendChatMessage(args: {
  sessionId: string;
  content: string;
}): Promise<{ events: ChatEvent[] }> {
  return await apiFetch<{ events: ChatEvent[] }>(
    `/api/chat/sessions/${encodeURIComponent(args.sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content: args.content }),
    }
  );
}
