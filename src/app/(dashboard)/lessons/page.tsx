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

  const [roadmap, completedLessonIds] = await Promise.all([
    prisma.roadmap.findFirst({
      where: { userId: uid, language: lang, status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
          take: 4,
        },
      },
    }),
    prisma.lessonProgress
      .findMany({ where: { userId: uid }, select: { lessonId: true } })
      .then((lps) => lps.map((lp) => lp.lessonId)),
  ]);

  return (
    <LessonsClient
      roadmap={roadmap as any}
      completedLessonIds={completedLessonIds}
      defaultLang={lang}
      userId={uid}
    />
  );
}
