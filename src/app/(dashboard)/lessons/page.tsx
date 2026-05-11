import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LessonsClient from "./LessonsClient";
import type { LessonDay } from "./CalendarView";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  const uid = session!.user!.id!;
  const params = await searchParams;
  const lang = params.lang ?? "english";

  const [enRoadmap, thRoadmap, testCount] = await Promise.all([
    prisma.roadmap.findFirst({
      where: { userId: uid, language: "english", status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
        },
      },
    }),
    prisma.roadmap.findFirst({
      where: { userId: uid, language: "thai", status: "active" },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: { days: { orderBy: { dayNumber: "asc" } } },
        },
      },
    }),
    prisma.placementTest.count({ where: { userId: uid } }),
  ]);

  // Flatten all roadmap days into LessonDay[] for CalendarView
  const lessonDays: LessonDay[] = [];
  for (const roadmap of [enRoadmap, thRoadmap]) {
    if (!roadmap) continue;
    for (const week of roadmap.weeks) {
      for (const day of week.days) {
        lessonDays.push({
          id: day.id,
          dayNumber: day.dayNumber,
          lessonType: day.lessonType,
          scheduledDate: (day as any).scheduledDate ?? null,
          status: day.status,
          weekTheme: week.theme,
          weekNumber: week.weekNumber,
          language: roadmap.language,
          roadmapId: roadmap.id,
          currentLevel: roadmap.currentLevel,
          busyDays: (roadmap as any).busyDays ?? [],
          examType: roadmap.targetExam ?? "general",
        });
      }
    }
  }

  // Strip weeks from roadmap objects before passing (not needed by client)
  const enRoadmapMeta = enRoadmap
    ? { id: enRoadmap.id, language: enRoadmap.language, currentLevel: enRoadmap.currentLevel, targetLevel: enRoadmap.targetLevel, totalWeeks: enRoadmap.totalWeeks, targetExam: enRoadmap.targetExam ?? "general" }
    : null;
  const thRoadmapMeta = thRoadmap
    ? { id: thRoadmap.id, language: thRoadmap.language, currentLevel: thRoadmap.currentLevel, targetLevel: thRoadmap.targetLevel, totalWeeks: thRoadmap.totalWeeks, targetExam: thRoadmap.targetExam ?? "general" }
    : null;

  return (
    <LessonsClient
      enRoadmap={enRoadmapMeta}
      thRoadmap={thRoadmapMeta}
      lessonDays={lessonDays}
      defaultLang={lang}
      userId={uid}
      hasPlacementTest={testCount > 0}
    />
  );
}
