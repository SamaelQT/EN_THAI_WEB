"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const LESSON_ICONS: Record<string, string> = {
  vocabulary: "📚", grammar: "📝", listening: "🎧", reading: "📖",
  speaking: "🗣️", writing: "✏️", review: "🔄", pronunciation: "🔊",
};

const LESSON_LABELS: Record<string, string> = {
  vocabulary: "Từ vựng", grammar: "Ngữ pháp", listening: "Nghe",
  reading: "Đọc hiểu", speaking: "Nói", writing: "Viết",
  review: "Ôn tập", pronunciation: "Phát âm",
};

const LANG_COLOR = {
  english: { bg: "bg-blue-500", light: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400", label: "EN" },
  thai: { bg: "bg-red-500", light: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-400", label: "TH" },
};

export type LessonDay = {
  id: string;
  dayNumber: number;
  lessonType: string;
  scheduledDate: Date | null;
  status: string;
  weekTheme: string;
  weekNumber: number;
  language: string;
  roadmapId: string;
  currentLevel: string;
  busyDays: number[];
};

type Props = {
  lessonDays: LessonDay[];
  onStartLesson?: (type: string, lang: string, level: string, dayId: string) => void;
};

export default function CalendarView({ lessonDays, onStartLesson }: Props) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [changingBusy, setChangingBusy] = useState<string | null>(null);
  const [busyEdit, setBusyEdit] = useState<number[]>([]);

  // Build a map: dateKey → LessonDay[]
  const dayMap = new Map<string, LessonDay[]>();
  for (const ld of lessonDays) {
    if (!ld.scheduledDate) continue;
    const key = format(new Date(ld.scheduledDate), "yyyy-MM-dd");
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(ld);
  }

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday first
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selectedKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedLessons = selectedKey ? (dayMap.get(selectedKey) ?? []) : [];

  // Unique roadmap IDs for busy-day editing
  const roadmapSet = new Map<string, { busyDays: number[]; language: string }>();
  for (const ld of lessonDays) {
    if (!roadmapSet.has(ld.roadmapId)) {
      roadmapSet.set(ld.roadmapId, { busyDays: ld.busyDays, language: ld.language });
    }
  }

  async function handleReschedule(lesson: LessonDay) {
    setRescheduling(lesson.id);
    try {
      const res = await fetch(`/api/roadmap/${lesson.roadmapId}/reschedule-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: lesson.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Đã dời lịch học. Tất cả bài học từ hôm nay trở đi được dời sang ngày sau.");
      router.refresh();
    } finally {
      setRescheduling(null);
    }
  }

  function openBusyEdit(roadmapId: string) {
    const info = roadmapSet.get(roadmapId);
    if (!info) return;
    setBusyEdit([...info.busyDays]);
    setChangingBusy(roadmapId);
  }

  async function saveBusyDays() {
    if (!changingBusy) return;
    const res = await fetch(`/api/roadmap/${changingBusy}/busy-days`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busyDays: busyEdit }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Đã cập nhật ngày bận. Lịch học đã được sắp xếp lại.");
    setChangingBusy(null);
    router.refresh();
  }

  // Stats for the selected date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = format(today, "yyyy-MM-dd");
  const todayLessons = dayMap.get(todayKey) ?? [];
  const pendingToday = todayLessons.filter((l) => l.status === "pending");

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ── Calendar Grid ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="font-bold text-base capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </h2>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
          {allDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const lessons = dayMap.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const todayFlag = isToday(day);
            const pastFlag = isPast(day) && !todayFlag;
            const hasCompleted = lessons.some((l) => l.status === "completed");
            const hasPending = lessons.some((l) => l.status === "pending");
            const hasMissed = pastFlag && hasPending;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedDay(day);
                  if (!isSameMonth(day, currentMonth)) setCurrentMonth(startOfMonth(day));
                }}
                className={`relative min-h-[64px] p-1.5 flex flex-col text-left transition-colors
                  ${inMonth ? "bg-background" : "bg-muted/30"}
                  ${isSelected ? "ring-2 ring-inset ring-primary" : ""}
                  ${todayFlag ? "bg-primary/5" : ""}
                  hover:bg-muted/60`}
              >
                {/* Date number */}
                <span
                  className={`text-xs font-medium self-end w-6 h-6 flex items-center justify-center rounded-full
                    ${todayFlag ? "bg-primary text-primary-foreground" : ""}
                    ${!inMonth ? "text-muted-foreground/40" : hasMissed ? "text-destructive" : ""}`}
                >
                  {format(day, "d")}
                </span>

                {/* Lesson dots */}
                <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                  {lessons.slice(0, 3).map((l) => {
                    const lc = LANG_COLOR[l.language as keyof typeof LANG_COLOR];
                    return (
                      <div
                        key={l.id}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded flex items-center gap-1 truncate
                          ${l.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : hasMissed && l.status === "pending"
                            ? "bg-red-100 text-red-600"
                            : lc?.light ?? "bg-muted"}`}
                      >
                        <span>{LESSON_ICONS[l.lessonType] ?? "📌"}</span>
                        <span className="truncate hidden sm:inline">{LESSON_LABELS[l.lessonType]}</span>
                        <span className={`ml-auto text-[9px] font-bold px-1 rounded text-white ${lc?.bg ?? "bg-gray-400"}`}>
                          {lc?.label}
                        </span>
                      </div>
                    );
                  })}
                  {lessons.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">+{lessons.length - 3}</span>
                  )}
                </div>

                {/* Status indicators */}
                {hasCompleted && !hasPending && (
                  <CheckCircle2 size={10} className="absolute top-1.5 left-1.5 text-green-500" />
                )}
                {hasMissed && (
                  <AlertCircle size={10} className="absolute top-1.5 left-1.5 text-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300" /> Đã học</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200" /> Tiếng Anh</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200" /> Tiếng Thái</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" /> Bị bỏ lỡ</div>
        </div>
      </div>

      {/* ── Day Detail Panel ──────────────────────────────────── */}
      <div className="lg:w-72 space-y-3">
        {/* Today summary strip */}
        {pendingToday.length > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={14} className="text-primary" />
                <span className="text-sm font-semibold text-primary">Hôm nay có {pendingToday.length} bài</span>
              </div>
              {pendingToday.map((l) => {
                const lc = LANG_COLOR[l.language as keyof typeof LANG_COLOR];
                return (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-xs py-1 border-t border-primary/10">
                    <span>{LESSON_ICONS[l.lessonType]} {LESSON_LABELS[l.lessonType]}</span>
                    <span className={`text-[10px] font-bold text-white px-1 rounded ${lc?.bg}`}>{lc?.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Selected day detail */}
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b">
            <p className="font-semibold text-sm">
              {selectedDay
                ? format(selectedDay, "EEEE, d MMMM yyyy", { locale: vi })
                : "Chọn ngày để xem chi tiết"}
            </p>
            {selectedDay && isToday(selectedDay) && (
              <p className="text-xs text-primary font-medium">Hôm nay</p>
            )}
          </div>

          <div className="p-3 space-y-3">
            {selectedLessons.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {selectedDay ? "Ngày nghỉ — không có bài học" : ""}
              </p>
            ) : (
              selectedLessons.map((lesson) => {
                const lc = LANG_COLOR[lesson.language as keyof typeof LANG_COLOR];
                const isPending = lesson.status === "pending";
                const isCompleted = lesson.status === "completed";
                const isMissed = selectedDay && isPast(selectedDay) && !isToday(selectedDay) && isPending;

                return (
                  <div
                    key={lesson.id}
                    className={`rounded-lg border p-3 space-y-2 ${
                      isCompleted
                        ? "bg-green-50 border-green-200"
                        : isMissed
                        ? "bg-red-50 border-red-200"
                        : "bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{LESSON_ICONS[lesson.lessonType]}</span>
                        <div>
                          <p className="text-sm font-semibold">{LESSON_LABELS[lesson.lessonType]}</p>
                          <p className="text-xs text-muted-foreground">Tuần {lesson.weekNumber}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${lc?.bg}`}>
                        {lc?.label}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">
                      {lesson.weekTheme}
                    </p>

                    {isCompleted && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 size={12} /> Đã hoàn thành
                      </div>
                    )}

                    {isMissed && (
                      <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                        <AlertCircle size={12} /> Bị bỏ lỡ
                      </div>
                    )}

                    {isPending && !isMissed && (
                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() =>
                            onStartLesson
                              ? onStartLesson(lesson.lessonType, lesson.language, lesson.currentLevel, lesson.id)
                              : router.push(
                                  `/lessons/learn?type=${lesson.lessonType}&lang=${lesson.language}&level=${lesson.currentLevel}&dayId=${lesson.id}`
                                )
                          }
                        >
                          Bắt đầu học →
                        </Button>
                        {selectedDay && isToday(selectedDay) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-xs text-muted-foreground"
                            disabled={rescheduling === lesson.id}
                            onClick={() => handleReschedule(lesson)}
                          >
                            {rescheduling === lesson.id ? (
                              <span className="flex items-center gap-1"><Clock size={10} className="animate-spin" />Đang dời...</span>
                            ) : (
                              "📅 Dời sang ngày sau"
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Busy day settings per roadmap */}
        {roadmapSet.size > 0 && (
          <div className="border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ngày bận hàng tuần</p>
            {Array.from(roadmapSet.entries()).map(([rid, info]) => {
              const lc = LANG_COLOR[info.language as keyof typeof LANG_COLOR];
              const DOW_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
              return (
                <div key={rid} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${lc?.bg}`}>
                      {lc?.label}
                    </span>
                    <button
                      className="text-xs text-primary underline"
                      onClick={() => openBusyEdit(rid)}
                    >
                      Thay đổi
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
                      <span
                        key={dow}
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          info.busyDays.includes(dow)
                            ? "bg-destructive/10 text-destructive font-medium"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {DOW_LABELS[dow]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Busy day edit modal inline */}
        {changingBusy && (
          <div className="border-2 border-primary rounded-xl p-3 space-y-3">
            <p className="text-sm font-semibold">Chỉnh ngày bận</p>
            <p className="text-xs text-muted-foreground">
              Sau khi lưu, hệ thống sẽ tự động dời tất cả bài học chưa học vào các ngày không bận.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { dow: 1, label: "T2" }, { dow: 2, label: "T3" }, { dow: 3, label: "T4" },
                { dow: 4, label: "T5" }, { dow: 5, label: "T6" }, { dow: 6, label: "T7" }, { dow: 0, label: "CN" },
              ].map(({ dow, label }) => {
                const sel = busyEdit.includes(dow);
                return (
                  <button
                    key={dow}
                    type="button"
                    onClick={() =>
                      setBusyEdit((prev) =>
                        prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
                      )
                    }
                    className={`w-9 h-9 rounded-full text-xs font-medium border-2 transition-colors ${
                      sel ? "bg-destructive/10 border-destructive text-destructive" : "bg-muted border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {busyEdit.length >= 7 && (
              <p className="text-xs text-destructive">Phải để ít nhất 1 ngày trống.</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setChangingBusy(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={busyEdit.length >= 7}
                onClick={saveBusyDays}
              >
                Lưu & sắp xếp lại
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
