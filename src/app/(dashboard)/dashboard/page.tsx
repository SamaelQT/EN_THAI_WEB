import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Flame, BookOpen, Target, Users, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const [user, roadmaps, streaks, recentProgress, achievements, friends, totalLessons] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: uid }, select: { name: true, totalXp: true, createdAt: true } }),
      prisma.roadmap.findMany({
        where: { userId: uid },
        include: {
          weeks: {
            include: { days: true },
            orderBy: { weekNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.streak.findMany({ where: { userId: uid } }),
      prisma.lessonProgress.findMany({
        where: { userId: uid },
        orderBy: { completedAt: "desc" },
        take: 5,
        include: { lesson: { select: { title: true, type: true, language: true } } },
      }),
      prisma.userAchievement.findMany({
        where: { userId: uid },
        include: { achievement: true },
        orderBy: { earnedAt: "desc" },
        take: 3,
      }),
      prisma.friendship.count({
        where: {
          OR: [{ initiatorId: uid }, { receiverId: uid }],
          status: "accepted",
        },
      }),
      prisma.lessonProgress.count({ where: { userId: uid } }),
    ]);

  const enRoadmap = roadmaps.find((r: (typeof roadmaps)[0]) => r.language === "english");
  const thRoadmap = roadmaps.find((r: (typeof roadmaps)[0]) => r.language === "thai");
  const enStreak = streaks.find((s: (typeof streaks)[0]) => s.language === "english");
  const thStreak = streaks.find((s: (typeof streaks)[0]) => s.language === "thai");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Xin chào, {user?.name?.split(" ").pop()} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="text-orange-500" />}
          label="Streak tốt nhất"
          value={`${Math.max(enStreak?.longestStreak ?? 0, thStreak?.longestStreak ?? 0)} ngày`}
        />
        <StatCard
          icon={<BookOpen className="text-blue-500" />}
          label="Bài học hoàn thành"
          value={String(totalLessons)}
        />
        <StatCard
          icon={<Trophy className="text-yellow-500" />}
          label="Tổng XP"
          value={`${user?.totalXp ?? 0} XP`}
        />
        <StatCard
          icon={<Users className="text-green-500" />}
          label="Bạn bè"
          value={String(friends)}
        />
      </div>

      {/* Roadmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoadmapWidget
          flag="EN"
          flagColor="bg-blue-500"
          label="Tiếng Anh"
          roadmap={enRoadmap}
          streak={enStreak}
          lang="english"
        />
        <RoadmapWidget
          flag="TH"
          flagColor="bg-red-500"
          label="Tiếng Thái"
          roadmap={thRoadmap}
          streak={thStreak}
          lang="thai"
        />
      </div>

      {/* Recent activity + Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent lessons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có bài học nào.</p>
            ) : (
              <div className="space-y-3">
                {recentProgress.map((lp) => (
                  <div key={lp.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{lp.lesson.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {lp.lesson.language} · {lp.lesson.type}
                      </p>
                    </div>
                    {lp.score !== null && (
                      <Badge variant={lp.score >= 70 ? "default" : "secondary"}>
                        {lp.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link href="/lessons">
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Xem tất cả bài học →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thành tích gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thành tích nào. Học thêm để mở khóa!</p>
            ) : (
              <div className="space-y-3">
                {achievements.map((ua) => (
                  <div key={ua.id} className="flex items-center gap-3">
                    <span className="text-2xl">{ua.achievement.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{ua.achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{ua.achievement.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">+{ua.achievement.xpReward} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-lg">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoadmapWidget({
  flag, flagColor, label, roadmap, streak, lang,
}: {
  flag: string;
  flagColor: string;
  label: string;
  roadmap: any;
  streak: any;
  lang: string;
}) {
  const FlagBadge = () => (
    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${flagColor}`}>{flag}</span>
  );

  if (!roadmap) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center space-y-3">
          <FlagBadge />
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">Chưa có lộ trình</p>
          <Link href="/placement">
            <Button size="sm" variant="outline">Bắt đầu →</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const completedWeeks = roadmap.weeks.filter((w: any) => w.status === "completed").length;
  const progress = Math.round((completedWeeks / roadmap.totalWeeks) * 100);
  const activeWeek = roadmap.weeks.find((w: any) => w.status === "active");

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <FlagBadge /> {label}
          </div>
          <div className="flex items-center gap-1 text-orange-500 font-semibold text-sm">
            <Flame size={16} />
            {streak?.currentStreak ?? 0}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{roadmap.currentLevel} → {roadmap.targetLevel}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {activeWeek && (
          <p className="text-xs text-muted-foreground">
            Tuần {activeWeek.weekNumber}: {activeWeek.theme}
          </p>
        )}

        <div className="flex gap-2">
          <Link href={`/lessons?lang=${lang}`} className="flex-1">
            <Button size="sm" className="w-full">Học ngay</Button>
          </Link>
          <Link href="/roadmap">
            <Button size="sm" variant="outline">Lộ trình</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
