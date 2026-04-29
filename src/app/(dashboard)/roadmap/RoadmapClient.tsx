"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Target, BookOpen, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type PlacementTest = { id: string; language: string; level: string; score: number; completedAt: Date };
type Day = { id: string; dayNumber: number; lessonType: string; status: string };
type Week = { id: string; weekNumber: number; theme: string; skills: string; status: string; startDate: Date; days: Day[] };
type Roadmap = {
  id: string; language: string; targetExam: string | null; targetScore: number | null;
  currentLevel: string; targetLevel: string; startDate: Date; targetDate: Date;
  weeklyHours: number; totalWeeks: number; status: string; weeks: Week[];
};

const LANG_META = {
  english: { label: "Tiếng Anh", flag: "🇬🇧" },
  thai: { label: "Tiếng Thái", flag: "🇹🇭" },
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary: "📚 Từ vựng",
  grammar: "📝 Ngữ pháp",
  listening: "🎧 Nghe",
  reading: "📖 Đọc hiểu",
  speaking: "🗣️ Nói",
  writing: "✏️ Viết",
  pronunciation: "🔊 Phát âm",
  review: "🔄 Ôn tập",
};

type Props = { roadmaps: Roadmap[]; tests: PlacementTest[] };

export default function RoadmapClient({ roadmaps, tests }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"view" | "create">("view");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    language: "",
    placementTestId: "",
    targetExam: "TOEIC",
    targetScore: "",
    targetDate: "",
    weeklyHours: "7",
  });
  const [feasibilityError, setFeasibilityError] = useState("");

  const englishRoadmap = roadmaps.find((r) => r.language === "english");
  const thaiRoadmap = roadmaps.find((r) => r.language === "thai");
  const testsForLang = tests.filter((t) => t.language === form.language);

  async function createRoadmap(e: React.FormEvent) {
    e.preventDefault();
    setFeasibilityError("");
    setCreating(true);

    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: form.language,
        placementTestId: form.placementTestId,
        targetExam: form.targetExam,
        targetScore: form.targetScore ? Number(form.targetScore) : null,
        targetDate: form.targetDate,
        weeklyHours: Number(form.weeklyHours),
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      if (res.status === 422) {
        setFeasibilityError(data.error);
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
      return;
    }

    toast.success("Lộ trình đã được tạo!");
    setActiveTab("view");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lộ trình học tập</h1>
          <p className="text-muted-foreground mt-1">Kế hoạch học cá nhân hóa theo mục tiêu của bạn</p>
        </div>
        <Button onClick={() => setActiveTab("create")} variant="outline">
          + Tạo lộ trình mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="view">Lộ trình của tôi</TabsTrigger>
          <TabsTrigger value="create">Tạo lộ trình</TabsTrigger>
        </TabsList>

        {/* ── View ── */}
        <TabsContent value="view" className="space-y-6 mt-4">
          {roadmaps.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                <Target className="mx-auto mb-3 opacity-30" size={48} />
                <p>Bạn chưa có lộ trình nào.</p>
                <p className="text-sm mt-1">Hoàn thành bài kiểm tra đầu vào, rồi tạo lộ trình.</p>
                <Button className="mt-4" onClick={() => router.push("/placement")}>
                  Làm bài kiểm tra đầu vào
                </Button>
              </CardContent>
            </Card>
          ) : (
            roadmaps.map((r) => <RoadmapCard key={r.id} roadmap={r} />)
          )}
        </TabsContent>

        {/* ── Create ── */}
        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tạo lộ trình mới</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Bạn cần làm bài kiểm tra đầu vào trước.</p>
                  <Button className="mt-4" onClick={() => router.push("/placement")}>
                    Làm bài kiểm tra ngay
                  </Button>
                </div>
              ) : (
                <form onSubmit={createRoadmap} className="space-y-5 max-w-lg">
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v ?? "", placementTestId: "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        {tests.map((t) => (
                          <SelectItem key={t.id} value={t.language}>
                            {LANG_META[t.language as keyof typeof LANG_META]?.flag} {LANG_META[t.language as keyof typeof LANG_META]?.label} · Trình độ {t.level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.language && (
                    <>
                      <div className="space-y-2">
                        <Label>Kết quả kiểm tra đầu vào</Label>
                        <Select value={form.placementTestId} onValueChange={(v) => setForm({ ...form, placementTestId: v ?? "" })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn bài test" />
                          </SelectTrigger>
                          <SelectContent>
                            {testsForLang.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {new Date(t.completedAt).toLocaleDateString("vi-VN")} · {t.level} · {t.score}/100
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {form.language === "english" && (
                        <>
                          <div className="space-y-2">
                            <Label>Mục tiêu thi</Label>
                            <Select value={form.targetExam} onValueChange={(v) => setForm({ ...form, targetExam: v ?? "TOEIC" })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TOEIC">TOEIC</SelectItem>
                                <SelectItem value="IELTS">IELTS</SelectItem>
                                <SelectItem value="general">Tiếng Anh tổng quát</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {form.targetExam !== "general" && (
                            <div className="space-y-2">
                              <Label>
                                {form.targetExam === "TOEIC" ? "Điểm TOEIC mục tiêu (0–990)" : "Band IELTS mục tiêu × 10 (vd: 65 = 6.5)"}
                              </Label>
                              <Input
                                type="number"
                                placeholder={form.targetExam === "TOEIC" ? "750" : "65"}
                                value={form.targetScore}
                                onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div className="space-y-2">
                        <Label>Ngày mục tiêu</Label>
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={form.targetDate}
                          onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Số giờ học mỗi tuần</Label>
                        <Select value={form.weeklyHours} onValueChange={(v) => setForm({ ...form, weeklyHours: v ?? "7" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 giờ/tuần (nhẹ)</SelectItem>
                            <SelectItem value="7">7 giờ/tuần (trung bình)</SelectItem>
                            <SelectItem value="14">14 giờ/tuần (chăm chỉ)</SelectItem>
                            <SelectItem value="21">21 giờ/tuần (cường độ cao)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {feasibilityError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                          {feasibilityError}
                        </div>
                      )}

                      <Button type="submit" disabled={creating || !form.placementTestId || !form.targetDate} className="w-full">
                        {creating ? "Đang tạo lộ trình..." : "Tạo lộ trình"}
                      </Button>
                    </>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const meta = LANG_META[roadmap.language as keyof typeof LANG_META];
  const completed = roadmap.weeks.filter((w) => w.status === "completed").length;
  const progress = Math.round((completed / roadmap.totalWeeks) * 100);
  const daysLeft = differenceInDays(new Date(roadmap.targetDate), new Date());
  const currentWeek = roadmap.weeks.find((w) => w.status === "active") ?? roadmap.weeks[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">{meta?.flag}</span>
            {meta?.label}
            {roadmap.targetExam && (
              <Badge variant="secondary">{roadmap.targetExam}{roadmap.targetScore ? ` ${roadmap.targetScore}` : ""}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays size={14} />
            {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã hết hạn"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level journey */}
        <div className="flex items-center gap-3">
          <Badge variant="outline">{roadmap.currentLevel}</Badge>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <Badge>{roadmap.targetLevel}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completed}/{roadmap.totalWeeks} tuần hoàn thành
          </span>
          <span className="font-medium">{progress}%</span>
        </div>

        {/* Current week */}
        {currentWeek && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Tuần này
            </p>
            <p className="font-medium text-sm">{currentWeek.theme}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {JSON.parse(currentWeek.skills).map((s: string) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {LESSON_TYPE_LABELS[s] ?? s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Week list toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(expanded ? null : roadmap.id)}
        >
          {expanded ? "▲ Ẩn chi tiết" : "▼ Xem tất cả tuần"}
        </Button>

        {expanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {roadmap.weeks.map((week) => (
              <div
                key={week.id}
                className={`border rounded-lg p-3 text-sm ${
                  week.status === "active"
                    ? "border-primary bg-primary/5"
                    : week.status === "completed"
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Tuần {week.weekNumber}: {week.theme}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(week.startDate), "dd/MM", { locale: vi })}
                  </span>
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {week.days.map((d) => (
                    <span
                      key={d.id}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        d.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.status === "completed" ? "✓" : ""} {LESSON_TYPE_LABELS[d.lessonType] ?? d.lessonType}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
