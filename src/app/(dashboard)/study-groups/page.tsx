import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StudyGroupsClient from "./StudyGroupsClient";

export default async function StudyGroupsPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const myGroups = await prisma.studyGroup.findMany({
    where: { members: { some: { userId: uid } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  return (
    <StudyGroupsClient
      myGroups={myGroups as any}
      currentUserId={uid}
      currentUserName={session!.user!.name ?? null}
      currentUserImage={session!.user!.image ?? null}
    />
  );
}
