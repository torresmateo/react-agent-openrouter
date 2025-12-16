import "dotenv/config";
import { cors } from "@elysiajs/cors";
import { auth } from "@react-agents/auth";
import prisma from "@react-agents/db";
import { Elysia } from "elysia";
import { z } from "zod";

type ChatAgent = {
  key: string;
  name: string;
  description: string;
  model?: string;
};

type BetterAuthSessionLike = {
  user?: { id?: string };
  session?: { userId?: string };
  data?: {
    user?: { id?: string };
    session?: { userId?: string };
  };
};

type OpenRouterChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const CHAT_AGENTS: ChatAgent[] = [
  {
    key: "helper",
    name: "Helper",
    description: "General-purpose assistant for everyday tasks.",
    model: "openai/gpt-4o-mini",
  },
  {
    key: "debugger",
    name: "Debugger",
    description: "Helps debug code and explains failures step-by-step.",
    model: "openai/gpt-4o-mini",
  },
];

async function requireUserId(request: Request): Promise<string> {
  const maybeApi = (
    auth as unknown as {
      api?: { getSession?: (args: unknown) => Promise<unknown> };
    }
  ).api;

  const session: BetterAuthSessionLike | null = maybeApi?.getSession
    ? ((await maybeApi.getSession({
        headers: request.headers,
      })) as BetterAuthSessionLike | null)
    : await (async () => {
        // Fallback: invoke the auth handler against the get-session endpoint.
        const url = new URL(request.url);
        url.pathname = "/api/auth/get-session";
        const res = await auth.handler(
          new Request(url.toString(), {
            method: "GET",
            headers: request.headers,
          })
        );
        if (!res.ok) {
          return null;
        }
        return (await res
          .json()
          .catch(() => null)) as BetterAuthSessionLike | null;
      })();

  // better-auth shapes differ slightly between server/api and client
  const userId =
    session?.user?.id ??
    session?.data?.user?.id ??
    session?.session?.userId ??
    session?.data?.session?.userId;

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return userId;
}

async function generateAgentReply(args: {
  agent: ChatAgent;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}): Promise<string> {
  const { agent, messages } = args;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return `(${agent.name}) I’m running in mock mode (no OPENROUTER_API_KEY). You said:\n\n${lastUser}`;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model ?? "openai/gpt-4o-mini",
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return `(${agent.name}) Error calling OpenRouter: ${res.status} ${res.statusText}${text ? `\n\n${text}` : ""}`;
  }

  const data = (await res.json()) as OpenRouterChatCompletionsResponse;
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim().length > 0
    ? content
    : `(${agent.name}) Empty response from model.`;
}

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .all("/api/auth/*", (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .group("/api/chat", (chat) =>
    chat
      .get("/agents", () => ({ agents: CHAT_AGENTS }))
      .get("/sessions", async ({ request }) => {
        const userId = await requireUserId(request);
        const url = new URL(request.url);
        const agentKey = url.searchParams.get("agentKey");

        const where = agentKey ? { userId, agentKey } : { userId };

        const sessions = await prisma.chatSession.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            agentKey: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { content: true, role: true, createdAt: true },
            },
          },
        });

        return {
          sessions: sessions.map((s) => ({
            id: s.id,
            agentKey: s.agentKey,
            title: s.title,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            lastEvent: s.messages[0] ?? null,
          })),
        };
      })
      .post("/sessions", async ({ request }) => {
        const userId = await requireUserId(request);
        const body = z
          .object({
            agentKey: z.string().min(1),
            title: z.string().min(1).optional(),
          })
          .parse(await request.json());

        const session = await prisma.chatSession.create({
          data: {
            userId,
            agentKey: body.agentKey,
            title: body.title,
          },
          select: {
            id: true,
            agentKey: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return { session };
      })
      .get("/sessions/:sessionId", async ({ request, params }) => {
        const userId = await requireUserId(request);
        const session = await prisma.chatSession.findFirst({
          where: { id: params.sessionId, userId },
          select: {
            id: true,
            agentKey: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!session) {
          throw new Response("Not found", { status: 404 });
        }

        const events = await prisma.chatMessage.findMany({
          where: { sessionId: session.id },
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        });

        return { session, events };
      })
      .post("/sessions/:sessionId/messages", async ({ request, params }) => {
        const userId = await requireUserId(request);
        const body = z
          .object({
            content: z.string().min(1),
          })
          .parse(await request.json());

        const session = await prisma.chatSession.findFirst({
          where: { id: params.sessionId, userId },
          select: { id: true, agentKey: true },
        });

        if (!session) {
          throw new Response("Not found", { status: 404 });
        }

        const agent =
          CHAT_AGENTS.find((a) => a.key === session.agentKey) ??
          CHAT_AGENTS.at(0);
        if (!agent) {
          throw new Response("No agents configured", { status: 500 });
        }

        const userEvent = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: "user",
            content: body.content,
          },
          select: { id: true, role: true, content: true, createdAt: true },
        });

        const history = await prisma.chatMessage.findMany({
          where: { sessionId: session.id },
          orderBy: { createdAt: "asc" },
          take: 50,
          select: { role: true, content: true },
        });

        const assistantContent = await generateAgentReply({
          agent,
          messages: history.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          })),
        });

        const assistantEvent = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: "assistant",
            content: assistantContent,
          },
          select: { id: true, role: true, content: true, createdAt: true },
        });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        });

        return { events: [userEvent, assistantEvent] };
      })
  )
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
