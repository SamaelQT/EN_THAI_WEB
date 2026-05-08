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
  if (membership?.role !== "admin") {
    return NextResponse.json({ error: "Chỉ admin mới điều khiển được quiz" }, { status: 403 });
  }

  const quizSession = await prisma.quizSession.findUnique({ where: { id: sessionId } });
  if (!quizSession || quizSession.groupId !== groupId || quizSession.status !== "active") {
    return NextResponse.json({ error: "Phiên quiz không hợp lệ" }, { status: 404 });
  }

  const reviewSet = await prisma.reviewSet.findUnique({
    where: { id: quizSession.reviewSetId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!reviewSet) return NextResponse.json({ error: "Không tìm thấy bộ câu hỏi" }, { status: 404 });

  const currentIndex = quizSession.currentQuestion;
  const currentQuestion = reviewSet.questions[currentIndex];
  if (!currentQuestion) {
    return NextResponse.json({ error: "Câu hỏi không tồn tại" }, { status: 500 });
  }
  const correctAnswer = currentQuestion.answer;

  // Get all answers for this question
  const answers = await prisma.quizAnswer.findMany({
    where: { sessionId, questionIndex: currentIndex },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const prevResults = answers.map((a) => ({ userId: a.userId, correct: a.isCorrect }));

  // Update scores for correct answers
  const correctUserIds = answers.filter((a) => a.isCorrect).map((a) => a.userId);
  if (correctUserIds.length > 0) {
    await prisma.$transaction(
      correctUserIds.map((uid) =>
        prisma.quizParticipant.upsert({
          where: { sessionId_userId: { sessionId, userId: uid } },
          update: { score: { increment: 1 } },
          create: { sessionId, userId: uid, score: 1 },
        })
      )
    );
  }

  const isLast = currentIndex >= reviewSet.questions.length - 1;

  if (!isLast) {
    const nextIndex = currentIndex + 1;
    const nextQ = reviewSet.questions[nextIndex];

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { currentQuestion: nextIndex },
    });

    sseBroadcast(groupId, {
      type: "quiz-next",
      sessionId,
      prevCorrectAnswer: correctAnswer,
      prevResults,
      questionIndex: nextIndex,
      question: nextQ.question,
      options: nextQ.options,
    });
  } else {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: "finished", finishedAt: new Date() },
    });

    const participants = await prisma.quizParticipant.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { score: "desc" },
    });

    const leaderboard = participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      image: p.user.image,
      score: p.score,
    }));

    sseBroadcast(groupId, {
      type: "quiz-finish",
      sessionId,
      prevCorrectAnswer: correctAnswer,
      prevResults,
      leaderboard,
    });
  }

  return NextResponse.json({ ok: true });
}
