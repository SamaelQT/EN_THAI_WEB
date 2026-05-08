import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sseBroadcast } from "@/lib/sse-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: groupId, sessionId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const quizSession = await prisma.quizSession.findUnique({
    where: { id: sessionId },
  });
  if (!quizSession || quizSession.groupId !== groupId) {
    return NextResponse.json({ error: "Không tìm thấy phiên quiz" }, { status: 404 });
  }
  if (quizSession.status !== "active") {
    return NextResponse.json({ error: "Phiên quiz không còn hoạt động" }, { status: 409 });
  }

  const { answer } = await req.json();
  if (typeof answer !== "number" || answer < 0 || answer > 3) {
    return NextResponse.json({ error: "Đáp án không hợp lệ" }, { status: 400 });
  }

  const questionIndex = quizSession.currentQuestion;

  // Prevent double-answering the same question
  const existing = await prisma.quizAnswer.findUnique({
    where: { sessionId_userId_questionIndex: { sessionId, userId, questionIndex } },
  });
  if (existing) return NextResponse.json({ error: "Đã trả lời câu này rồi" }, { status: 409 });

  // Determine correctness (fetch question)
  const reviewSet = await prisma.reviewSet.findUnique({
    where: { id: quizSession.reviewSetId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  const correctAnswer = reviewSet?.questions[questionIndex]?.answer ?? -1;
  const isCorrect = answer === correctAnswer;

  await prisma.$transaction([
    prisma.quizAnswer.create({ data: { sessionId, userId, questionIndex, answer, isCorrect } }),
    prisma.quizParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: {},
      create: { sessionId, userId },
    }),
  ]);

  sseBroadcast(groupId, { type: "quiz-answered", sessionId, userId, questionIndex });

  return NextResponse.json({ ok: true });
}
