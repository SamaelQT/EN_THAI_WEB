import { prisma } from "@/lib/db";
import {
  getTargetLevel,
  isFeasible,
  generateWeeklyPlan,
  nextNonBusyDate,
  scheduleDates,
  type Level,
  type ExamTarget,
} from "@/lib/roadmap-generator";

// CU-TFL levels map to CEFR equivalents for roadmap generation
const CUTFL_TO_CEFR: Record<string, Level> = {
  "Level 1": "A1",
  "Level 2": "A2",
  "Level 3": "B1",
  "Level 4": "B2",
  "Level 5": "C1",
};

/** Convert any level string to a CEFR Level for internal computation */
function toCefrLevel(level: string): Level {
  return CUTFL_TO_CEFR[level] ?? (level as Level);
}

export class RoadmapServiceError extends Error {
  constructor(message: string, public status: number, public extra?: object) {
    super(message);
  }
}

export async function createRoadmap(
  userId: string,
  opts: {
    language: string;
    placementTestId: string;
    targetExam: string;
    targetScore?: number | null;
    targetLevel?: string | null;  // user-selected for CEFR / CU-TFL exams
    learningFocus?: string;
    targetDate: string;
    weeklyHours?: number;
    busyDays?: number[];
  }
) {
  const {
    language,
    placementTestId,
    targetExam,
    targetScore,
    targetDate,
    weeklyHours = 7,
    busyDays = [],
    learningFocus = "comprehensive",
  } = opts;

  const test = await prisma.placementTest.findUnique({ where: { id: placementTestId } });
  if (!test || test.userId !== userId) throw new RoadmapServiceError("Placement test not found", 404);

  if (targetScore != null) {
    if (targetExam === "TOEIC" && (targetScore < 10 || targetScore > 990))
      throw new RoadmapServiceError("Điểm TOEIC phải từ 10 đến 990", 400);
    if (targetExam === "IELTS" && (targetScore < 10 || targetScore > 90))
      throw new RoadmapServiceError("Band IELTS phải từ 1.0 đến 9.0 (nhập × 10, vd: 65 = 6.5)", 400);
  }

  // Normalize current level from test (handles CU-TFL "Level N" → CEFR)
  const currentLevel = toCefrLevel(test.level);

  // Resolve target level:
  //  - If user explicitly selected one (CEFR / CU-TFL flows), honour it
  //  - For TOEIC / IELTS, derive from target score
  //  - Fallback: B2
  let targetLevel: Level;
  if (opts.targetLevel) {
    targetLevel = toCefrLevel(opts.targetLevel);
  } else {
    const exam = targetExam as ExamTarget;
    targetLevel = (exam === "TOEIC" || exam === "IELTS")
      ? getTargetLevel(exam, targetScore ?? 0)
      : "B2";
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  const availableWeeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (availableWeeks < 1) throw new RoadmapServiceError("Deadline quá gần, chọn ngày xa hơn.", 400);

  const feasibility = isFeasible(currentLevel, targetLevel, availableWeeks, weeklyHours);
  if (!feasibility.feasible)
    throw new RoadmapServiceError(feasibility.message ?? "Không khả thi", 422, { minWeeks: feasibility.minWeeks });

  const weekPlans = generateWeeklyPlan(
    language as "english" | "thai",
    currentLevel,
    targetLevel,
    availableWeeks,
    start,
    busyDays,
    weeklyHours,
    learningFocus
  );

  await prisma.roadmap.deleteMany({ where: { userId, language } });

  return prisma.roadmap.create({
    data: {
      userId,
      language,
      targetExam: targetExam ?? null,
      targetScore: targetScore ?? null,
      currentLevel,
      targetLevel,
      learningFocus,
      startDate: start,
      targetDate: end,
      weeklyHours,
      busyDays,
      totalWeeks: availableWeeks,
      placementTestId,
      weeks: {
        create: weekPlans.map((wp) => ({
          weekNumber: wp.weekNumber,
          theme: wp.theme,
          skills: JSON.stringify(wp.skills),
          startDate: wp.startDate,
          status: wp.weekNumber === 1 ? "active" : "pending",
          days: {
            create: wp.skills.map((skill, idx) => ({
              dayNumber: idx + 1,
              lessonType: skill,
              scheduledDate: wp.scheduledDates[idx] ?? null,
              status: "pending",
            })),
          },
        })),
      },
    },
    include: { weeks: { include: { days: true } } },
  });
}

export async function getRoadmaps(userId: string, language?: string | null) {
  return prisma.roadmap.findMany({
    where: { userId, ...(language ? { language } : {}) },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { days: { orderBy: { scheduledDate: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Update busy days + reschedule all pending lessons ────────────────────────

export async function updateBusyDays(userId: string, roadmapId: string, newBusyDays: number[]) {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap || roadmap.userId !== userId)
    throw new RoadmapServiceError("Roadmap not found", 404);

  // Get all pending days ordered by current scheduledDate, then by id as tiebreaker
  const pendingDays = await prisma.roadmapDay.findMany({
    where: { week: { roadmapId }, status: "pending" },
    orderBy: [{ scheduledDate: "asc" }, { id: "asc" }],
  });

  if (pendingDays.length === 0) {
    // Nothing to reschedule, just update busyDays
    return prisma.roadmap.update({ where: { id: roadmapId }, data: { busyDays: newBusyDays } });
  }

  // Start rescheduling from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newDates = scheduleDates(today, pendingDays.length, newBusyDays);

  await prisma.$transaction([
    prisma.roadmap.update({ where: { id: roadmapId }, data: { busyDays: newBusyDays } }),
    ...pendingDays.map((d, i) =>
      prisma.roadmapDay.update({ where: { id: d.id }, data: { scheduledDate: newDates[i] } })
    ),
  ]);
}

// ─── Reschedule a specific day (user is busy today) ──────────────────────────

export async function rescheduleDay(userId: string, roadmapId: string, dayId: string) {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap || roadmap.userId !== userId)
    throw new RoadmapServiceError("Roadmap not found", 404);

  const busyDays = roadmap.busyDays as number[];

  const day = await prisma.roadmapDay.findUnique({
    where: { id: dayId },
    include: { week: true },
  });
  if (!day || day.week.roadmapId !== roadmapId)
    throw new RoadmapServiceError("Lesson day not found", 404);
  if (day.status === "completed")
    throw new RoadmapServiceError("Bài học này đã hoàn thành rồi", 400);

  // All pending days from this point onwards (including this day), ordered by scheduledDate
  const pendingFromHere = await prisma.roadmapDay.findMany({
    where: {
      week: { roadmapId },
      status: "pending",
      scheduledDate: { gte: day.scheduledDate ?? new Date() },
    },
    orderBy: [{ scheduledDate: "asc" }, { id: "asc" }],
  });

  if (pendingFromHere.length === 0) return;

  // Shift every day: find next non-busy date after each day's current scheduled date
  // First day gets pushed to the day after its current scheduled date (skipping busy days)
  let cursor = day.scheduledDate ?? new Date();

  const updates: { id: string; scheduledDate: Date }[] = [];
  for (const d of pendingFromHere) {
    const newDate = nextNonBusyDate(cursor, busyDays);
    updates.push({ id: d.id, scheduledDate: newDate });
    cursor = newDate;
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.roadmapDay.update({ where: { id: u.id }, data: { scheduledDate: u.scheduledDate } })
    )
  );
}
