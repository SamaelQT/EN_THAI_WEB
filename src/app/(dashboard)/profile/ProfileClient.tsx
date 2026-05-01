"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, BookOpen, Users, CalendarDays, Edit2, Check, Camera, Loader2 } from "lucide-react";

type Achievement = { id: string; earnedAt: Date; achievement: { name: string; description: string; icon: string; xpReward: number; category: string } };
type Streak = { language: string; currentStreak: number; longestStreak: number };
type User = { id: string; name: string | null; email: string; image: string | null; bio: string | null; country: string | null; totalXp: number; createdAt: Date };

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

export default function ProfileClient({ user, streaks, achievements, lessonCount, friendCount }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user.name ?? "",
    bio: user.bio ?? "",
    country: user.country ?? "",
  });

  const maxStreak = Math.max(...streaks.map((s) => s.longestStreak), 0);
  const title = getTitle(user.totalXp);
  const currentImage = previewImage ?? user.image ?? undefined;

  async function save() {
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Hồ sơ đã được cập nhật!");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("Có lỗi xảy ra");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingAvatar(false);

    if (!res.ok) {
      toast.error(data.error ?? "Upload thất bại");
      setPreviewImage(null);
      return;
    }
    toast.success("Ảnh đại diện đã cập nhật!");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentImage} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
                title="Đổi ảnh đại diện"
              >
                {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 space-y-3">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <div className="space-y-1">
                    <Label>Họ tên</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Giới thiệu</Label>
                    <Textarea
                      placeholder="Vài dòng về bạn..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Quốc gia</Label>
                    <Input placeholder="Việt Nam" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={save} disabled={saving} size="sm">
                      <Check size={14} className="mr-1" />
                      {saving ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <Badge variant="secondary">{title}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  {user.bio && <p className="text-sm">{user.bio}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {user.country && <span>📍 {user.country}</span>}
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      Tham gia {format(new Date(user.createdAt), "MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Edit2 size={14} className="mr-1" />
                    Chỉnh sửa
                  </Button>
                </>
              )}
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
                  {s.language === "english" ? "🇬🇧 Tiếng Anh" : "🇹🇭 Tiếng Thái"}
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
            <p className="text-sm text-muted-foreground">Chưa có thành tích nào. Tiếp tục học để mở khóa!</p>
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
