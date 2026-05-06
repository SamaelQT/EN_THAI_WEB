import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import RoadmapClient from "./RoadmapClient";

export default async function RoadmapPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [roadmaps, tests] = await Promise.all([
    prisma.roadmap.findMany({
      where: { userId: uid },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.placementTest.findMany({
      where: { userId: uid },
      orderBy: { completedAt: "desc" },
      select: { id: true, language: true, level: true, score: true, testType: true, completedAt: true },
    }),
  ]);

  return <RoadmapClient roadmaps={roadmaps as any} tests={tests} />;
}
