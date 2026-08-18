import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sseBroadcast } from "@/lib/sse-store";

/**
 * DELETE — abandon a quiz session.
 *
 * Without this an admin who closed the tab left the session stuck on "active" forever,
 * and the group could never start another quiz ("Đang có quiz đang diễn ra"). Any admin
 * can cancel; so can anyone once the session has been idle for over an hour.
 */
export async function DELETE(
  _req: NextRequest,
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

  const quizSession = await prisma.quizSession.findUnique({ where: { id: sessionId } });
  if (!quizSession || quizSession.groupId !== groupId) {
    return NextResponse.json({ error: "Không tìm thấy phiên quiz" }, { status: 404 });
  }
  if (quizSession.status === "finished") {
    return NextResponse.json({ ok: true, alreadyFinished: true });
  }

  const startedAt = quizSession.startedAt ?? quizSession.createdAt;
  const isStale = Date.now() - startedAt.getTime() > 60 * 60 * 1000;

  if (membership.role !== "admin" && !isStale) {
    return NextResponse.json(
      { error: "Chỉ admin mới hủy được quiz đang diễn ra" },
      { status: 403 },
    );
  }

  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { status: "finished", finishedAt: new Date() },
  });

  const participants = await prisma.quizParticipant.findMany({
    where: { sessionId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { score: "desc" },
  });

  sseBroadcast(groupId, {
    type: "quiz-finish",
    sessionId,
    cancelled: true,
    leaderboard: participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      image: p.user.image,
      score: p.score,
    })),
  });

  return NextResponse.json({ ok: true, cancelled: true });
}
