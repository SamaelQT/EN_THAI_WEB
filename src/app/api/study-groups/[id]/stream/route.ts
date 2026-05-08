import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sseSubscribe, sseUnsubscribe, sseGetVoiceUsers } from "@/lib/sse-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const { id: groupId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });

  const [rawMessages, activeQuiz] = await Promise.all([
    prisma.studyGroupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    prisma.quizSession.findFirst({
      where: { groupId, status: "active" },
      include: { reviewSet: { include: { questions: { orderBy: { order: "asc" } } } } },
    }),
  ]);

  const messages = rawMessages.reverse();
  const voiceUsers = sseGetVoiceUsers(groupId);

  // Build quiz state (without exposing correct answers)
  const quizState = activeQuiz
    ? {
        sessionId: activeQuiz.id,
        title: activeQuiz.reviewSet.title,
        questionCount: activeQuiz.reviewSet.questions.length,
        questionIndex: activeQuiz.currentQuestion,
        question: activeQuiz.reviewSet.questions[activeQuiz.currentQuestion]?.question ?? "",
        options: activeQuiz.reviewSet.questions[activeQuiz.currentQuestion]?.options ?? [],
      }
    : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        clearInterval(keepalive);
        sseUnsubscribe(groupId, userId);
        try { controller.close(); } catch { /* already closed */ }
      }

      function send(data: string) {
        try { controller.enqueue(encoder.encode(data)); } catch { cleanup(); }
      }

      send(`data: ${JSON.stringify({ type: "init", messages, voiceUsers, quizState })}\n\n`);
      sseSubscribe(groupId, userId, send);

      const keepalive = setInterval(() => send(": ping\n\n"), 25000);

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
