"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuestionsForTest, calculateScore, type Question } from "@/lib/placement-data";
import type { PlacementTest } from "@prisma/client";
import { CheckCircle, Clock, Award } from "lucide-react";

type Props = {
  englishTest: PlacementTest | null;
  thaiTest: PlacementTest | null;
};

type TestState = "select" | "running" | "done";

const LANG_META = {
  english: {
    label: "Tiếng Anh",
    flag: "🇬🇧",
    desc: "30 câu · Từ vựng · Ngữ pháp · Đọc hiểu · ~20 phút",
    color: "bg-blue-500",
  },
  thai: {
    label: "Tiếng Thái",
    flag: "🇹🇭",
    desc: "20 câu · Từ vựng · Ngữ pháp · Đọc hiểu · ~15 phút",
    color: "bg-red-500",
  },
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-gray-200 text-gray-800",
  A2: "bg-green-100 text-green-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-purple-100 text-purple-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

export default function PlacementTestClient({ englishTest, thaiTest }: Props) {
  const router = useRouter();
  const [state, setState] = useState<TestState>("select");
  const [language, setLanguage] = useState<"english" | "thai">("english");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; level: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startTest(lang: "english" | "thai") {
    setLanguage(lang);
    const qs = getQuestionsForTest(lang);
    setQuestions(qs);
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setResult(null);
    setState("running");
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return; // locked
    setSelected(idx);
  }

  function next() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      submitTest(newAnswers);
    }
  }

  async function submitTest(finalAnswers: number[]) {
    setSubmitting(true);
    const score = calculateScore(questions, finalAnswers);

    const res = await fetch("/api/placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, score, answers: finalAnswers }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Có lỗi khi lưu kết quả");
      return;
    }

    setResult({ score: data.score, level: data.level });
    setState("done");
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["english", "thai"] as const).map((lang) => {
            const meta = LANG_META[lang];
            const done = lang === "english" ? englishTest : thaiTest;
            return (
              <Card key={lang} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${meta.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{meta.flag}</span>
                      {meta.label}
                    </CardTitle>
                    {done && (
                      <Badge className={LEVEL_COLORS[done.level]}>
                        {done.level}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    {meta.desc}
                  </div>

                  {done ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle size={16} />
                        Đã hoàn thành · {done.score}/100 điểm
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trình độ: <strong>{done.level}</strong> ·{" "}
                        {new Date(done.completedAt).toLocaleDateString("vi-VN")}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startTest(lang)}
                        >
                          Làm lại
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/roadmap?lang=${lang}`)}
                        >
                          Xem lộ trình
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => startTest(lang)} className="w-full">
                      Bắt đầu bài test
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(englishTest || thaiTest) && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <Award className="text-yellow-500" size={24} />
              <div>
                <p className="font-medium text-sm">Tip: Làm cả 2 bài test</p>
                <p className="text-xs text-muted-foreground">
                  Mỗi ngôn ngữ có lộ trình riêng. Bạn có thể học song song hoặc tập trung từng ngôn ngữ.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Running screen ─────────────────────────────────────────────
  if (state === "running") {
    const q = questions[current];
    const progress = ((current) / questions.length) * 100;
    const meta = LANG_META[language];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.flag}</span>
            <span className="font-semibold">{meta.label}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {current + 1} / {questions.length}
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Section badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {q.section === "listening_sim" ? "Nghe (mô phỏng)" : q.section === "grammar" ? "Ngữ pháp" : q.section === "reading" ? "Đọc hiểu" : "Từ vựng"}
          </Badge>
          <Badge variant="outline">{q.level}</Badge>
        </div>

        {/* Question */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg font-medium leading-relaxed mb-6">{q.question}</p>

            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                let variant: "outline" | "default" | "secondary" = "outline";
                let className = "w-full text-left justify-start h-auto py-3 px-4 font-normal";

                if (selected !== null) {
                  if (i === q.answer) {
                    className += " border-green-500 bg-green-50 text-green-800";
                  } else if (i === selected && selected !== q.answer) {
                    className += " border-red-400 bg-red-50 text-red-800";
                  }
                } else if (selected === null) {
                  className += " hover:bg-muted";
                }

                return (
                  <Button
                    key={i}
                    variant={variant}
                    className={className}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null && i !== selected && i !== q.answer}
                  >
                    <span className="mr-3 font-semibold text-muted-foreground">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </Button>
                );
              })}
            </div>

            {selected !== null && (
              <div className="mt-4">
                <div
                  className={`text-sm p-3 rounded-lg ${
                    selected === q.answer
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {selected === q.answer ? "✓ Chính xác!" : `✗ Đáp án đúng: ${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={next}
          disabled={selected === null || submitting}
          className="w-full"
          size="lg"
        >
          {submitting
            ? "Đang tính kết quả..."
            : current + 1 === questions.length
            ? "Nộp bài"
            : "Câu tiếp theo →"}
        </Button>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────────
  if (state === "done" && result) {
    const meta = LANG_META[language];
    const levelClass = LEVEL_COLORS[result.level] ?? "bg-gray-200 text-gray-800";

    return (
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold">Bài test hoàn thành!</h2>
          <p className="text-muted-foreground mt-1">
            {meta.flag} {meta.label}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-5xl font-bold text-primary">{result.score}<span className="text-2xl text-muted-foreground">/100</span></div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Trình độ của bạn</p>
              <Badge className={`text-lg px-4 py-1 ${levelClass}`}>
                {result.level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getLevelDescription(result.level, language)}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setState("select")}>
            Quay lại
          </Button>
          <Button onClick={() => router.push(`/roadmap?lang=${language}&level=${result.level}`)}>
            Xây lộ trình ngay →
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function getLevelDescription(level: string, language: "english" | "thai"): string {
  const desc: Record<string, Record<string, string>> = {
    english: {
      A1: "Người mới bắt đầu. Bạn biết các từ và cụm từ cơ bản nhất.",
      A2: "Sơ cấp. Bạn có thể giao tiếp trong các tình huống đơn giản hàng ngày.",
      B1: "Trung cấp. Bạn có thể xử lý hầu hết các tình huống khi đi du lịch.",
      B2: "Trung cao. Bạn có thể giao tiếp trôi chảy với người bản ngữ.",
      C1: "Nâng cao. Bạn sử dụng ngôn ngữ linh hoạt, hiệu quả trong các mục đích xã hội và học thuật.",
      C2: "Thành thạo. Gần như tương đương người bản ngữ.",
    },
    thai: {
      A1: "Mới bắt đầu. Bạn biết một số từ và cụm từ cơ bản trong tiếng Thái.",
      A2: "Sơ cấp. Bạn có thể giao tiếp trong các tình huống đơn giản hàng ngày.",
      B1: "Trung cấp. Bạn có thể hiểu các chủ đề quen thuộc và giao tiếp cơ bản.",
      B2: "Trung cao. Bạn có thể giao tiếp tự nhiên với người Thái.",
      C1: "Nâng cao. Bạn sử dụng tiếng Thái thành thạo trong nhiều ngữ cảnh.",
      C2: "Thành thạo. Gần như tương đương người bản ngữ.",
    },
  };
  return desc[language]?.[level] ?? "";
}
