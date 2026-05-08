import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PublicProfileClient from "./PublicProfileClient";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  const currentUserId = session!.user!.id!;
  const { userId } = await params;

  // Redirect to own profile if viewing self
  if (userId === currentUserId) redirect("/profile");

  const [user, streaks, achievements, lessonCount, friendCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        country: true,
        totalXp: true,
        createdAt: true,
      },
    }),
    prisma.streak.findMany({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.friendship.count({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: "accepted",
      },
    }),
  ]);

  if (!user) notFound();

  return (
    <PublicProfileClient
      user={user}
      streaks={streaks}
      achievements={achievements as any}
      lessonCount={lessonCount}
      friendCount={friendCount}
    />
  );
}
