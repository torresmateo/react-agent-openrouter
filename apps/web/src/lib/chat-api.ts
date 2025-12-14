const API_BASE = import.meta.env.VITE_SERVER_URL;

type ChatSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
};

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  sessionId: string;
};

function fetchWithCredentials(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function getSessions(): Promise<ChatSession[]> {
  const response = await fetchWithCredentials(`${API_BASE}/api/chat/sessions`);
  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return response.json();
}

export async function createSession(title?: string): Promise<ChatSession> {
  const response = await fetchWithCredentials(`${API_BASE}/api/chat/sessions`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error("Failed to create session");
  }
  return response.json();
}

export async function getSession(id: string): Promise<ChatSession> {
  const response = await fetchWithCredentials(
    `${API_BASE}/api/chat/sessions/${id}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch session");
  }
  return response.json();
}

export async function sendMessage(
  sessionId: string,
  content: string
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const response = await fetchWithCredentials(
    `${API_BASE}/api/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to send message");
  }
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetchWithCredentials(
    `${API_BASE}/api/chat/sessions/${id}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to delete session");
  }
}
