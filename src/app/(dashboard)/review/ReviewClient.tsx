"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, Timer, RotateCcw, ChevronRight, Clock, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string; order: number; question: string;
  options: string[]; answer: number; explanation: string | null;
};
type ReviewSet = {
  id: string; language: string; type: string; topic: string;
  level: string; title: string; description: string | null;
  duration: number; questions?: Question[];
  _count?: { questions: number };
};
type SavedEntry = {
  id: string; title: string; language: string; type: string;
  topic: string; level: string; duration: number;
  questionCount: number; savedAt: string;
};
type Props = { initialSets: ReviewSet[]; userId: string };
type Screen = "browse" | "running" | "result";
type MainTab = "create" | "saved";

const LS_KEY = "review_saved_v1";

function loadSaved(): SavedEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function persistSaved(entries: SavedEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPES = [
  { id: "vocabulary",       label: "Ôn tập từ vựng",       icon: "📖", desc: "15 câu · 15 phút",  count: 15 },
  { id: "grammar",          label: "Ôn tập ngữ pháp",       icon: "✏️",  desc: "15 câu · 15 phút",  count: 15 },
  { id: "quiz_15",          label: "Kiểm tra 15 phút",      icon: "⏱️",  desc: "20 câu · tổng hợp", count: 20 },
  { id: "quiz_30",          label: "Kiểm tra 30 phút",      icon: "⏰",  desc: "35 câu · tổng hợp", count: 35 },
  { id: "simulation_b1",    label: "Mô phỏng B1",           icon: "🎓",  desc: "35 câu · chuẩn B1", count: 35 },
  { id: "simulation_toeic", label: "Mô phỏng TOEIC",        icon: "🏆",  desc: "35 câu · Part 5+7", count: 35, enOnly: true },
  { id: "simulation_cutfl", label: "Mô phỏng CU-TFL",       icon: "🇹🇭",  desc: "35 câu · tiếng Thái", count: 35, thOnly: true },
];

const TOPICS_EN: Record<string, { value: string; label: string }[]> = {
  vocabulary: [
    { value: "travel",       label: "Du lịch ✈️" },
    { value: "food_dining",  label: "Ẩm thực 🍜" },
    { value: "business",     label: "Kinh doanh 💼" },
    { value: "technology",   label: "Công nghệ 💻" },
    { value: "health",       label: "Sức khỏe 🏥" },
    { value: "education",    label: "Giáo dục 📚" },
    { value: "environment",  label: "Môi trường 🌿" },
    { value: "daily_life",   label: "Cuộc sống hàng ngày 🏠" },
    { value: "random_vocab", label: "Ngẫu nhiên 🎲" },
  ],
  grammar: [
    { value: "past_simple",        label: "Thì quá khứ đơn" },
    { value: "present_perfect",    label: "Thì hiện tại hoàn thành" },
    { value: "future_tenses",      label: "Thì tương lai" },
    { value: "conditionals",       label: "Câu điều kiện" },
    { value: "passive_voice",      label: "Câu bị động" },
    { value: "reported_speech",    label: "Câu gián tiếp" },
    { value: "modal_verbs",        label: "Động từ khuyết thiếu" },
    { value: "relative_clauses",   label: "Mệnh đề quan hệ" },
  ],
};

const TOPICS_TH: Record<string, { value: string; label: string }[]> = {
  vocabulary: [
    { value: "greetings",     label: "Chào hỏi 🙏" },
    { value: "numbers_time",  label: "Số đếm & Thời gian 🕐" },
    { value: "food",          label: "Ẩm thực Thái 🍛" },
    { value: "travel",        label: "Du lịch ✈️" },
    { value: "family",        label: "Gia đình 👨‍👩‍👧" },
    { value: "daily_life",    label: "Cuộc sống hàng ngày 🏠" },
    { value: "random_vocab",  label: "Ngẫu nhiên 🎲" },
  ],
  grammar: [
    { value: "tones",        label: "Thanh điệu 🎵" },
    { value: "classifiers",  label: "Từ phân loại (Classifier)" },
    { value: "particles",    label: "Tiểu từ cuối câu (ครับ/ค่ะ)" },
    { value: "verb_aspect",  label: "Thể động từ (แล้ว, กำลัง, จะ)" },
    { value: "negation",     label: "Phủ định (ไม่, อย่า)" },
  ],
};

const CEFR_LEVELS = [
  { lvl: "A1", desc: "Mới bắt đầu" },
  { lvl: "A2", desc: "Sơ cấp" },
  { lvl: "B1", desc: "Trung cấp" },
  { lvl: "B2", desc: "Trung cấp nâng cao" },
  { lvl: "C1", desc: "Cao cấp" },
  { lvl: "C2", desc: "Thành thạo" },
];

const TOEIC_BANDS = [
  { label: "10 – 254",   cefr: "A1" },
  { label: "255 – 549",  cefr: "A2" },
  { label: "550 – 784",  cefr: "B1" },
  { label: "785 – 949",  cefr: "B2" },
  { label: "950 – 990",  cefr: "C1" },
];

const IELTS_BANDS = [
  { label: "Band 1 – 2",   cefr: "A1" },
  { label: "Band 3",        cefr: "A2" },
  { label: "Band 4 – 5",   cefr: "B1" },
  { label: "Band 5.5 – 6.5", cefr: "B2" },
  { label: "Band 7 – 7.5", cefr: "C1" },
  { label: "Band 8+",       cefr: "C2" },
];

const TYPE_LABELS: Record<string, string> = {
  vocabulary: "Từ vựng", grammar: "Ngữ pháp",
  quiz_15: "Kiểm tra 15p", quiz_30: "Kiểm tra 30p",
  simulation_b1: "Mô phỏng B1", simulation_toeic: "TOEIC", simulation_cutfl: "CU-TFL",
};

type LevelTab = "cefr" | "toeic" | "ielts";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewClient({ initialSets, userId }: Props) {
  const [sets, setSets] = useState<ReviewSet[]>(initialSets);
  const [screen, setScreen] = useState<Screen>("browse");
  const [mainTab, setMainTab] = useState<MainTab>("create");
  const [activeSet, setActiveSet] = useState<ReviewSet | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => { setSavedEntries(loadSaved()); }, []);

  // Filter state
  const [lang, setLang] = useState<"english" | "thai" | "">("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [levelTab, setLevelTab] = useState<LevelTab>("cefr");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-skip on timeout
  useEffect(() => {
    if (screen !== "running" || selected !== null) return;
    if (timeLeft === 0) advance([...answers, null]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(20);
    timerRef.current = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
  }

  function resetFilters() {
    setLang(""); setSelectedType(""); setSelectedLevel(""); setSelectedTopic(""); setLevelTab("cefr");
  }

  // Derived
  const typeInfo = TYPES.find((t) => t.id === selectedType);
  const needsTopic = selectedType === "vocabulary" || selectedType === "grammar";
  const isSimulation = selectedType.startsWith("simulation_") || selectedType === "quiz_15" || selectedType === "quiz_30";
  const topicList = lang === "english"
    ? TOPICS_EN[selectedType] ?? []
    : TOPICS_TH[selectedType] ?? [];

  const canStart = !!lang && !!selectedType && !!selectedLevel &&
    (!needsTopic || !!selectedTopic);

  function isSaved(id: string) { return savedEntries.some((e) => e.id === id); }

  function saveEntry(set: ReviewSet) {
    if (isSaved(set.id)) return;
    const entry: SavedEntry = {
      id: set.id,
      title: set.title,
      language: set.language,
      type: set.type,
      topic: set.topic,
      level: set.level,
      duration: set.duration,
      questionCount: set._count?.questions ?? set.questions?.length ?? 0,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...savedEntries];
    setSavedEntries(next);
    persistSaved(next);
    toast.success("Đã lưu bài ôn tập");
  }

  function unsaveEntry(id: string) {
    const next = savedEntries.filter((e) => e.id !== id);
    setSavedEntries(next);
    persistSaved(next);
    toast("Đã bỏ lưu");
  }

  // Get or generate a set without starting the quiz
  async function getOrGenSet(): Promise<ReviewSet | null> {
    if (!canStart) return null;
    const topic = isSimulation ? selectedType : selectedTopic;
    const cached = sets.find(
      (s) => s.language === lang && s.type === selectedType && s.topic === topic && s.level === selectedLevel
    );
    if (cached) return cached;

    setSaving(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, type: selectedType, topic, level: selectedLevel }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error); return null; }
    setSets((prev) => prev.some((s) => s.id === data.set.id) ? prev : [data.set, ...prev]);
    return data.set;
  }

  async function handleSave() {
    const set = await getOrGenSet();
    if (set) saveEntry(set);
  }

  async function handleStart() {
    if (!canStart) return;
    const topic = isSimulation ? selectedType : selectedTopic;
    const cached = sets.find(
      (s) => s.language === lang && s.type === selectedType && s.topic === topic && s.level === selectedLevel
    );
    if (cached) { await startQuiz(cached); return; }

    setGenerating(true);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, type: selectedType, topic, level: selectedLevel }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { toast.error(data.error); return; }
    setSets((prev) => prev.some((s) => s.id === data.set.id) ? prev : [data.set, ...prev]);
    await startQuiz(data.set);
  }

  async function startQuiz(set: ReviewSet) {
    let fullSet = set;
    if (!set.questions || set.questions.length === 0) {
      const res = await fetch(`/api/review/${set.id}`);
      const data = await res.json();
      fullSet = data.set;
    }
    setActiveSet(fullSet);
    setQuestions(fullSet.questions ?? []);
    setCurrent(0); setAnswers([]); setSelected(null);
    setScreen("running");
    startTimer();
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);
  }

  function advance(newAnswers: (number | null)[]) {
    setAnswers(newAnswers); setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1); startTimer();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setScreen("result");
    }
  }

  function next() { if (selected !== null) advance([...answers, selected]); }
  function skip() { advance([...answers, null]); }

  function restart() {
    setCurrent(0); setAnswers([]); setSelected(null);
    setScreen("running"); startTimer();
  }

  // ── Running screen ────────────────────────────────────────────────────────

  if (screen === "running" && activeSet && questions.length > 0) {
    const q = questions[current];
    const progress = (current / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{activeSet.title}</span>
            <Badge variant="outline" className="text-xs">{activeSet.level}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 text-sm font-mono font-semibold tabular-nums ${
              timeLeft <= 5 ? "text-red-500" : "text-muted-foreground"
            }`}>
              <Timer size={14} />{String(timeLeft).padStart(2, "0")}s
            </span>
            <span className="text-sm text-muted-foreground">{current + 1}/{questions.length}</span>
          </div>
        </div>

        <Progress value={progress} className="h-1.5" />

        <Card>
          <CardContent className="pt-6">
            <p className="text-base font-medium leading-relaxed mb-5">{q.question}</p>
            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                let cls = "w-full text-left justify-start h-auto py-3 px-4 font-normal rounded-lg border transition-colors text-sm";
                if (selected !== null) {
                  if (i === q.answer) cls += " border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300";
                  else if (i === selected) cls += " border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300";
                  else cls += " border-border text-muted-foreground opacity-40";
                } else {
                  cls += " border-border hover:border-primary/60 hover:bg-muted/50 cursor-pointer";
                }
                return (
                  <button key={i} className={cls} onClick={() => handleAnswer(i)}
                    disabled={selected !== null && i !== selected && i !== q.answer}>
                    <span className="mr-2 font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                selected === q.answer
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}>
                <p className="font-medium">
                  {selected === q.answer
                    ? "✓ Chính xác!"
                    : `✗ Đáp án đúng: ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`}
                </p>
                {q.explanation && <p className="mt-1 text-xs opacity-80">{q.explanation}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {selected === null && (
            <Button variant="outline" size="lg" className="flex-1" onClick={skip}>Bỏ qua</Button>
          )}
          <Button size="lg" className="flex-1" disabled={selected === null} onClick={next}>
            {current + 1 === questions.length ? "Xem kết quả" : "Tiếp theo →"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────

  if (screen === "result" && activeSet) {
    const correct = answers.filter((a, i) => a !== null && a === questions[i]?.answer).length;
    const wrong = answers.filter((a, i) => a !== null && a !== questions[i]?.answer).length;
    const skipped = answers.filter((a) => a === null).length;
    const score = Math.round((correct / questions.length) * 100);
    const alreadySaved = isSaved(activeSet.id);

    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="text-6xl">{score >= 80 ? "🎉" : score >= 50 ? "💪" : "📚"}</div>
        <div>
          <h2 className="text-2xl font-bold">Hoàn thành!</h2>
          <p className="text-muted-foreground mt-1">{activeSet.title}</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-5xl font-bold text-primary">
              {score}<span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-2xl font-bold text-green-600">{correct}</p><p className="text-muted-foreground">Đúng</p></div>
              <div><p className="text-2xl font-bold text-red-500">{wrong}</p><p className="text-muted-foreground">Sai</p></div>
              <div><p className="text-2xl font-bold text-muted-foreground">{skipped}</p><p className="text-muted-foreground">Bỏ qua</p></div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => { setScreen("browse"); resetFilters(); }}>Về trang chủ</Button>
          <Button variant="outline" onClick={() => alreadySaved ? unsaveEntry(activeSet.id) : saveEntry(activeSet)}>
            {alreadySaved
              ? <><BookmarkCheck size={16} className="mr-2 text-primary" />Đã lưu</>
              : <><Bookmark size={16} className="mr-2" />Lưu lại</>}
          </Button>
          <Button onClick={restart}><RotateCcw size={16} className="mr-2" />Làm lại</Button>
        </div>
      </div>
    );
  }

  // ── Browse screen ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ôn tập</h1>
        <p className="text-muted-foreground mt-1">Luyện tập và kiểm tra kiến thức với AI</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {([["create", "Tạo mới"], ["saved", `Đã lưu${savedEntries.length > 0 ? ` (${savedEntries.length})` : ""}`]] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mainTab === tab ? "bg-background shadow-sm" : "hover:bg-background/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Saved tab ── */}
      {mainTab === "saved" && (
        <div className="space-y-3">
          {savedEntries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có bài nào được lưu.</p>
              <p className="text-xs mt-1">Tạo bài và nhấn "Lưu lại" để xem ở đây.</p>
            </div>
          ) : (
            savedEntries.map((entry) => {
              const langColor = entry.language === "english" ? "bg-blue-500" : "bg-red-500";
              const langLabel = entry.language === "english" ? "EN" : "TH";
              return (
                <div
                  key={entry.id}
                  className="relative flex items-center gap-4 rounded-xl border-2 border-border p-4 hover:border-primary/40 transition-colors"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${langColor}`} />
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${langColor}`}>{langLabel}</span>
                      <Badge variant="outline" className="text-xs">{entry.level}</Badge>
                      <Badge variant="secondary" className="text-xs">{TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                    </div>
                    <p className="font-semibold text-sm truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {entry.duration} phút · {entry.questionCount} câu
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => unsaveEntry(entry.id)}
                      title="Bỏ lưu"
                    >
                      <Trash2 size={15} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        // find in sets or fetch
                        const found = sets.find((s) => s.id === entry.id);
                        if (found) { await startQuiz(found); return; }
                        const res = await fetch(`/api/review/${entry.id}`);
                        const data = await res.json();
                        if (!res.ok) { toast.error("Không tìm thấy bài"); return; }
                        setSets((prev) => [...prev, data.set]);
                        await startQuiz(data.set);
                      }}
                    >
                      Làm bài →
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Create tab ── */}
      {mainTab === "create" && (
        <div className="space-y-6">

          {/* Step 1 — Ngôn ngữ */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Chọn ngôn ngữ</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "english" as const, label: "Tiếng Anh", desc: "English · TOEIC · IELTS · CEFR", badge: "EN", color: "bg-blue-500" },
                { id: "thai"    as const, label: "Tiếng Thái", desc: "ภาษาไทย · CU-TFL · CEFR",        badge: "TH", color: "bg-red-500"  },
              ].map(({ id, label, desc, badge, color }) => (
                <button
                  key={id}
                  onClick={() => { setLang(id); setSelectedType(""); setSelectedLevel(""); setSelectedTopic(""); }}
                  className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                    lang === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${color}`} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold text-white px-2 py-1 rounded ${color}`}>{badge}</span>
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 + 3 — Loại bài & Trình độ cùng hàng */}
          {lang && (
            <div className="grid grid-cols-2 gap-6 items-start">

              {/* Loại bài */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Chọn loại bài</p>
                <div className="grid gap-2">
                  {TYPES
                    .filter((t) => !(t.enOnly && lang === "thai") && !(t.thOnly && lang === "english"))
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedType(t.id); setSelectedLevel(""); setSelectedTopic(""); setLevelTab("cefr"); }}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm text-left transition-colors ${
                          selectedType === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs leading-tight">{t.label}</p>
                          <p className={`text-[11px] mt-0.5 ${selectedType === t.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.desc}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Trình độ */}
              {selectedType && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Chọn trình độ</p>

                  {lang === "english" && (
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                      {(["cefr", "toeic", "ielts"] as LevelTab[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => { setLevelTab(t); setSelectedLevel(""); }}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                            levelTab === t ? "bg-background shadow-sm" : "hover:bg-background/50"
                          }`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}

                  {(levelTab === "cefr" || lang === "thai") && (
                    <div className="grid grid-cols-2 gap-2">
                      {CEFR_LEVELS.map(({ lvl, desc }) => (
                        <button
                          key={lvl}
                          onClick={() => { setSelectedLevel(lvl); setSelectedTopic(""); }}
                          className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                            selectedLevel === lvl ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                          title={desc}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  )}

                  {levelTab === "toeic" && lang === "english" && (
                    <div className="grid gap-1.5">
                      {TOEIC_BANDS.map(({ label, cefr }) => (
                        <button
                          key={cefr}
                          onClick={() => { setSelectedLevel(cefr); setSelectedTopic(""); }}
                          className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 text-xs transition-colors ${
                            selectedLevel === cefr ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          <span className="font-semibold">{label}</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-medium ${selectedLevel === cefr ? "bg-white/20" : "bg-muted"}`}>
                            {cefr}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {levelTab === "ielts" && lang === "english" && (
                    <div className="grid gap-1.5">
                      {IELTS_BANDS.map(({ label, cefr }) => (
                        <button
                          key={cefr}
                          onClick={() => { setSelectedLevel(cefr); setSelectedTopic(""); }}
                          className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 text-xs transition-colors ${
                            selectedLevel === cefr ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          <span className="font-semibold">{label}</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-medium ${selectedLevel === cefr ? "bg-white/20" : "bg-muted"}`}>
                            {cefr}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Chủ đề */}
          {selectedLevel && needsTopic && topicList.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Chọn chủ đề</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {topicList.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedTopic(value)}
                    className={`text-left rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                      selectedTopic === value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bài đã có */}
          {canStart && (() => {
            const topic = isSimulation ? selectedType : selectedTopic;
            const existing = sets.filter(
              (s) => s.language === lang && s.type === selectedType &&
                s.topic === topic && s.level === selectedLevel
            );
            if (existing.length === 0) return null;
            return (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Bài đã có trong hệ thống — tải ngay, không cần AI:</p>
                {existing.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium text-green-800 dark:text-green-300 text-sm">{s.title}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {s.duration} phút · {s._count?.questions ?? s.questions?.length ?? 0} câu
                      </p>
                    </div>
                    <button
                      onClick={() => isSaved(s.id) ? unsaveEntry(s.id) : saveEntry(s)}
                      className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                      title={isSaved(s.id) ? "Bỏ lưu" : "Lưu lại"}
                    >
                      {isSaved(s.id)
                        ? <BookmarkCheck size={16} className="text-primary" />
                        : <Bookmark size={16} className="text-green-600 dark:text-green-400" />}
                    </button>
                    <button
                      onClick={() => startQuiz(s)}
                      className="flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900"
                    >
                      Làm bài <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* CTA */}
          {canStart && (
            <div className="space-y-2 max-w-sm">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={handleSave}
                  disabled={saving || generating}
                >
                  {saving
                    ? <><Loader2 size={15} className="mr-2 animate-spin" />Đang lưu...</>
                    : <><Bookmark size={15} className="mr-2" />Lưu lại</>}
                </Button>
                <Button className="flex-1" size="lg" onClick={handleStart} disabled={generating || saving}>
                  {generating
                    ? <><Loader2 size={16} className="mr-2 animate-spin" />Đang tạo...</>
                    : <><BookOpen size={16} className="mr-2" />Bắt đầu →</>}
                </Button>
              </div>
              {(generating || saving) && (
                <p className="text-xs text-muted-foreground text-center">
                  Bài chưa có trong hệ thống. AI sẽ tạo và lưu lại để lần sau dùng ngay.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
