import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StudyGroupsClient from "./StudyGroupsClient";

export default async function StudyGroupsPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [myGroups, publicGroups] = await Promise.all([
    prisma.studyGroup.findMany({
      where: { members: { some: { userId: uid } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    }),
    prisma.studyGroup.findMany({
      where: { members: { none: { userId: uid } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <StudyGroupsClient
      myGroups={myGroups as any}
      publicGroups={publicGroups as any}
      currentUserId={uid}
    />
  );
}
