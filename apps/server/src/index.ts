import "dotenv/config";
import { cors } from "@elysiajs/cors";
import { auth } from "@react-agents/auth";
import prisma from "@react-agents/db";
import { Elysia, t } from "elysia";

async function getSessionFromRequest(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
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
  // Get all chat sessions for the current user
  .get("/api/chat/sessions", async ({ request, status }) => {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return status(401);
    }
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return sessions;
  })
  // Create a new chat session
  .post(
    "/api/chat/sessions",
    async ({ request, body, status }) => {
      const session = await getSessionFromRequest(request);
      if (!session?.user) {
        return status(401);
      }
      const chatSession = await prisma.chatSession.create({
        data: {
          title: body.title || null,
          userId: session.user.id,
        },
      });
      return chatSession;
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
      }),
    }
  )
  // Get a specific chat session with all messages
  .get("/api/chat/sessions/:id", async ({ request, params, status }) => {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return status(401);
    }
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!chatSession) {
      return status(404);
    }
    return chatSession;
  })
  // Add a message to a chat session
  .post(
    "/api/chat/sessions/:id/messages",
    async ({ request, params, body, status }) => {
      const session = await getSessionFromRequest(request);
      if (!session?.user) {
        return status(401);
      }
      // Verify the session belongs to the user
      const chatSession = await prisma.chatSession.findFirst({
        where: {
          id: params.id,
          userId: session.user.id,
        },
      });
      if (!chatSession) {
        return status(404);
      }
      // Create the user message
      const userMessage = await prisma.chatMessage.create({
        data: {
          content: body.content,
          role: "user",
          sessionId: params.id,
        },
      });
      // Update session title if it's the first message
      if (!chatSession.title) {
        const title =
          body.content.length > 50
            ? `${body.content.substring(0, 50)}...`
            : body.content;
        await prisma.chatSession.update({
          where: { id: params.id },
          data: { title },
        });
      }
      // Generate a simple assistant response (placeholder for actual agent integration)
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          content: `I received your message: "${body.content}". This is a placeholder response - agent integration coming soon!`,
          role: "assistant",
          sessionId: params.id,
        },
      });
      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });
      return { userMessage, assistantMessage };
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
  // Delete a chat session
  .delete("/api/chat/sessions/:id", async ({ request, params, status }) => {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return status(401);
    }
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    if (!chatSession) {
      return status(404);
    }
    await prisma.chatSession.delete({
      where: { id: params.id },
    });
    return { success: true };
  })
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
