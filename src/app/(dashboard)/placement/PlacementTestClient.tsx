"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTestQuestions,
  calculateTestResult,
  TEST_TYPES,
  TEST_META,
  type TestType,
  type Language,
  type ActiveQuestion,
  type PlacementResult,
} from "@/lib/placement-engine";
import type { PlacementTest } from "@prisma/client";
import { CheckCircle, Clock, Award, ChevronRight, Trash2, AlertTriangle, Timer } from "lucide-react";

type LinkedRoadmap = { id: string; language: string; targetExam: string | null };

type Props = {
  englishTest: PlacementTest | null;
  thaiTest: PlacementTest | null;
  allTests: PlacementTest[];
};

type TestState = "select" | "running" | "done";

const LANG_META: Record<Language, { label: string; flag: string; color: string }> = {
  english: { label: "Tiếng Anh", flag: "EN", color: "bg-blue-500" },
  thai: { label: "Tiếng Thái", flag: "TH", color: "bg-red-500" },
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-gray-200 text-gray-800",
  A2: "bg-green-100 text-green-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-purple-100 text-purple-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
  Beginner: "bg-gray-200 text-gray-800",
  Elementary: "bg-green-100 text-green-800",
  Intermediate: "bg-blue-100 text-blue-800",
  "Upper-Intermediate": "bg-purple-100 text-purple-800",
  Advanced: "bg-orange-100 text-orange-800",
  Proficient: "bg-red-100 text-red-800",
  "4.0": "bg-gray-200 text-gray-800",
  "5.0": "bg-green-100 text-green-800",
  "6.0": "bg-blue-100 text-blue-800",
  "7.0": "bg-purple-100 text-purple-800",
  "8.0": "bg-orange-100 text-orange-800",
  "Below 4.0": "bg-gray-200 text-gray-800",
  "Level 1": "bg-gray-200 text-gray-800",
  "Level 2": "bg-green-100 text-green-800",
  "Level 3": "bg-blue-100 text-blue-800",
  "Level 4": "bg-purple-100 text-purple-800",
  "Level 5": "bg-orange-100 text-orange-800",
  "Pre-Level 1": "bg-gray-100 text-gray-600",
};

const TEST_TYPE_LABEL: Record<string, string> = {
  cefr: "CEFR", toeic: "TOEIC", ielts: "IELTS", cutfl: "CU-TFL",
};

export default function PlacementTestClient({ englishTest, thaiTest, allTests }: Props) {
  const router = useRouter();
  const [state, setState] = useState<TestState>("select");

  // Select screen state
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    testId: string;
    roadmap: LinkedRoadmap;
  } | null>(null);

  // Running test state
  const [language, setLanguage] = useState<Language>("english");
  const [testType, setTestType] = useState<TestType>("cefr");
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(45);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
  }

  function startTest(lang: Language, type: TestType) {
    const qs = shuffleArray(getTestQuestions(lang, type));
    setLanguage(lang);
    setTestType(type);
    setQuestions(qs);
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setState("running");
    startTimer();
  }

  useEffect(() => {
    if (state !== "running" || selected !== null) return;
    if (timeLeft === 0) {
      advance([...answers, null]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);
  }

  function advance(newAnswers: (number | null)[]) {
    setAnswers(newAnswers);
    setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      startTimer();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      submitTest(newAnswers);
    }
  }

  function next() {
    if (selected === null) return;
    advance([...answers, selected]);
  }

  function handleSkip() {
    advance([...answers, null]);
  }

  async function submitTest(finalAnswers: (number | null)[]) {
    setSubmitting(true);
    const res = calculateTestResult(testType, questions, finalAnswers);

    const apiRes = await fetch("/api/placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        testType,
        score: res.score,
        answers: finalAnswers,
        level: res.level,
      }),
    });
    setSubmitting(false);

    if (!apiRes.ok) {
      toast.error("Có lỗi khi lưu kết quả");
      return;
    }

    setResult(res);
    setState("done");
  }

  // ── Delete handlers ────────────────────────────────────────────
  async function handleDelete(testId: string, force = false) {
    setDeleting(testId);
    try {
      const res = await fetch(`/api/placement/${testId}${force ? "?force=true" : ""}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.status === 409) {
        // Has a linked roadmap — ask for confirmation
        setConfirmDelete({ testId, roadmap: data.roadmap });
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa");
        return;
      }

      if (data.deletedRoadmap) {
        toast.success("Đã xóa bài kiểm tra và lộ trình liên quan");
      } else {
        toast.success("Đã xóa bài kiểm tra");
      }
      setConfirmDelete(null);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  // ── Select screen ──────────────────────────────────────────────
  if (state === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kiểm tra đầu vào</h1>
          <p className="text-muted-foreground mt-1">
            Hoàn thành bài test để hệ thống xây lộ trình học phù hợp với trình độ của bạn.
          </p>
        </div>

        {/* Step 1 – Choose language */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Bước 1 · Chọn ngôn ngữ</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["english", "thai"] as Language[]).map((lang) => {
              const meta = LANG_META[lang];
              const done = lang === "english" ? englishTest : thaiTest;
              const isSelected = selectedLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${meta.color}`} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold text-white px-2 py-1 rounded ${meta.color}`}>
                        {meta.flag}
                      </span>
                      <span className="font-semibold">{meta.label}</span>
                    </div>
                    {done && (
                      <Badge className={`text-xs ${LEVEL_COLORS[done.level] ?? "bg-gray-100"}`}>
                        {done.level}
                      </Badge>
                    )}
                  </div>
                  {done && (
                    <p className="text-xs text-muted-foreground mt-2 ml-1">
                      Gần nhất: {done.level} · {new Date(done.completedAt).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 – Choose test type */}
        {selectedLang && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Bước 2 · Chọn loại bài test
            </p>
            <div className="grid gap-3">
              {TEST_TYPES[selectedLang].map((type) => {
                const meta = TEST_META[type];
                return (
                  <Card
                    key={type}
                    className="cursor-pointer hover:border-primary/60 transition-colors"
                    onClick={() => startTest(selectedLang, type)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{meta.label}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            {meta.desc}
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {(englishTest || thaiTest) && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <Award className="text-yellow-500" size={24} />
              <div>
                <p className="font-medium text-sm">Tip: Làm cả 2 ngôn ngữ</p>
                <p className="text-xs text-muted-foreground">
                  Mỗi ngôn ngữ có lộ trình riêng. Bạn có thể học song song hoặc tập trung từng ngôn ngữ.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Test history + delete ── */}
        {allTests.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Lịch sử kiểm tra</p>
            <div className="rounded-xl border overflow-hidden divide-y">
              {allTests.map((t) => {
                const lm = LANG_META[t.language as Language];
                const isDeleting = deleting === t.id;
                const isConfirming = confirmDelete?.testId === t.id;
                return (
                  <div key={t.id} className="bg-background">
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded shrink-0 ${lm?.color ?? "bg-gray-400"}`}>
                        {lm?.flag ?? t.language.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {TEST_TYPE_LABEL[t.testType] ?? t.testType}
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            · Trình độ {t.level} · {t.score}/100
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.completedAt).toLocaleDateString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        title="Xóa bài kiểm tra"
                      >
                        {isDeleting
                          ? <span className="text-xs">...</span>
                          : <Trash2 size={15} />}
                      </button>
                    </div>

                    {/* Confirm panel — shown inline below the row */}
                    {isConfirming && (
                      <div className="mx-4 mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                        <div className="flex items-start gap-2 text-destructive">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                          <p className="text-xs font-medium leading-snug">
                            Bài kiểm tra này đang được dùng bởi{" "}
                            <strong>lộ trình {confirmDelete.roadmap.targetExam ?? confirmDelete.roadmap.language}</strong>.
                            <br />
                            Xóa sẽ <strong>xóa luôn toàn bộ lộ trình và tiến độ học</strong>. Không thể hoàn tác.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 h-7 text-xs"
                            disabled={isDeleting}
                            onClick={() => handleDelete(t.id, true)}
                          >
                            {isDeleting ? "Đang xóa..." : "Xóa cả lộ trình"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Running screen ─────────────────────────────────────────────
  if (state === "running") {
    const q = questions[current];
    const progress = (current / questions.length) * 100;
    const langMeta = LANG_META[language];
    const typeMeta = TEST_META[testType];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold text-white px-2 py-1 rounded ${langMeta.color}`}>
              {langMeta.flag}
            </span>
            <span className="font-semibold text-sm">{typeMeta.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 text-sm font-mono font-semibold tabular-nums ${
              timeLeft <= 10 ? "text-red-500" : "text-muted-foreground"
            }`}>
              <Timer size={14} />
              {String(timeLeft).padStart(2, "0")}s
            </span>
            <span className="text-sm text-muted-foreground">
              {current + 1} / {questions.length}
            </span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Section + level badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize text-xs">
            {q.section === "part5"
              ? "Hoàn thành câu"
              : q.section === "part7"
              ? "Đọc hiểu"
              : q.section === "grammar"
              ? "Ngữ pháp"
              : q.section === "reading"
              ? "Đọc hiểu"
              : q.section === "vocabulary"
              ? "Từ vựng"
              : q.section === "function"
              ? "Chức năng giao tiếp"
              : q.section}
          </Badge>
          <Badge variant="outline" className="text-xs">{q.level}</Badge>
          {"difficulty" in q && (
            <Badge variant="outline" className="text-xs capitalize">
              {(q as { difficulty: string }).difficulty}
            </Badge>
          )}
        </div>

        {/* Passage (Part 7 / IELTS reading) */}
        {q.passage && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Đoạn văn
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{q.passage}</p>
            </CardContent>
          </Card>
        )}

        {/* Question */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-base font-medium leading-relaxed mb-6">{q.question}</p>

            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                let className =
                  "w-full text-left justify-start h-auto py-3 px-4 font-normal rounded-lg border transition-colors";

                if (selected !== null) {
                  if (i === q.answer) {
                    className += " border-green-500 bg-green-50 text-green-800";
                  } else if (i === selected && selected !== q.answer) {
                    className += " border-red-400 bg-red-50 text-red-800";
                  } else {
                    className += " border-border text-muted-foreground opacity-50";
                  }
                } else {
                  className += " border-border hover:border-primary/60 hover:bg-muted/50 cursor-pointer";
                }

                return (
                  <button
                    key={i}
                    className={className}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null && i !== selected && i !== q.answer}
                  >
                    <span className="mr-3 font-semibold text-muted-foreground text-sm">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div
                className={`mt-4 text-sm p-3 rounded-lg ${
                  selected === q.answer
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selected === q.answer
                  ? "✓ Chính xác!"
                  : `✗ Đáp án đúng: ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          {selected === null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span>💡</span>
              <span>
                Không chắc? Hãy <strong>bỏ qua</strong> — giúp xác định đúng trình độ thật của bạn.
              </span>
            </div>
          )}
          <div className="flex gap-2">
            {selected === null && (
              <Button
                onClick={handleSkip}
                disabled={submitting}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Bỏ qua câu này
              </Button>
            )}
            <Button
              onClick={next}
              disabled={selected === null || submitting}
              className="flex-1"
              size="lg"
            >
              {submitting
                ? "Đang tính kết quả..."
                : current + 1 === questions.length
                ? "Nộp bài"
                : "Câu tiếp theo →"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────────
  if (state === "done" && result) {
    const langMeta = LANG_META[language];
    const typeMeta = TEST_META[testType];
    const levelClass = LEVEL_COLORS[result.level] ?? "bg-gray-100 text-gray-800";

    return (
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold">Bài test hoàn thành!</h2>
          <p className="text-muted-foreground mt-1">
            <span className={`text-xs font-bold text-white px-2 py-1 rounded mr-1 ${langMeta.color}`}>
              {langMeta.flag}
            </span>
            {langMeta.label} · {typeMeta.label}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-5xl font-bold text-primary">
              {result.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Kết quả ước tính</p>
              <Badge className={`text-base px-4 py-1 ${levelClass}`}>{result.rawLabel}</Badge>
            </div>
            {result.description && (
              <p className="text-sm text-muted-foreground">{result.description}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedLang(null);
              setState("select");
            }}
          >
            Quay lại
          </Button>
          <Button
            onClick={() =>
              router.push(`/roadmap?lang=${language}&level=${encodeURIComponent(result.level)}`)
            }
          >
            Xây lộ trình ngay →
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
