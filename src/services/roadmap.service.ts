import { prisma } from "@/lib/db";
import {
  getTargetLevel,
  isFeasible,
  generateWeeklyPlan,
  type Level,
  type ExamTarget,
} from "@/lib/roadmap-generator";

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
    targetDate: string;
    weeklyHours?: number;
  }
) {
  const { language, placementTestId, targetExam, targetScore, targetDate, weeklyHours = 7 } = opts;

  const test = await prisma.placementTest.findUnique({ where: { id: placementTestId } });
  if (!test || test.userId !== userId) throw new RoadmapServiceError("Placement test not found", 404);

  if (targetScore != null) {
    if (targetExam === "TOEIC" && (targetScore < 10 || targetScore > 990))
      throw new RoadmapServiceError("Điểm TOEIC phải từ 10 đến 990", 400);
    if (targetExam === "IELTS" && (targetScore < 10 || targetScore > 90))
      throw new RoadmapServiceError("Band IELTS phải từ 1.0 đến 9.0 (nhập × 10, vd: 65 = 6.5)", 400);
  }

  const currentLevel = test.level as Level;
  const exam = targetExam as ExamTarget;
  const targetLevel = exam === "general" ? "B2" : getTargetLevel(exam, targetScore);

  const start = new Date();
  const end = new Date(targetDate);
  const availableWeeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (availableWeeks < 1) throw new RoadmapServiceError("Deadline quá gần, chọn ngày xa hơn.", 400);

  const feasibility = isFeasible(currentLevel, targetLevel, availableWeeks, weeklyHours);
  if (!feasibility.feasible)
    throw new RoadmapServiceError(feasibility.message ?? "Không khả thi", 422, { minWeeks: feasibility.minWeeks });

  const weekPlans = generateWeeklyPlan(language, currentLevel, targetLevel, availableWeeks, start);

  await prisma.roadmap.deleteMany({ where: { userId, language } });

  return prisma.roadmap.create({
    data: {
      userId,
      language,
      targetExam: targetExam ?? null,
      targetScore: targetScore ?? null,
      currentLevel,
      targetLevel,
      startDate: start,
      targetDate: end,
      weeklyHours,
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
            create: wp.skills.flatMap((skill, dayIdx) => {
              const lessonDay = { dayNumber: dayIdx * 2 + 1, lessonType: skill, status: "pending" };
              const reviewDayNumber = dayIdx * 2 + 2;
              if (skill === "review" || reviewDayNumber > 7) return [lessonDay];
              return [lessonDay, { dayNumber: reviewDayNumber, lessonType: "review", status: "pending" }];
            }),
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
        include: { days: { orderBy: { dayNumber: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
