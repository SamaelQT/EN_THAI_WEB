import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/study-groups/[id]/messages — fetch last 50 messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;
  const { id: groupId } = await params;

  // Must be a member to read messages
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: uid } },
  });
  if (!membership) return NextResponse.json({ error: "Bạn không trong nhóm này" }, { status: 403 });

  const messages = await prisma.studyGroupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ messages });
}

// POST /api/study-groups/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;
  const { id: groupId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: uid } },
  });
  if (!membership) return NextResponse.json({ error: "Bạn không trong nhóm này" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Tin nhắn không được trống" }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: "Tin nhắn tối đa 1000 ký tự" }, { status: 400 });

  const message = await prisma.studyGroupMessage.create({
    data: { groupId, userId: uid, content: content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ message });
}
