import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * Daily study reminder.
 *
 * Call this once an hour from a scheduler (Render Cron, GitHub Actions, cron-job.org):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/daily-reminder
 *
 * For each user it checks THEIR local hour (stored as a UTC offset) and only fires when
 * that matches their chosen reminder hour, so one hourly trigger covers every timezone.
 *
 * Note: this writes an in-app notification. Hooking up email or web-push means adding a
 * provider — the send step is isolated in `deliver()` so that swap is a one-function change.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

async function deliver(userId: string, title: string, body: string) {
  await createNotification({ userId, type: "study_reminder", title, body });
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET chưa được cấu hình" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const users = await prisma.user.findMany({
    where: { reminderEnabled: true },
    select: {
      id: true, name: true, reminderHour: true, utcOffsetMin: true, lastReminderAt: true,
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    // What hour is it where this learner lives?
    const localHour = new Date(now.getTime() + user.utcOffsetMin * 60_000).getUTCHours();
    if (localHour !== user.reminderHour) { skipped++; continue; }

    // One reminder per ~day, even if the cron fires more often than expected
    if (user.lastReminderAt && now.getTime() - user.lastReminderAt.getTime() < 20 * 60 * 60 * 1000) {
      skipped++;
      continue;
    }

    // Already studied today? Then say nothing.
    const since = new Date(now.getTime() - DAY_MS);
    const studiedToday = await prisma.lessonProgress.count({
      where: { userId: user.id, completedAt: { gte: since } },
    });
    if (studiedToday > 0) { skipped++; continue; }

    // Personalise: mention the streak at risk and how many words are due
    const [streaks, dueWords] = await Promise.all([
      prisma.streak.findMany({ where: { userId: user.id }, select: { currentStreak: true } }),
      prisma.vocabularyItem.count({ where: { userId: user.id, dueAt: { lte: now } } }),
    ]);
    const bestStreak = Math.max(0, ...streaks.map((s) => s.currentStreak));

    const parts: string[] = [];
    if (bestStreak > 0) parts.push(`Chuỗi ${bestStreak} ngày của bạn sẽ mất nếu hôm nay bỏ học.`);
    if (dueWords > 0) parts.push(`${dueWords} từ đang đến hạn ôn.`);
    if (parts.length === 0) parts.push("Dành 10 phút cho một bài học ngắn nhé.");

    await deliver(
      user.id,
      bestStreak > 0 ? `🔥 Giữ chuỗi ${bestStreak} ngày!` : "📚 Đến giờ học rồi",
      parts.join(" "),
    );
    await prisma.user.update({ where: { id: user.id }, data: { lastReminderAt: now } });
    sent++;
  }

  return NextResponse.json({ sent, skipped, checked: users.length });
}
