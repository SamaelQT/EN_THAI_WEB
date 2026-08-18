import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeBusyDays } from "@/lib/roadmap-generator";

const TYPE_PRIORITY: Record<string, number> = {
  review: 0,
  grammar: 1,
  vocabulary: 2,
  reading: 3,
  listening: 4,
  writing: 5,
  speaking: 6,
  pronunciation: 7,
};

/** Return an array of `count` study dates starting from `startDate`, skipping busyDays (0=Sun…6=Sat). */
function getStudyDates(startDate: Date, count: number, busyDays: number[]): Date[] {
  // A roadmap with all 7 days marked busy would leave no schedulable date and spin forever
  const busy = safeBusyDays(busyDays);
  const dates: Date[] = [];
  const d = new Date(startDate);
  d.setHours(12, 0, 0, 0);
  while (dates.length < count) {
    if (!busy.includes(d.getDay())) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roadmapId, keepTypes, daysTarget } = await req.json() as {
    roadmapId: string;
    keepTypes: string[];
    daysTarget: number;
  };

  if (!roadmapId || !Array.isArray(keepTypes) || !daysTarget) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Number.isInteger(daysTarget) || daysTarget < 1 || daysTarget > 365) {
    return NextResponse.json({ error: "daysTarget phải từ 1 đến 365" }, { status: 400 });
  }

  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: {
      weeks: {
        include: { days: true },
        orderBy: { weekNumber: "asc" },
      },
    },
  });

  if (!roadmap || roadmap.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const completedWeeks = roadmap.weeks.filter((w) => w.status === "completed");
  const incompleteWeeks = roadmap.weeks.filter((w) => w.status !== "completed");

  // Collect all incomplete days → filter by kept types → sort by priority
  const incompleteDays = incompleteWeeks
    .flatMap((w) => w.days.filter((d) => d.status !== "completed"))
    .filter((d) => keepTypes.includes(d.lessonType))
    .sort((a, b) => (TYPE_PRIORITY[a.lessonType] ?? 99) - (TYPE_PRIORITY[b.lessonType] ?? 99));

  // Limit to daysTarget
  const selectedDays = incompleteDays.slice(0, daysTarget);

  // Build new compact week structure (5 days/week)
  const DAYS_PER_WEEK = 5;
  const newWeekCount = Math.ceil(selectedDays.length / DAYS_PER_WEEK);
  const startWeekNumber = completedWeeks.length + 1;
  const busyDays: number[] = roadmap.busyDays ?? [];

  // Pre-compute all scheduled dates at once to keep offset tracking simple
  const allDates = getStudyDates(new Date(), selectedDays.length, busyDays);

  const TYPE_VI: Record<string, string> = {
    grammar: "Ngữ pháp", vocabulary: "Từ vựng", reading: "Đọc hiểu",
    listening: "Nghe", writing: "Viết", speaking: "Nói",
    pronunciation: "Phát âm", review: "Ôn tập",
  };

  const newTargetDate = new Date();
  newTargetDate.setDate(newTargetDate.getDate() + daysTarget + 2); // +2 buffer

  // Delete-then-recreate must be atomic: a failure halfway through used to leave the
  // learner with a roadmap that had lost every unfinished week.
  try {
    await prisma.$transaction(async (tx) => {
      if (incompleteWeeks.length > 0) {
        await tx.roadmapWeek.deleteMany({
          where: { id: { in: incompleteWeeks.map((w) => w.id) } },
        });
      }

      for (let w = 0; w < newWeekCount; w++) {
        const weekDays = selectedDays.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK);
        const weekNumber = startWeekNumber + w;
        const typeSet = [...new Set(weekDays.map((d) => d.lessonType))];
        const themeLabel = typeSet.map((t) => TYPE_VI[t] ?? t).join(", ");

        await tx.roadmapWeek.create({
          data: {
            roadmapId,
            weekNumber,
            theme: `Sprint Tuần ${weekNumber}: ${themeLabel}`,
            skills: JSON.stringify(typeSet),
            status: w === 0 ? "active" : "pending",
            startDate: allDates[w * DAYS_PER_WEEK] ?? new Date(),
            days: {
              create: weekDays.map((d, i) => ({
                dayNumber: i + 1,
                lessonType: d.lessonType,
                status: "pending",
                scheduledDate: allDates[w * DAYS_PER_WEEK + i] ?? null,
              })),
            },
          },
        });
      }

      await tx.roadmap.update({
        where: { id: roadmapId },
        data: {
          totalWeeks: completedWeeks.length + newWeekCount,
          targetDate: newTargetDate,
        },
      });
    });
  } catch (e) {
    console.error("[roadmap/compress]", e);
    return NextResponse.json({ error: "Không nén được lộ trình. Lộ trình của bạn giữ nguyên." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newWeekCount,
    selectedDaysCount: selectedDays.length,
    droppedDaysCount: incompleteDays.length - selectedDays.length,
  });
}
