import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [friendships, requests] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: uid }, { receiverId: uid }],
        status: "accepted",
      },
      include: {
        initiator: {
          select: {
            id: true, name: true, image: true, totalXp: true,
            streaks: true,
            roadmaps: {
              select: { language: true, currentLevel: true, targetLevel: true, totalWeeks: true, weeks: { where: { status: "completed" }, select: { id: true } } },
            },
          },
        },
        receiver: {
          select: {
            id: true, name: true, image: true, totalXp: true,
            streaks: true,
            roadmaps: {
              select: { language: true, currentLevel: true, targetLevel: true, totalWeeks: true, weeks: { where: { status: "completed" }, select: { id: true } } },
            },
          },
        },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: uid, status: "pending" },
      include: {
        initiator: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  const friends = friendships.map((f) => ({
    friendshipId: f.id,
    user: f.initiatorId === uid ? f.receiver : f.initiator,
  }));

  return <FriendsClient friends={friends as any} requests={requests as any} currentUserId={uid} />;
}
