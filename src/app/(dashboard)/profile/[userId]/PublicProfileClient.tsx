"use client";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, BookOpen, Users, CalendarDays, ArrowLeft } from "lucide-react";

type Achievement = {
  id: string;
  earnedAt: Date;
  achievement: { name: string; description: string; icon: string; xpReward: number; category: string };
};
type Streak = { language: string; currentStreak: number; longestStreak: number };
type User = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  country: string | null;
  totalXp: number;
  createdAt: Date;
};

type Props = {
  user: User;
  streaks: Streak[];
  achievements: Achievement[];
  lessonCount: number;
  friendCount: number;
};

const LEVEL_TITLES = [
  { min: 0, title: "Người mới bắt đầu" },
  { min: 100, title: "Học viên" },
  { min: 500, title: "Học viên nhiệt tình" },
  { min: 1000, title: "Người học chăm chỉ" },
  { min: 2500, title: "Chiến binh ngôn ngữ" },
  { min: 5000, title: "Chuyên gia ngôn ngữ" },
];

function getTitle(xp: number) {
  return [...LEVEL_TITLES].reverse().find((t) => xp >= t.min)?.title ?? "Người mới";
}

export default function PublicProfileClient({
  user,
  streaks,
  achievements,
  lessonCount,
  friendCount,
}: Props) {
  const maxStreak = Math.max(...streaks.map((s) => s.longestStreak), 0);
  const title = getTitle(user.totalXp);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/friends"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Quay lại bạn bè
      </Link>

      <h1 className="text-2xl font-bold">Hồ sơ</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold">{user.name ?? "Người dùng"}</h2>
                <Badge variant="secondary">{title}</Badge>
              </div>
              {user.bio && <p className="text-sm">{user.bio}</p>}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {user.country && <span>📍 {user.country}</span>}
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  Tham gia {format(new Date(user.createdAt), "MM/yyyy", { locale: vi })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge icon={<Trophy className="text-yellow-500" />} label="Tổng XP" value={`${user.totalXp}`} />
        <StatBadge icon={<Flame className="text-orange-500" />} label="Streak dài nhất" value={`${maxStreak} ngày`} />
        <StatBadge icon={<BookOpen className="text-blue-500" />} label="Bài học" value={`${lessonCount}`} />
        <StatBadge icon={<Users className="text-green-500" />} label="Bạn bè" value={`${friendCount}`} />
      </div>

      {/* Streaks per language */}
      {streaks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Streak theo ngôn ngữ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {streaks.map((s) => (
              <div key={s.language} className="flex items-center justify-between">
                <span className="font-medium">
                  <span
                    className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded mr-1 ${
                      s.language === "english" ? "bg-blue-500" : "bg-red-500"
                    }`}
                  >
                    {s.language === "english" ? "EN" : "TH"}
                  </span>
                  {s.language === "english" ? "Tiếng Anh" : "Tiếng Thái"}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-orange-500 font-bold">
                    <Flame size={16} />
                    {s.currentStreak}
                  </span>
                  <span className="text-muted-foreground">Kỷ lục: {s.longestStreak} ngày</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Thành tích
            <Badge variant="outline">{achievements.length} đạt được</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thành tích nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((ua) => (
                <div key={ua.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-3xl">{ua.achievement.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ua.achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{ua.achievement.description}</p>
                  </div>
                  <Badge variant="secondary">+{ua.achievement.xpReward} XP</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
