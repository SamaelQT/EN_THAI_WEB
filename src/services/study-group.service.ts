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

const userSelect = { id: true, name: true, image: true };

export async function createInvite(inviterId: string, groupId: string, inviteeId: string) {
  const myMembership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: inviterId } } });
  if (!myMembership) throw new StudyGroupError("Bạn không trong nhóm này", 403);

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [{ initiatorId: inviterId, receiverId: inviteeId }, { initiatorId: inviteeId, receiverId: inviterId }],
      status: "accepted",
    },
  });
  if (!friendship) throw new StudyGroupError("Người dùng này chưa là bạn bè của bạn", 403);

  const alreadyMember = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: inviteeId } } });
  if (alreadyMember) throw new StudyGroupError("Người dùng đã trong nhóm", 409);

  const activePending = await prisma.studyGroupInvite.findFirst({
    where: { groupId, inviteeId, status: { in: ["pending_admin", "pending_invitee"] } },
  });
  if (activePending) throw new StudyGroupError("Đã có lời mời đang chờ cho người này", 409);

  const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, include: { members: true } });
  if (!group) throw new StudyGroupError("Không tìm thấy nhóm", 404);
  if (group.members.length >= group.maxMembers) throw new StudyGroupError("Nhóm đã đầy", 409);

  const isAdmin = myMembership.role === "admin";
  const status = isAdmin ? "pending_invitee" : "pending_admin";

  await prisma.studyGroupInvite.create({ data: { groupId, inviterId, inviteeId, status } });
  return { status };
}

export async function getGroupPendingInvites(requesterId: string, groupId: string) {
  const membership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: requesterId } } });
  if (membership?.role !== "admin") throw new StudyGroupError("Chỉ admin mới xem được", 403);

  return prisma.studyGroupInvite.findMany({
    where: { groupId, status: "pending_admin" },
    include: { inviter: { select: userSelect }, invitee: { select: userSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export async function adminRespondInvite(adminId: string, groupId: string, inviteId: string, action: "approve" | "reject") {
  const membership = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: adminId } } });
  if (membership?.role !== "admin") throw new StudyGroupError("Chỉ admin mới duyệt được", 403);

  const invite = await prisma.studyGroupInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.groupId !== groupId) throw new StudyGroupError("Không tìm thấy lời mời", 404);
  if (invite.status !== "pending_admin") throw new StudyGroupError("Lời mời không hợp lệ", 409);

  const newStatus = action === "approve" ? "pending_invitee" : "rejected";
  await prisma.studyGroupInvite.update({ where: { id: inviteId }, data: { status: newStatus } });
  return { status: newStatus };
}

export async function getMyInvites(userId: string) {
  return prisma.studyGroupInvite.findMany({
    where: { inviteeId: userId, status: "pending_invitee" },
    include: {
      inviter: { select: userSelect },
      group: {
        include: { members: { select: { id: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function respondInvite(userId: string, inviteId: string, action: "accept" | "reject") {
  const invite = await prisma.studyGroupInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.inviteeId !== userId) throw new StudyGroupError("Không tìm thấy lời mời", 404);
  if (invite.status !== "pending_invitee") throw new StudyGroupError("Lời mời không hợp lệ", 409);

  if (action === "reject") {
    await prisma.studyGroupInvite.update({ where: { id: inviteId }, data: { status: "rejected" } });
    return { status: "rejected" };
  }

  const group = await prisma.studyGroup.findUnique({ where: { id: invite.groupId }, include: { members: true } });
  if (!group) throw new StudyGroupError("Nhóm không còn tồn tại", 404);
  if (group.members.length >= group.maxMembers) throw new StudyGroupError("Nhóm đã đầy", 409);

  const alreadyMember = group.members.some((m) => m.userId === userId);
  if (alreadyMember) throw new StudyGroupError("Bạn đã trong nhóm này", 409);

  await prisma.$transaction([
    prisma.studyGroupMember.create({ data: { groupId: invite.groupId, userId, role: "member" } }),
    prisma.studyGroupInvite.update({ where: { id: inviteId }, data: { status: "accepted" } }),
  ]);
  return { status: "accepted" };
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
