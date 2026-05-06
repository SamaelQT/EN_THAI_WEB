import { prisma } from "@/lib/db";

export class StudyGroupError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const memberInclude = { members: { include: { user: { select: { id: true, name: true, image: true } } } } };

export async function getStudyGroups(userId: string) {
  const [myGroups, publicGroups] = await Promise.all([
    prisma.studyGroup.findMany({ where: { members: { some: { userId } } }, include: memberInclude }),
    prisma.studyGroup.findMany({ where: { members: { none: { userId } } }, include: memberInclude, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { myGroups, publicGroups };
}

export async function createStudyGroup(userId: string, opts: { name: string; description?: string; language: string; maxMembers?: number }) {
  const { name, description, language, maxMembers } = opts;
  if (!name?.trim() || !language) throw new StudyGroupError("Tên nhóm và ngôn ngữ là bắt buộc", 400);

  return prisma.studyGroup.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      language,
      maxMembers: maxMembers ?? 10,
      createdById: userId,
      members: { create: { userId, role: "admin" } },
    },
    include: memberInclude,
  });
}

export async function joinGroup(userId: string, groupId: string) {
  const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, include: { members: true } });
  if (!group) throw new StudyGroupError("Không tìm thấy nhóm", 404);
  if (group.members.some((m) => m.userId === userId)) throw new StudyGroupError("Đã là thành viên", 409);
  if (group.members.length >= group.maxMembers) throw new StudyGroupError("Nhóm đã đầy", 409);

  await prisma.studyGroupMember.create({ data: { groupId, userId, role: "member" } });
  return { message: "Đã tham gia nhóm" };
}

export async function kickMember(adminId: string, groupId: string, targetUserId: string) {
  const myMembership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: adminId } } });
  if (myMembership?.role !== "admin") throw new StudyGroupError("Chỉ admin mới có thể kick thành viên", 403);
  if (!targetUserId) throw new StudyGroupError("Thiếu targetUserId", 400);
  if (targetUserId === adminId) throw new StudyGroupError("Không thể kick chính mình", 400);

  const target = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
  if (!target) throw new StudyGroupError("Thành viên không tồn tại", 404);

  await prisma.studyGroupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } });
  return { message: "Đã xóa thành viên khỏi nhóm" };
}

export async function leaveOrDissolveGroup(userId: string, groupId: string) {
  const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!member) throw new StudyGroupError("Không phải thành viên", 404);

  if (member.role === "admin") {
    await prisma.studyGroup.delete({ where: { id: groupId } });
    return { message: "Đã xóa nhóm" };
  }

  await prisma.studyGroupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  return { message: "Đã rời nhóm" };
}

export async function getMessages(userId: string, groupId: string) {
  const membership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw new StudyGroupError("Bạn không trong nhóm này", 403);

  return prisma.studyGroupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export async function sendMessage(userId: string, groupId: string, content: string) {
  const membership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) throw new StudyGroupError("Bạn không trong nhóm này", 403);
  if (!content?.trim()) throw new StudyGroupError("Tin nhắn không được trống", 400);
  if (content.length > 1000) throw new StudyGroupError("Tin nhắn tối đa 1000 ký tự", 400);

  return prisma.studyGroupMessage.create({
    data: { groupId, userId, content: content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}
