import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { lessonType, language, level, score, timeSpent, dayId } = await req.json();

  // Find or create a placeholder Lesson record for this type/language/level
  const lesson = await prisma.lesson.upsert({
    where: {
      id: `${lessonType}_${language}_${level}`,
    },
    update: {},
    create: {
      id: `${lessonType}_${language}_${level}`,
      language,
      type: lessonType,
      level,
      title: `${lessonType} – ${level}`,
      content: "{}",
      xpReward: score >= 70 ? 15 : 8,
    },
  });

  // Save progress
  await prisma.lessonProgress.create({
    data: {
      userId: uid,
      lessonId: lesson.id,
      score,
      timeSpent: timeSpent ?? null,
    },
  });

  // Add XP
  const xpGained = score >= 70 ? 15 : 8;
  await prisma.user.update({
    where: { id: uid },
    data: { totalXp: { increment: xpGained } },
  });

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({
    where: { userId_language: { userId: uid, language } },
  });

  let newStreak = 1;
  if (streak) {
    const last = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);

      if (diffDays === 0) {
        // Already studied today — keep streak unchanged
        newStreak = streak.currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = streak.currentStreak + 1;
      } else {
        // Check if streak is frozen
        const frozen = streak.frozenUntil && new Date(streak.frozenUntil) >= today;
        newStreak = frozen ? streak.currentStreak : 1;
      }
    }

    await prisma.streak.update({
      where: { userId_language: { userId: uid, language } },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActivityDate: new Date(),
        frozenUntil: null,
      },
    });
  } else {
    await prisma.streak.create({
      data: {
        userId: uid,
        language,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
      },
    });
  }

  // Check achievements
  const newAchievements: string[] = [];

  const [totalLessons, currentUser] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId: uid } }),
    prisma.user.findUnique({ where: { id: uid }, select: { totalXp: true } }),
  ]);

  const ACHIEVEMENT_RULES: Array<{
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
    check: () => boolean;
  }> = [
    {
      code: "first_lesson",
      name: "Bước đầu tiên",
      description: "Hoàn thành bài học đầu tiên",
      icon: "🎯",
      category: "lesson",
      xpReward: 50,
      check: () => totalLessons === 1,
    },
    {
      code: "lessons_10",
      name: "Siêng năng",
      description: "Hoàn thành 10 bài học",
      icon: "📚",
      category: "lesson",
      xpReward: 100,
      check: () => totalLessons >= 10,
    },
    {
      code: "lessons_50",
      name: "Học giả",
      description: "Hoàn thành 50 bài học",
      icon: "🏆",
      category: "lesson",
      xpReward: 300,
      check: () => totalLessons >= 50,
    },
    {
      code: "streak_7",
      name: "Lửa tuần",
      description: "Học liên tiếp 7 ngày",
      icon: "🔥",
      category: "streak",
      xpReward: 100,
      check: () => newStreak >= 7,
    },
    {
      code: "streak_30",
      name: "Lửa tháng",
      description: "Học liên tiếp 30 ngày",
      icon: "🌟",
      category: "streak",
      xpReward: 500,
      check: () => newStreak >= 30,
    },
    {
      code: "perfect_score",
      name: "Hoàn hảo",
      description: "Đạt 100% trong bài kiểm tra",
      icon: "💯",
      category: "score",
      xpReward: 75,
      check: () => score === 100,
    },
    {
      code: "xp_500",
      name: "Tích lũy",
      description: "Đạt 500 XP",
      icon: "⭐",
      category: "milestone",
      xpReward: 50,
      check: () => (currentUser?.totalXp ?? 0) >= 500,
    },
  ];

  for (const rule of ACHIEVEMENT_RULES) {
    if (!rule.check()) continue;

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId: uid, achievementId: rule.code } },
    });
    if (existing) continue;

    // Ensure achievement record exists
    await prisma.achievement.upsert({
      where: { code: rule.code },
      update: {},
      create: {
        id: rule.code,
        code: rule.code,
        name: rule.name,
        description: rule.description,
        icon: rule.icon,
        category: rule.category,
        xpReward: rule.xpReward,
      },
    });

    await prisma.userAchievement.create({
      data: { userId: uid, achievementId: rule.code, language },
    });

    // Bonus XP for achievement
    await prisma.user.update({
      where: { id: uid },
      data: { totalXp: { increment: rule.xpReward } },
    });

    await prisma.notification.create({
      data: {
        userId: uid,
        type: "achievement",
        title: `Thành tích mới: ${rule.name} ${rule.icon}`,
        body: rule.description,
      },
    });

    newAchievements.push(rule.name);
  }

  // ── Roadmap day/week progression ────────────────────────────
  let weekAdvanced = false;
  if (dayId) {
    const day = await prisma.roadmapDay.findUnique({
      where: { id: dayId },
      include: { week: { include: { days: true, roadmap: true } } },
    });

    if (day && day.week.roadmap.userId === uid && day.status !== "completed") {
      await prisma.roadmapDay.update({
        where: { id: dayId },
        data: { status: "completed", completedAt: new Date() },
      });

      // Check if all days in this week are now completed
      const updatedDays = day.week.days.map((d) =>
        d.id === dayId ? { ...d, status: "completed" } : d
      );
      const allDone = updatedDays.every((d) => d.status === "completed");

      if (allDone) {
        await prisma.roadmapWeek.update({
          where: { id: day.week.id },
          data: { status: "completed" },
        });

        // Activate next week
        const nextWeek = await prisma.roadmapWeek.findFirst({
          where: {
            roadmapId: day.week.roadmapId,
            weekNumber: day.week.weekNumber + 1,
            status: "pending",
          },
        });
        if (nextWeek) {
          await prisma.roadmapWeek.update({
            where: { id: nextWeek.id },
            data: { status: "active" },
          });
          weekAdvanced = true;
        } else {
          // No more pending weeks — roadmap is fully completed
          await prisma.roadmap.update({
            where: { id: day.week.roadmapId },
            data: { status: "completed" },
          });
          await prisma.notification.create({
            data: {
              userId: uid,
              type: "roadmap_completed",
              title: "🎓 Hoàn thành lộ trình!",
              body: "Bạn đã hoàn thành toàn bộ lộ trình học tập. Chúc mừng!",
            },
          });
        }
      }
    }
  }

  return NextResponse.json({
    xpGained,
    newStreak,
    newAchievements,
    weekAdvanced,
  });
}
