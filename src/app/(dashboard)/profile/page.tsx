import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [user, streaks, achievements, lessonCount, friendCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, name: true, email: true, image: true, bio: true, country: true, totalXp: true, createdAt: true },
      }),
      prisma.streak.findMany({ where: { userId: uid } }),
      prisma.userAchievement.findMany({
        where: { userId: uid },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.lessonProgress.count({ where: { userId: uid } }),
      prisma.friendship.count({
        where: {
          OR: [{ initiatorId: uid }, { receiverId: uid }],
          status: "accepted",
        },
      }),
    ]);

  return (
    <ProfileClient
      user={user as any}
      streaks={streaks}
      achievements={achievements as any}
      lessonCount={lessonCount}
      friendCount={friendCount}
    />
  );
}
