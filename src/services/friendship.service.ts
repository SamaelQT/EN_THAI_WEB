import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";

export class FriendshipError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function getFriends(userId: string) {
  const [friendships, requests] = await Promise.all([
    prisma.friendship.findMany({
      where: { OR: [{ initiatorId: userId }, { receiverId: userId }], status: "accepted" },
      include: {
        initiator: { select: { id: true, name: true, image: true, totalXp: true } },
        receiver: { select: { id: true, name: true, image: true, totalXp: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "pending" },
      include: { initiator: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  const friends = friendships.map((f) => f.initiatorId === userId ? f.receiver : f.initiator);
  return { friends, requests };
}

export async function sendFriendRequest(userId: string, userName: string, email: string) {
  if (!email) throw new FriendshipError("Email required", 400);

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) throw new FriendshipError("Người dùng không tồn tại", 404);
  if (target.id === userId) throw new FriendshipError("Không thể kết bạn với chính mình", 400);

  const existing = await prisma.friendship.findFirst({
    where: { OR: [{ initiatorId: userId, receiverId: target.id }, { initiatorId: target.id, receiverId: userId }] },
  });

  if (existing) {
    if (existing.status === "accepted") throw new FriendshipError("Đã là bạn bè rồi", 409);
    if (existing.initiatorId === target.id && existing.receiverId === userId) {
      await prisma.friendship.update({ where: { id: existing.id }, data: { status: "accepted" } });
      await createNotification({ userId: target.id, type: "friend_accepted", title: "Kết bạn thành công! 🎉", body: `${userName} đã chấp nhận yêu cầu kết bạn của bạn.` });
      return { message: "Đã chấp nhận yêu cầu kết bạn ngược lại", status: 200 };
    }
    throw new FriendshipError("Đã gửi yêu cầu rồi", 409);
  }

  const friendship = await prisma.friendship.create({ data: { initiatorId: userId, receiverId: target.id } });
  await createNotification({ userId: target.id, type: "friend_request", title: "Yêu cầu kết bạn mới", body: `${userName} muốn kết bạn với bạn.` });
  return { friendship, status: 201 };
}

export async function respondFriendRequest(userId: string, userName: string, friendshipId: string, action: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== userId) throw new FriendshipError("Not found", 404);

  if (action === "accept") {
    await prisma.friendship.update({ where: { id: friendshipId }, data: { status: "accepted" } });
    await createNotification({ userId: friendship.initiatorId, type: "friend_request", title: "Yêu cầu kết bạn được chấp nhận", body: `${userName} đã chấp nhận yêu cầu kết bạn của bạn!` });
    return { message: "Đã chấp nhận" };
  }

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return { message: "Đã từ chối" };
  }

  throw new FriendshipError("Invalid action", 400);
}
