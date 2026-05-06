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
import { CalendarDays, Target, AlertTriangle, Info } from "lucide-react";

type PlacementTest = {
  id: string;
  language: string;
  level: string;
  score: number;
  testType: string;
  completedAt: Date;
};
type Day = { id: string; dayNumber: number; lessonType: string; status: string };
type Week = { id: string; weekNumber: number; theme: string; skills: string; status: string; startDate: Date; days: Day[] };
type Roadmap = {
  id: string; language: string; targetExam: string | null; targetScore: number | null;
  currentLevel: string; targetLevel: string; startDate: Date; targetDate: Date;
  weeklyHours: number; totalWeeks: number; status: string; weeks: Week[];
};

const LANG_META = {
  english: { label: "Tiếng Anh", flag: "EN", color: "bg-blue-500" },
  thai: { label: "Tiếng Thái", flag: "TH", color: "bg-red-500" },
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  listening: "Nghe",
  reading: "Đọc hiểu",
  speaking: "Nói",
  writing: "Viết",
  pronunciation: "Phát âm",
  review: "Ôn tập",
};

// exam → required testType
const EXAM_TEST_TYPE: Record<string, string> = {
  TOEIC: "toeic",
  IELTS: "ielts",
  general: "cefr",
  "CU-TFL": "cutfl",
};

const EXAM_LABEL: Record<string, string> = {
  TOEIC: "TOEIC (tiếng Anh thương mại)",
  IELTS: "IELTS Academic",
  general: "Tiếng Anh tổng quát (CEFR)",
  "CU-TFL": "CU-TFL (tiếng Thái)",
  general_thai: "Tiếng Thái tổng quát (CEFR)",
};

const TEST_TYPE_LABEL: Record<string, string> = {
  cefr: "CEFR",
  toeic: "TOEIC",
  ielts: "IELTS",
  cutfl: "CU-TFL",
};

type Props = { roadmaps: Roadmap[]; tests: PlacementTest[] };

export default function RoadmapClient({ roadmaps, tests }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"view" | "create">("view");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    language: "",
    targetExam: "",
    placementTestId: "",
    targetScore: "",
    targetDate: "",
    weeklyHours: "7",
    busyDays: [] as number[],
  });
  const [feasibilityError, setFeasibilityError] = useState("");

  const hasTests = tests.length > 0;

  // Exams available for selected language
  const examsForLang = form.language === "english"
    ? ["TOEIC", "IELTS", "general"]
    : form.language === "thai"
    ? ["CU-TFL", "general_thai"]
    : [];

  // Tests that match the required testType for the selected exam
  const requiredTestType = form.targetExam ? EXAM_TEST_TYPE[form.targetExam] : null;
  const matchingTests = tests.filter(
    (t) => t.language === form.language && t.testType === requiredTestType
  );
  const hasMatchingTest = matchingTests.length > 0;

  function setField<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  // When language changes, reset exam and test
  function onLanguageChange(v: string) {
    setForm((prev) => ({ ...prev, language: v, targetExam: "", placementTestId: "", busyDays: [] }));
    setFeasibilityError("");
  }

  function toggleBusyDay(dow: number) {
    setForm((prev) => ({
      ...prev,
      busyDays: prev.busyDays.includes(dow)
        ? prev.busyDays.filter((d) => d !== dow)
        : [...prev.busyDays, dow],
    }));
  }

  // When exam changes, reset placementTestId
  function onExamChange(v: string) {
    setForm((prev) => ({ ...prev, targetExam: v, placementTestId: "" }));
    setFeasibilityError("");
  }

  async function createRoadmap(e: React.FormEvent) {
    e.preventDefault();
    setFeasibilityError("");
    setCreating(true);

    // Normalise: general_thai → general for the API
    const apiExam = form.targetExam === "general_thai" ? "general" : form.targetExam;

    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: form.language,
        placementTestId: form.placementTestId,
        targetExam: apiExam,
        targetScore: form.targetScore ? Number(form.targetScore) : null,
        targetDate: form.targetDate,
        weeklyHours: Number(form.weeklyHours),
        busyDays: form.busyDays,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      if (res.status === 422) setFeasibilityError(data.error);
      else toast.error(data.error || "Có lỗi xảy ra");
      return;
    }

    toast.success("Lộ trình đã được tạo!");
    setActiveTab("view");
    router.refresh();
  }

  const canSubmit =
    !!form.placementTestId &&
    !!form.targetDate &&
    hasMatchingTest &&
    form.busyDays.length < 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lộ trình học tập</h1>
        <p className="text-muted-foreground mt-1">Kế hoạch học cá nhân hóa theo mục tiêu của bạn</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "view" | "create")}>
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
                {hasTests ? (
                  <>
                    <p className="text-sm mt-1">Bạn đã có kết quả kiểm tra đầu vào. Hãy tạo lộ trình!</p>
                    <Button className="mt-4" onClick={() => setActiveTab("create")}>
                      Tạo lộ trình ngay →
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm mt-1">Hoàn thành bài kiểm tra đầu vào trước, rồi tạo lộ trình.</p>
                    <Button className="mt-4" onClick={() => router.push("/placement")}>
                      Làm bài kiểm tra đầu vào
                    </Button>
                  </>
                )}
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
              {!hasTests ? (
                <div className="text-center py-8 text-muted-foreground space-y-3">
                  <p>Bạn cần làm bài kiểm tra đầu vào trước.</p>
                  <Button onClick={() => router.push("/placement")}>Làm bài kiểm tra ngay</Button>
                </div>
              ) : (
                <form onSubmit={createRoadmap} className="space-y-5 max-w-lg">

                  {/* Step 1 – Language */}
                  <div className="space-y-2">
                    <Label>Ngôn ngữ muốn học</Label>
                    <Select value={form.language} onValueChange={(v) => onLanguageChange(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        {["english", "thai"]
                          .filter((lang) => tests.some((t) => t.language === lang))
                          .map((lang) => {
                            const m = LANG_META[lang as keyof typeof LANG_META];
                            return (
                              <SelectItem key={lang} value={lang}>
                                <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded mr-2 ${m.color}`}>{m.flag}</span>
                                {m.label}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2 – Target exam */}
                  {form.language && (
                    <div className="space-y-2">
                      <Label>Mục tiêu học</Label>
                      <Select value={form.targetExam} onValueChange={(v) => onExamChange(v ?? "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn mục tiêu" />
                        </SelectTrigger>
                        <SelectContent>
                          {examsForLang.map((exam) => (
                            <SelectItem key={exam} value={exam}>
                              {EXAM_LABEL[exam]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Step 3 – Placement test (must match exam type) */}
                  {form.targetExam && (
                    <>
                      {!hasMatchingTest ? (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Cần làm bài kiểm tra {TEST_TYPE_LABEL[requiredTestType ?? ""] ?? form.targetExam} trước</p>
                            <p className="mt-0.5 text-xs">
                              Để tạo lộ trình {EXAM_LABEL[form.targetExam]}, bạn phải làm bài kiểm tra đầu vào tương ứng.
                              Kết quả CEFR không thể dùng cho lộ trình TOEIC hay IELTS (và ngược lại).
                            </p>
                            <Button size="sm" className="mt-2" onClick={() => router.push("/placement")}>
                              Làm bài {TEST_TYPE_LABEL[requiredTestType ?? ""]} ngay
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Kết quả kiểm tra đầu vào</Label>
                          <Select value={form.placementTestId} onValueChange={(v) => setField("placementTestId", v ?? "")}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn lần kiểm tra" />
                            </SelectTrigger>
                            <SelectContent>
                              {matchingTests.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {new Date(t.completedAt).toLocaleDateString("vi-VN")} · {TEST_TYPE_LABEL[t.testType]} · Trình độ {t.level} · {t.score}/100
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Target score – only for TOEIC / IELTS */}
                      {hasMatchingTest && (form.targetExam === "TOEIC" || form.targetExam === "IELTS") && (
                        <div className="space-y-2">
                          <Label>
                            {form.targetExam === "TOEIC"
                              ? "Điểm TOEIC mục tiêu (10–990)"
                              : "Band IELTS mục tiêu (nhập × 10, vd: 65 = Band 6.5)"}
                          </Label>
                          <Input
                            type="number"
                            placeholder={form.targetExam === "TOEIC" ? "750" : "65"}
                            value={form.targetScore}
                            onChange={(e) => setField("targetScore", e.target.value)}
                            min={form.targetExam === "TOEIC" ? 10 : 10}
                            max={form.targetExam === "TOEIC" ? 990 : 90}
                          />
                        </div>
                      )}

                      {hasMatchingTest && (
                        <>
                          <div className="space-y-2">
                            <Label>Ngày mục tiêu (deadline thi/hoàn thành)</Label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              value={form.targetDate}
                              onChange={(e) => setField("targetDate", e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Số giờ học mỗi tuần</Label>
                            <Select value={form.weeklyHours} onValueChange={(v) => setField("weeklyHours", v ?? "7")}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 giờ/tuần – Nhẹ nhàng (~30 phút/ngày)</SelectItem>
                                <SelectItem value="7">7 giờ/tuần – Trung bình (~1 giờ/ngày)</SelectItem>
                                <SelectItem value="14">14 giờ/tuần – Chăm chỉ (~2 giờ/ngày)</SelectItem>
                                <SelectItem value="21">21 giờ/tuần – Cường độ cao (~3 giờ/ngày)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Ngày bận trong tuần (không xếp bài học)</Label>
                            <p className="text-xs text-muted-foreground">
                              Chọn các ngày bạn chắc chắn không thể học. Hệ thống sẽ bỏ qua những ngày này khi lên lịch.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { dow: 1, label: "T2" },
                                { dow: 2, label: "T3" },
                                { dow: 3, label: "T4" },
                                { dow: 4, label: "T5" },
                                { dow: 5, label: "T6" },
                                { dow: 6, label: "T7" },
                                { dow: 0, label: "CN" },
                              ].map(({ dow, label }) => {
                                const selected = form.busyDays.includes(dow);
                                return (
                                  <button
                                    key={dow}
                                    type="button"
                                    onClick={() => toggleBusyDay(dow)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors border-2 ${
                                      selected
                                        ? "bg-destructive/10 border-destructive text-destructive"
                                        : "bg-muted border-transparent hover:border-border"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                            {form.busyDays.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Bài học sẽ được xếp vào {7 - form.busyDays.length} ngày còn lại mỗi tuần.
                              </p>
                            )}
                            {form.busyDays.length >= 6 && (
                              <p className="text-xs text-destructive font-medium">
                                Phải để ít nhất 1 ngày trống để học.
                              </p>
                            )}
                          </div>

                          {feasibilityError && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                              {feasibilityError}
                            </div>
                          )}

                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            Lộ trình cũ cùng ngôn ngữ sẽ bị thay thế khi tạo mới.
                          </div>

                          <Button
                            type="submit"
                            disabled={creating || !canSubmit}
                            className="w-full"
                            size="lg"
                          >
                            {creating ? "Đang tạo lộ trình..." : "Tạo lộ trình →"}
                          </Button>
                        </>
                      )}
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
  const [expanded, setExpanded] = useState(false);
  const meta = LANG_META[roadmap.language as keyof typeof LANG_META];
  const completed = roadmap.weeks.filter((w) => w.status === "completed").length;
  const progress = Math.round((completed / roadmap.totalWeeks) * 100);
  const daysLeft = differenceInDays(new Date(roadmap.targetDate), new Date());
  const currentWeek = roadmap.weeks.find((w) => w.status === "active") ?? roadmap.weeks[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className={`text-xs font-bold text-white px-2 py-1 rounded ${meta?.color}`}>
              {meta?.flag}
            </span>
            {meta?.label}
            {roadmap.targetExam && roadmap.targetExam !== "general" && (
              <Badge variant="secondary">
                {roadmap.targetExam}{roadmap.targetScore ? ` ${roadmap.targetScore}` : ""}
              </Badge>
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
          <Badge variant="outline" className="shrink-0">{roadmap.currentLevel}</Badge>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Badge className="shrink-0">{roadmap.targetLevel}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completed}/{roadmap.totalWeeks} tuần hoàn thành</span>
          <span className="font-medium">{progress}%</span>
        </div>

        {/* Current week */}
        {currentWeek && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Tuần hiện tại</p>
            <p className="font-medium text-sm">Tuần {currentWeek.weekNumber}: {currentWeek.theme}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {(() => {
                try {
                  const skills: string[] = JSON.parse(currentWeek.skills);
                  return skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {LESSON_TYPE_LABELS[s] ?? s}
                    </Badge>
                  ));
                } catch { return null; }
              })()}
            </div>
          </div>
        )}

        <button
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "▲ Ẩn chi tiết" : "▼ Xem tất cả tuần"}
        </button>

        {expanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Tuần {week.weekNumber}: {week.theme}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(week.startDate), "dd/MM", { locale: vi })}
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {week.days.map((d) => (
                    <span
                      key={d.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        d.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.status === "completed" ? "✓ " : ""}
                      {LESSON_TYPE_LABELS[d.lessonType] ?? d.lessonType}
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
