import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST — join group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;
  const { id: groupId } = await params;

  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });

  const alreadyMember = group.members.some((m) => m.userId === uid);
  if (alreadyMember) return NextResponse.json({ error: "Đã là thành viên" }, { status: 409 });

  if (group.members.length >= group.maxMembers)
    return NextResponse.json({ error: "Nhóm đã đầy" }, { status: 409 });

  await prisma.studyGroupMember.create({ data: { groupId, userId: uid, role: "member" } });
  return NextResponse.json({ message: "Đã tham gia nhóm" });
}

// PATCH — admin kicks a member
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;
  const { id: groupId } = await params;

  // Must be admin
  const myMembership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: uid } },
  });
  if (myMembership?.role !== "admin")
    return NextResponse.json({ error: "Chỉ admin mới có thể kick thành viên" }, { status: 403 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Thiếu targetUserId" }, { status: 400 });
  if (targetUserId === uid) return NextResponse.json({ error: "Không thể kick chính mình" }, { status: 400 });

  const target = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) return NextResponse.json({ error: "Thành viên không tồn tại" }, { status: 404 });

  await prisma.studyGroupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  return NextResponse.json({ message: "Đã xóa thành viên khỏi nhóm" });
}

// DELETE — leave or dissolve group
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;
  const { id: groupId } = await params;

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: uid } },
  });
  if (!member) return NextResponse.json({ error: "Không phải thành viên" }, { status: 404 });

  if (member.role === "admin") {
    await prisma.studyGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ message: "Đã xóa nhóm" });
  }

  await prisma.studyGroupMember.delete({ where: { groupId_userId: { groupId, userId: uid } } });
  return NextResponse.json({ message: "Đã rời nhóm" });
}
