import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const dates: Date[] = [];
  const d = new Date(startDate);
  d.setHours(12, 0, 0, 0);
  while (dates.length < count) {
    if (!busyDays.includes(d.getDay())) {
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

  // Delete all incomplete weeks (cascades to their days)
  if (incompleteWeeks.length > 0) {
    await prisma.roadmapWeek.deleteMany({
      where: { id: { in: incompleteWeeks.map((w) => w.id) } },
    });
  }

  // Build new compact week structure (5 days/week)
  const DAYS_PER_WEEK = 5;
  const newWeekCount = Math.ceil(selectedDays.length / DAYS_PER_WEEK);
  const startWeekNumber = completedWeeks.length + 1;
  const busyDays: number[] = roadmap.busyDays ?? [];

  // Pre-compute all scheduled dates at once to keep offset tracking simple
  const allDates = getStudyDates(new Date(), selectedDays.length, busyDays);

  for (let w = 0; w < newWeekCount; w++) {
    const weekDays = selectedDays.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK);
    const weekNumber = startWeekNumber + w;
    const isFirst = w === 0;

    // Theme: summarize the lesson types in this week
    const typeSet = [...new Set(weekDays.map((d) => d.lessonType))];
    const TYPE_VI: Record<string, string> = {
      grammar: "Ngữ pháp", vocabulary: "Từ vựng", reading: "Đọc hiểu",
      listening: "Nghe", writing: "Viết", speaking: "Nói",
      pronunciation: "Phát âm", review: "Ôn tập",
    };
    const themeLabel = typeSet.map((t) => TYPE_VI[t] ?? t).join(", ");
    const theme = `Sprint Tuần ${weekNumber}: ${themeLabel}`;
    const skills = JSON.stringify(typeSet);

    const weekStartDate = allDates[w * DAYS_PER_WEEK] ?? new Date();

    await prisma.roadmapWeek.create({
      data: {
        roadmapId,
        weekNumber,
        theme,
        skills,
        status: isFirst ? "active" : "pending",
        startDate: weekStartDate,
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

  // Update roadmap metadata
  const newTargetDate = new Date();
  newTargetDate.setDate(newTargetDate.getDate() + daysTarget + 2); // +2 buffer

  await prisma.roadmap.update({
    where: { id: roadmapId },
    data: {
      totalWeeks: completedWeeks.length + newWeekCount,
      targetDate: newTargetDate,
    },
  });

  return NextResponse.json({
    success: true,
    newWeekCount,
    selectedDaysCount: selectedDays.length,
    droppedDaysCount: incompleteDays.length - selectedDays.length,
  });
}
