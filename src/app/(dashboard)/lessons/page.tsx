import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LessonsClient from "./LessonsClient";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  const uid = session!.user!.id!;
  const params = await searchParams;
  const lang = params.lang ?? "english";

  const [enRoadmap, thRoadmap] = await Promise.all([
    prisma.roadmap.findFirst({
      where: { userId: uid, language: "english", status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
          take: 4,
        },
      },
    }),
    prisma.roadmap.findFirst({
      where: { userId: uid, language: "thai", status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
          take: 4,
        },
      },
    }),
  ]);

  return (
    <LessonsClient
      enRoadmap={enRoadmap as any}
      thRoadmap={thRoadmap as any}
      defaultLang={lang}
      userId={uid}
    />
  );
}
