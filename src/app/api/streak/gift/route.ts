import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { receiverId, language, message } = await req.json();

  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: uid, receiverId, status: "accepted" },
        { initiatorId: receiverId, receiverId: uid, status: "accepted" },
      ],
    },
  });

  if (!isFriend) return NextResponse.json({ error: "Not friends" }, { status: 403 });

  await prisma.streakGift.create({
    data: { senderId: uid, receiverId, language, message },
  });

  // Freeze receiver's streak for 1 day (protect from breaking)
  await prisma.streak.upsert({
    where: { userId_language: { userId: receiverId, language } },
    update: { frozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    create: {
      userId: receiverId,
      language,
      frozenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "streak_gift",
      title: "Bạn nhận được lửa! 🔥",
      body: `${session.user.name} đã trao lửa cho bạn. Tiếp tục cố gắng nhé!`,
    },
  });

  return NextResponse.json({ message: "Sent" });
}
