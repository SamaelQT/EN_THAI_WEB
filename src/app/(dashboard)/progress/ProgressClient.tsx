"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Flame, Target, Clock } from "lucide-react";

type SkillStat = { key: string; total: number; correct: number; accuracy: number };
type Report = {
  windowDays: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  lessonsCompleted: number;
  minutesStudied: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  bySkill: SkillStat[];
  weakestSkills: SkillStat[];
  weakestTopics: SkillStat[];
  daily: { date: string; total: number; correct: number; accuracy: number }[];
};

const LANGS = [
  { id: "english", label: "Tiếng Anh", badge: "EN", color: "bg-blue-500" },
  { id: "thai", label: "Tiếng Thái", badge: "TH", color: "bg-red-500" },
  { id: "korean", label: "Tiếng Hàn", badge: "KR", color: "bg-violet-500" },
];

const SKILL_VI: Record<string, string> = {
  vocabulary: "Từ vựng", grammar: "Ngữ pháp", reading: "Đọc hiểu",
  listening: "Nghe", speaking: "Nói", writing: "Viết", review: "Ôn tập",
};

function accColor(acc: number) {
  if (acc >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (acc >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function accBar(acc: number) {
  if (acc >= 80) return "bg-emerald-500";
  if (acc >= 60) return "bg-amber-500";
  return "bg-red-500";
}

type RedoQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string | null;
  topic: string | null;
  lessonType: string | null;
};

export default function ProgressClient({ defaultLang }: { defaultLang: string }) {
  const [lang, setLang] = useState(defaultLang);
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // "Redo the ones you got wrong" drill
  const [redo, setRedo] = useState<RedoQuestion[]>([]);
  const [redoLoading, setRedoLoading] = useState(false);
  const [redoActive, setRedoActive] = useState(false);
  const [redoIdx, setRedoIdx] = useState(0);
  const [redoPicked, setRedoPicked] = useState<number | null>(null);
  const [redoRight, setRedoRight] = useState(0);

  const loadRedo = useCallback(async () => {
    setRedoLoading(true);
    try {
      const res = await fetch(`/api/quiz-attempts?language=${lang}`);
      const data = await res.json();
      setRedo(res.ok ? data.questions : []);
    } catch {
      setRedo([]);
    } finally {
      setRedoLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    setRedoActive(false);
    setRedoIdx(0);
    setRedoPicked(null);
    setRedoRight(0);
    loadRedo();
  }, [loadRedo]);

  /** Log the retry so a question answered correctly leaves the queue. */
  async function answerRedo(idx: number) {
    if (redoPicked !== null) return;
    const q = redo[redoIdx];
    setRedoPicked(idx);
    if (idx === q.answer) setRedoRight((n) => n + 1);

    void fetch("/api/quiz-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: lang,
        source: "review",
        lessonType: q.lessonType,
        topic: q.topic,
        attempts: [{
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          chosenAnswer: idx,
          explanation: q.explanation,
        }],
      }),
    }).catch(() => { /* best-effort */ });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress?language=${lang}&days=${days}`);
      const data = await res.json();
      setReport(res.ok ? data.report : null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [lang, days]);

  useEffect(() => { load(); }, [load]);

  const maxDaily = report ? Math.max(1, ...report.daily.map((d) => d.total)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tiến độ học</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Thống kê dựa trên từng câu hỏi bạn đã trả lời
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {LANGS.map((l) => (
            <Button key={l.id} size="sm" variant={lang === l.id ? "default" : "outline"}
              onClick={() => setLang(l.id)} className="gap-1.5">
              <span className={`text-[10px] font-bold text-white px-1 py-0.5 rounded ${l.color}`}>{l.badge}</span>
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              days === d ? "bg-background shadow-sm" : "hover:bg-background/50"
            }`}>
            {d} ngày
          </button>
        ))}
      </div>

      {/* ── Redo drill: questions still answered wrong ── */}
      {redoActive ? (
        (() => {
          const q = redo[redoIdx];
          if (!q) {
            return (
              <Card className="border-primary/40">
                <CardContent className="py-10 text-center space-y-3">
                  <div className="text-4xl">{redoRight === redo.length ? "🎉" : "💪"}</div>
                  <p className="font-bold">Xong! Đúng {redoRight}/{redo.length} câu.</p>
                  <p className="text-sm text-muted-foreground">
                    Những câu bạn vừa làm đúng sẽ không xuất hiện lại ở đây.
                  </p>
                  <Button variant="outline" onClick={() => { setRedoActive(false); loadRedo(); }}>
                    Quay lại thống kê
                  </Button>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Làm lại câu sai</CardTitle>
                  <span className="text-sm text-muted-foreground">{redoIdx + 1}/{redo.length}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium leading-relaxed">{q.question}</p>
                <div className="grid gap-2">
                  {q.options.map((opt, i) => {
                    let cls = "w-full text-left py-2.5 px-3 rounded-lg border text-sm transition-colors ";
                    if (redoPicked !== null) {
                      if (i === q.answer) cls += "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300";
                      else if (i === redoPicked) cls += "border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300";
                      else cls += "opacity-40";
                    } else cls += "hover:bg-muted cursor-pointer";
                    return (
                      <button key={i} type="button" className={cls}
                        disabled={redoPicked !== null} onClick={() => answerRedo(i)}>
                        <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {redoPicked !== null && (
                  <>
                    {q.explanation && (
                      <div className="p-3 rounded-lg border border-green-200 dark:border-green-900 text-sm">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          Vì sao đáp án đúng là "{q.options[q.answer]}"
                        </p>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                    <Button className="w-full" onClick={() => { setRedoIdx((i) => i + 1); setRedoPicked(null); }}>
                      {redoIdx + 1 === redo.length ? "Xem kết quả" : "Tiếp theo →"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()
      ) : redo.length > 0 && (
        <Card className="border-primary/40">
          <CardContent className="pt-4 pb-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="font-medium text-sm">🔁 Bạn còn {redo.length} câu chưa làm đúng</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Làm lại tới khi đúng — câu nào đúng sẽ tự rời khỏi danh sách này.
              </p>
            </div>
            <Button onClick={() => { setRedoActive(true); setRedoIdx(0); setRedoPicked(null); setRedoRight(0); }}
              disabled={redoLoading}>
              {redoLoading ? <Loader2 size={15} className="animate-spin" /> : "Làm lại ngay →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-primary" size={32} /></div>
      ) : !report || report.totalAnswered === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có dữ liệu trong {days} ngày qua.</p>
            <p className="text-xs mt-1">Làm một vài bài kiểm tra để hệ thống phân tích điểm mạnh/yếu.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Target size={13} />Độ chính xác</div>
              <p className={`text-2xl font-bold ${accColor(report.accuracy)}`}>{report.accuracy}%</p>
              <p className="text-xs text-muted-foreground">{report.totalCorrect}/{report.totalAnswered} câu</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp size={13} />Bài đã học</div>
              <p className="text-2xl font-bold">{report.lessonsCompleted}</p>
              <p className="text-xs text-muted-foreground">điểm TB {report.averageScore}%</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock size={13} />Thời gian học</div>
              <p className="text-2xl font-bold">{report.minutesStudied}<span className="text-sm font-normal text-muted-foreground"> phút</span></p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Flame size={13} />Streak</div>
              <p className="text-2xl font-bold text-orange-500">{report.currentStreak}</p>
              <p className="text-xs text-muted-foreground">dài nhất {report.longestStreak} ngày</p>
            </CardContent></Card>
          </div>

          {/* Daily activity — bar height = questions answered, colour = accuracy */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Hoạt động theo ngày</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 h-32 min-w-fit">
                  {report.daily.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" style={{ width: 18 }}>
                      <div
                        className={`w-full rounded-t ${accBar(d.accuracy)}`}
                        style={{ height: `${Math.max(6, (d.total / maxDaily) * 100)}%` }}
                        title={`${d.date}: ${d.correct}/${d.total} đúng (${d.accuracy}%)`}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-6 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />≥80% đúng</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />60–79%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />&lt;60%</span>
                <span>Chiều cao cột = số câu đã làm</span>
              </div>
            </CardContent>
          </Card>

          {/* Accuracy per skill */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Độ chính xác theo kỹ năng</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.bySkill.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu.</p>
              ) : report.bySkill.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{SKILL_VI[s.key] ?? s.key}</span>
                    <span className={accColor(s.accuracy)}>{s.accuracy}% <span className="text-muted-foreground text-xs">({s.correct}/{s.total})</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${accBar(s.accuracy)}`} style={{ width: `${s.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* What to work on */}
          {report.weakestTopics.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">🎯 Nên ôn lại những chủ đề này</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.weakestTopics.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{t.key}</span>
                    <span className={`shrink-0 ${accColor(t.accuracy)}`}>
                      {t.accuracy}% <span className="text-muted-foreground text-xs">({t.correct}/{t.total})</span>
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Sắp xếp từ yếu nhất. Chỉ tính chủ đề bạn đã làm ít nhất 3 câu.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
