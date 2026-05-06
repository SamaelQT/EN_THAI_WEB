import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";

export async function sendStreakGift(senderId: string, senderName: string, receiverId: string, language: string, message?: string) {
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: senderId, receiverId, status: "accepted" },
        { initiatorId: receiverId, receiverId: senderId, status: "accepted" },
      ],
    },
  });
  if (!isFriend) throw Object.assign(new Error("Not friends"), { status: 403 });

  await prisma.streakGift.create({ data: { senderId, receiverId, language, message } });

  await prisma.streak.upsert({
    where: { userId_language: { userId: receiverId, language } },
    update: { frozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    create: { userId: receiverId, language, frozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await createNotification({ userId: receiverId, type: "streak_gift", title: "Bạn nhận được lửa! 🔥", body: `${senderName} đã trao lửa cho bạn. Tiếp tục cố gắng nhé!` });
}
