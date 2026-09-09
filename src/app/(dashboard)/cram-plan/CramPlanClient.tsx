"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Clock, Trash2, ChevronRight, Target, Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Skill = "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing";
type GoalType = "exam" | "upcoming_need" | "skill_push";

type PlanListItem = {
  id: string;
  language: string;
  goalType: string;
  goalLabel: string;
  examType: string | null;
  level: string;
  skills: string[];
  targetAt: string;
  totalMinutes: number;
  status: string;
  introBlurb: string | null;
  createdAt: string;
};

type BlockDetail = {
  id: string;
  order: number;
  skill: string;
  title: string;
  goalText: string;
  durationMin: number;
  checklist: string[];
  checklistDone: boolean[];
  template: string | null;
  linkType: string;
};

type PlanDetail = PlanListItem & { blocks: BlockDetail[] };

type Props = { initialPlans: PlanListItem[]; defaultLang: string; defaultLevel: string };

// ─── Static data ──────────────────────────────────────────────────────────────

const LANGS = [
  { id: "english", label: "Tiếng Anh", badge: "EN", color: "bg-blue-500" },
  { id: "thai", label: "Tiếng Thái", badge: "TH", color: "bg-red-500" },
  { id: "korean", label: "Tiếng Hàn", badge: "KR", color: "bg-violet-500" },
];

const GOAL_TYPES: { id: GoalType; label: string; desc: string }[] = [
  { id: "exam", label: "Kỳ thi cụ thể", desc: "VSTEP, TOEIC, IELTS, TOPIK, CU-TFL..." },
  { id: "upcoming_need", label: "Việc sắp tới", desc: "Phỏng vấn, du lịch, giao tiếp cơ bản" },
  { id: "skill_push", label: "Luyện chung", desc: "Không gắn tình huống cụ thể" },
];

const EXAM_OPTIONS: Record<string, { value: string; label: string }[]> = {
  english: [
    { value: "VSTEP", label: "VSTEP" },
    { value: "TOEIC", label: "TOEIC" },
    { value: "IELTS", label: "IELTS" },
    { value: "general", label: "CEFR chung" },
  ],
  thai: [
    { value: "CUTFL", label: "CU-TFL" },
    { value: "general", label: "CEFR chung" },
  ],
  korean: [
    { value: "TOPIK", label: "TOPIK" },
    { value: "general", label: "CEFR chung" },
  ],
};

const UPCOMING_PRESETS = [
  { label: "Phỏng vấn xin việc", value: "Phỏng vấn xin việc" },
  { label: "Giao tiếp cơ bản / Du lịch", value: "Giao tiếp cơ bản khi du lịch" },
];

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const SKILL_OPTIONS: { id: Skill; label: string; icon: string }[] = [
  { id: "vocabulary", label: "Từ vựng", icon: "📚" },
  { id: "grammar", label: "Ngữ pháp", icon: "📝" },
  { id: "reading", label: "Đọc hiểu", icon: "📖" },
  { id: "listening", label: "Nghe", icon: "🎧" },
  { id: "speaking", label: "Nói", icon: "🗣️" },
  { id: "writing", label: "Viết", icon: "✍️" },
];
const SKILL_ICON: Record<string, string> = Object.fromEntries(SKILL_OPTIONS.map((s) => [s.id, s.icon]));
const SKILL_LABEL: Record<string, string> = Object.fromEntries(SKILL_OPTIONS.map((s) => [s.id, s.label]));

function langMeta(id: string) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0];
}

function formatCountdown(targetAt: string, now: number): string {
  const diffMs = new Date(targetAt).getTime() - now;
  if (diffMs <= 0) return "Đã tới/qua hạn";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (days > 0) return `Còn ${days} ngày ${h}h`;
  return `Còn ${h}h ${m}p`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CramPlanClient({ initialPlans, defaultLang, defaultLevel }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [plans, setPlans] = useState<PlanListItem[]>(initialPlans);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Live countdown — recompute every 30s, no need for anything finer
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Create-form state ──
  const [lang, setLang] = useState(defaultLang);
  const [goalType, setGoalType] = useState<GoalType>("exam");
  const [examType, setExamType] = useState("");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalLabelTouched, setGoalLabelTouched] = useState(false);
  const [level, setLevel] = useState(defaultLevel);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [targetAt, setTargetAt] = useState("");
  const [hours, setHours] = useState(3);
  const [creating, setCreating] = useState(false);

  // Auto-compose goalLabel for exam goals unless the learner has typed their own
  useEffect(() => {
    if (goalType !== "exam" || goalLabelTouched || !examType) return;
    setGoalLabel(examType === "general" ? `Ôn tập CEFR ${level}` : `${examType} ${level}`);
  }, [goalType, examType, level, goalLabelTouched]);

  useEffect(() => {
    setExamType("");
    setGoalLabel("");
    setGoalLabelTouched(false);
  }, [lang, goalType]);

  function resetCreateForm() {
    setGoalType("exam");
    setExamType("");
    setGoalLabel("");
    setGoalLabelTouched(false);
    setLevel(defaultLevel);
    setSkills([]);
    setTargetAt("");
    setHours(3);
  }

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/cram-plan/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetail(data.plan);
      setView("detail");
    } catch {
      toast.error("Không tải được kế hoạch");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  async function createPlan() {
    if (!goalLabel.trim()) { toast.error("Nhập tên mục tiêu"); return; }
    if (skills.length === 0) { toast.error("Chọn ít nhất 1 kỹ năng"); return; }
    if (!targetAt) { toast.error("Chọn hạn chót"); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/cram-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          goalType,
          goalLabel: goalLabel.trim(),
          examType: examType && examType !== "general" ? examType : null,
          level,
          skills,
          targetAt: new Date(targetAt).toISOString(),
          availableMinutes: Math.round(hours * 60),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Không tạo được kế hoạch"); return; }
      setPlans((p) => [data.plan, ...p]);
      setDetail(data.plan);
      setView("detail");
      resetCreateForm();
      toast.success("Đã tạo kế hoạch!");
    } catch {
      toast.error("Không tạo được kế hoạch. Thử lại sau.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleChecklistItem(block: BlockDetail, itemIdx: number) {
    if (!detail) return;
    const next = [...block.checklistDone];
    next[itemIdx] = !next[itemIdx];
    // Optimistic update so ticking feels instant
    setDetail((d) => d && { ...d, blocks: d.blocks.map((b) => (b.id === block.id ? { ...b, checklistDone: next } : b)) });
    try {
      const res = await fetch(`/api/cram-plan/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistDone: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setDetail((d) => d && { ...d, status: data.planStatus });
      setPlans((p) => p.map((pl) => (pl.id === detail.id ? { ...pl, status: data.planStatus } : pl)));
    } catch {
      toast.error("Không lưu được — thử lại");
      setDetail((d) => d && { ...d, blocks: d.blocks.map((b) => (b.id === block.id ? { ...b, checklistDone: block.checklistDone } : b)) });
    }
  }

  async function deletePlan(id: string) {
    try {
      const res = await fetch(`/api/cram-plan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPlans((p) => p.filter((pl) => pl.id !== id));
      setConfirmDeleteId(null);
      if (detail?.id === id) { setDetail(null); setView("list"); }
      toast.success("Đã xóa kế hoạch");
    } catch {
      toast.error("Không xóa được");
    }
  }

  function startBlock(blockId: string) {
    router.push(`/lessons?startBlock=${blockId}`);
  }

  // ── List screen ──
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-amber-500" size={24} />Kế hoạch cấp tốc</h1>
            <p className="text-muted-foreground mt-1 text-sm">Ôn theo mục tiêu cụ thể trong thời gian ngắn — có hạn chót, có checklist, có nút bắt đầu ngay.</p>
          </div>
          <Button onClick={() => setView("create")}>+ Tạo kế hoạch mới</Button>
        </div>

        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có kế hoạch nào.</p>
              <p className="text-xs mt-1">Tạo 1 kế hoạch cho kỳ thi, buổi phỏng vấn, hay bất kỳ mục tiêu nào sắp tới.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {plans.map((p) => {
              const lm = langMeta(p.language);
              const isConfirming = confirmDeleteId === p.id;
              return (
                <Card key={p.id} className={p.status === "done" ? "opacity-70" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <button className="flex-1 min-w-0 text-left flex items-center gap-3" onClick={() => loadDetail(p.id)}>
                        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded shrink-0 ${lm.color}`}>{lm.badge}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {p.goalLabel} {p.status === "done" && <span className="text-xs text-emerald-600 font-normal">· Xong</span>}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {formatCountdown(p.targetAt, now)} · {p.skills.map((s) => SKILL_LABEL[s] ?? s).join(", ")}
                          </p>
                        </div>
                      </button>
                      {loadingDetail && <Loader2 size={16} className="animate-spin text-muted-foreground shrink-0" />}
                      {isConfirming ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deletePlan(p.id)}>Xóa</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDeleteId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0" aria-label="Xóa kế hoạch">
                          <Trash2 size={15} />
                        </button>
                      )}
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" onClick={() => loadDetail(p.id)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Create screen ──
  if (view === "create") {
    const examOptions = EXAM_OPTIONS[lang] ?? [];
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>← Quay lại</Button>
          <h1 className="text-xl font-bold">Tạo kế hoạch cấp tốc</h1>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Ngôn ngữ</p>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`rounded-xl border-2 p-3 text-center transition-colors ${lang === l.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${l.color}`}>{l.badge}</span>
                <p className="text-xs font-medium mt-1">{l.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Mục tiêu</p>
          <div className="grid gap-2">
            {GOAL_TYPES.map((g) => (
              <button key={g.id} onClick={() => setGoalType(g.id)}
                className={`text-left rounded-xl border-2 px-4 py-2.5 transition-colors ${goalType === g.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <p className="text-sm font-semibold">{g.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {goalType === "exam" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Kỳ thi</p>
            <div className="flex flex-wrap gap-2">
              {examOptions.map((e) => (
                <button key={e.value} onClick={() => setExamType(e.value)}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-colors ${examType === e.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {goalType === "upcoming_need" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Gợi ý nhanh</p>
            <div className="flex flex-wrap gap-2">
              {UPCOMING_PRESETS.map((u) => (
                <button key={u.value} onClick={() => { setGoalLabel(u.value); setGoalLabelTouched(true); }}
                  className="px-3 py-1.5 rounded-full border-2 border-border hover:border-primary/40 text-xs font-medium transition-colors">
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="goalLabel">Tên mục tiêu</label>
          <input id="goalLabel" value={goalLabel}
            onChange={(e) => { setGoalLabel(e.target.value); setGoalLabelTouched(true); }}
            placeholder="VD: VSTEP B1, Phỏng vấn xin việc..."
            className="w-full text-sm rounded-lg border bg-background px-3 py-2" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Trình độ hiện tại</p>
          <div className="grid grid-cols-6 gap-2">
            {CEFR_LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`rounded-lg border-2 py-2 text-sm font-semibold transition-colors ${level === l ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Kỹ năng ưu tiên</p>
          <div className="grid grid-cols-3 gap-2">
            {SKILL_OPTIONS.map((s) => {
              const active = skills.includes(s.id);
              return (
                <button key={s.id}
                  onClick={() => setSkills((prev) => (active ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}
                  className={`rounded-lg border-2 py-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <span className="text-base">{s.icon}</span>{s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="targetAt">Hạn chót</label>
            <input id="targetAt" type="datetime-local" value={targetAt} onChange={(e) => setTargetAt(e.target.value)}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="hours">Số giờ có thể học</label>
            <input id="hours" type="number" min={0.25} max={24} step={0.25} value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full text-sm rounded-lg border bg-background px-3 py-2 font-mono" />
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={createPlan} disabled={creating}>
          {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tạo...</> : "Tạo kế hoạch →"}
        </Button>
      </div>
    );
  }

  // ── Detail screen ──
  if (view === "detail" && detail) {
    const lm = langMeta(detail.language);
    const checkable = detail.blocks.filter((b) => b.checklist.length > 0);
    const totalItems = checkable.reduce((s, b) => s + b.checklist.length, 0);
    const doneItems = checkable.reduce((s, b) => s + b.checklistDone.filter(Boolean).length, 0);
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>← Quay lại</Button>
        </div>

        <Card className="border-amber-300/60 dark:border-amber-800/60">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${lm.color}`}>{lm.badge}</span>
              <Badge variant="outline" className="text-xs">{detail.level}</Badge>
              {detail.examType && <Badge variant="secondary" className="text-xs">{detail.examType}</Badge>}
              {detail.status === "done" && <Badge className="text-xs bg-emerald-500">Hoàn thành</Badge>}
            </div>
            <h1 className="text-xl font-bold">{detail.goalLabel}</h1>
            {detail.introBlurb && (
              <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />{detail.introBlurb}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm font-mono text-amber-700 dark:text-amber-400 font-semibold">
              <Clock size={14} />{formatCountdown(detail.targetAt, now)}
              <span className="text-muted-foreground font-normal">· {Math.round(detail.totalMinutes / 6) / 10} giờ ôn</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0">{doneItems}/{totalItems} việc</span>
            </div>
          </CardContent>
        </Card>

        <ol className="space-y-3">
          {detail.blocks.map((b) => (
            <li key={b.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{SKILL_ICON[b.skill] ?? "📌"}</span>{b.title}
                    </CardTitle>
                    <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 rounded-full px-2.5 py-0.5">
                      {b.durationMin} phút
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{b.goalText}</p>

                  {b.checklist.length > 0 && (
                    <ul className="space-y-1.5">
                      {b.checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <input type="checkbox" checked={b.checklistDone[i] ?? false}
                            onChange={() => toggleChecklistItem(b, i)}
                            className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500 shrink-0 cursor-pointer" />
                          <span className={b.checklistDone[i] ? "line-through text-muted-foreground" : ""}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {b.template && (
                    <div className="text-xs bg-muted/50 border-l-2 border-amber-400 rounded-r-lg px-3 py-2 space-y-1.5 whitespace-pre-line">
                      {b.template}
                    </div>
                  )}

                  {b.linkType !== "none" && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startBlock(b.id)}>
                      Bắt đầu <ChevronRight size={14} />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <div className="flex justify-center pt-2">
          {confirmDeleteId === detail.id ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Xóa kế hoạch này?</span>
              <Button size="sm" variant="destructive" onClick={() => deletePlan(detail.id)}>Xóa</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Hủy</Button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteId(detail.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 size={13} /> Xóa kế hoạch
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
