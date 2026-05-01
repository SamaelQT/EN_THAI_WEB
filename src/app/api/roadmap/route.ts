import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getTargetLevel,
  isFeasible,
  generateWeeklyPlan,
  calculateRequiredWeeks,
  type Level,
  type ExamTarget,
} from "@/lib/roadmap-generator";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { language, placementTestId, targetExam, targetScore, targetDate, weeklyHours } =
    await req.json();

  const test = await prisma.placementTest.findUnique({
    where: { id: placementTestId },
  });
  if (!test || test.userId !== session.user.id) {
    return NextResponse.json({ error: "Placement test not found" }, { status: 404 });
  }

  // Validate targetScore range
  if (targetScore !== null && targetScore !== undefined) {
    if (targetExam === "TOEIC" && (targetScore < 10 || targetScore > 990)) {
      return NextResponse.json({ error: "Điểm TOEIC phải từ 10 đến 990" }, { status: 400 });
    }
    if (targetExam === "IELTS" && (targetScore < 10 || targetScore > 90)) {
      return NextResponse.json({ error: "Band IELTS phải từ 1.0 đến 9.0 (nhập × 10, vd: 65 = 6.5)" }, { status: 400 });
    }
  }

  const currentLevel = test.level as Level;
  const exam = targetExam as ExamTarget;
  const targetLevel = exam === "general" ? "B2" : getTargetLevel(exam, targetScore);

  const start = new Date();
  const end = new Date(targetDate);
  const availableWeeks = Math.floor(
    (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  if (availableWeeks < 1) {
    return NextResponse.json({ error: "Deadline quá gần, chọn ngày xa hơn." }, { status: 400 });
  }

  const feasibility = isFeasible(currentLevel, targetLevel, availableWeeks, weeklyHours ?? 7);
  if (!feasibility.feasible) {
    return NextResponse.json(
      { error: feasibility.message, minWeeks: feasibility.minWeeks },
      { status: 422 }
    );
  }

  const totalWeeks = availableWeeks;
  const weekPlans = generateWeeklyPlan(language, currentLevel, targetLevel, totalWeeks, start);

  // Delete existing roadmap for this language if any
  await prisma.roadmap.deleteMany({
    where: { userId: session.user.id, language },
  });

  // Create roadmap with nested weeks and days
  const roadmap = await prisma.roadmap.create({
    data: {
      userId: session.user.id,
      language,
      targetExam: targetExam ?? null,
      targetScore: targetScore ?? null,
      currentLevel,
      targetLevel,
      startDate: start,
      targetDate: end,
      weeklyHours: weeklyHours ?? 7,
      totalWeeks,
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
              // Skip auto-review if skill is already review, or if it would exceed day 7
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

  return NextResponse.json({ roadmap });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const language = url.searchParams.get("language");

  const roadmaps = await prisma.roadmap.findMany({
    where: {
      userId: session.user.id,
      ...(language ? { language } : {}),
    },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { days: { orderBy: { dayNumber: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ roadmaps });
}
