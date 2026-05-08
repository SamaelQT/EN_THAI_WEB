import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sseBroadcast } from "@/lib/sse-store";
import { getReviewSets } from "@/services/review.service";

// GET — list available review sets (for admin to pick from)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? undefined;
  const sets = await getReviewSets(language);
  return NextResponse.json({ sets });
}

// POST — admin creates a new quiz session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: groupId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (membership?.role !== "admin") return NextResponse.json({ error: "Chỉ admin mới tạo được quiz" }, { status: 403 });

  // Ensure no active session
  const existing = await prisma.quizSession.findFirst({
    where: { groupId, status: { in: ["waiting", "active"] } },
  });
  if (existing) return NextResponse.json({ error: "Đang có quiz đang diễn ra" }, { status: 409 });

  const { reviewSetId } = await req.json();
  if (!reviewSetId) return NextResponse.json({ error: "Thiếu reviewSetId" }, { status: 400 });

  const reviewSet = await prisma.reviewSet.findUnique({
    where: { id: reviewSetId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!reviewSet || reviewSet.questions.length === 0) {
    return NextResponse.json({ error: "Bộ câu hỏi không tồn tại hoặc rỗng" }, { status: 404 });
  }

  const quizSession = await prisma.quizSession.create({
    data: {
      groupId,
      reviewSetId,
      createdById: userId,
      status: "active",
      currentQuestion: 0,
      startedAt: new Date(),
      participants: { create: { userId } },
    },
  });

  const firstQ = reviewSet.questions[0];
  sseBroadcast(groupId, {
    type: "quiz-start",
    sessionId: quizSession.id,
    title: reviewSet.title,
    questionCount: reviewSet.questions.length,
    questionIndex: 0,
    question: firstQ.question,
    options: firstQ.options,
  });

  return NextResponse.json({ sessionId: quizSession.id });
}
