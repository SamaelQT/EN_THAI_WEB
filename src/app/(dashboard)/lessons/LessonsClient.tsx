"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, PlayCircle, BookOpen, Sparkles } from "lucide-react";

// Built-in lesson content for the MVP (expandable via AI later)
const LESSON_CONTENT: Record<string, any> = {
  vocabulary_english_A1: {
    title: "Từ vựng cơ bản – Chào hỏi & Gia đình",
    words: [
      { word: "Hello", phonetic: "/həˈloʊ/", meaning: "Xin chào", example: "Hello, how are you?" },
      { word: "Goodbye", phonetic: "/ˌɡʊdˈbaɪ/", meaning: "Tạm biệt", example: "Goodbye! See you tomorrow." },
      { word: "Family", phonetic: "/ˈfæm.ɪ.li/", meaning: "Gia đình", example: "My family has four members." },
      { word: "Mother", phonetic: "/ˈmʌð.ər/", meaning: "Mẹ", example: "My mother is a teacher." },
      { word: "Father", phonetic: "/ˈfɑː.ðər/", meaning: "Bố", example: "My father works in Hanoi." },
      { word: "Friend", phonetic: "/frend/", meaning: "Bạn bè", example: "She is my best friend." },
    ],
    quiz: [
      { q: "\"Gia đình\" trong tiếng Anh là?", options: ["Friend", "Family", "Mother", "School"], answer: 1 },
      { q: "\"Goodbye\" có nghĩa là gì?", options: ["Xin chào", "Cảm ơn", "Tạm biệt", "Xin lỗi"], answer: 2 },
      { q: "\"My ___ is a teacher.\" Điền vào chỗ trống:", options: ["friend", "father", "mother", "Tất cả đều đúng"], answer: 3 },
    ],
  },
  grammar_english_A2: {
    title: "Ngữ pháp – Thì quá khứ đơn",
    explanation: `
# Thì quá khứ đơn (Simple Past)

## Dùng khi nào?
- Hành động **đã hoàn thành** trong quá khứ
- Thường có: *yesterday, last week, ago, in 2020...*

## Cấu trúc
| Loại | Công thức |
|------|-----------|
| Khẳng định | S + V-ed / V2 |
| Phủ định | S + didn't + V |
| Câu hỏi | Did + S + V? |

## Ví dụ
- She **worked** yesterday. (Cô ấy đã làm việc hôm qua)
- He **didn't go** to school. (Anh ấy không đi học)
- **Did** you **eat** breakfast? (Bạn đã ăn sáng chưa?)
    `,
    quiz: [
      { q: "Chọn câu đúng với thì quá khứ đơn:", options: ["She go to school yesterday.", "She went to school yesterday.", "She goes to school yesterday.", "She going to school yesterday."], answer: 1 },
      { q: "\"He _____ (not/eat) dinner last night.\"", options: ["didn't eat", "doesn't eat", "hadn't eat", "not ate"], answer: 0 },
      { q: "\"_____ you _____ a good time?\" (Did/have)", options: ["Did / had", "Did / have", "Does / have", "Were / have"], answer: 1 },
    ],
  },
  vocabulary_thai_A1: {
    title: "คำศัพท์พื้นฐาน – การทักทาย",
    words: [
      { word: "สวัสดี", phonetic: "sà-wàt-dee", meaning: "Xin chào", example: "สวัสดีครับ (Xin chào – nam giới)" },
      { word: "ขอบคุณ", phonetic: "khɔ̀ɔp-khun", meaning: "Cảm ơn", example: "ขอบคุณมากครับ (Cảm ơn rất nhiều)" },
      { word: "ใช่", phonetic: "châi", meaning: "Đúng / Phải", example: "ใช่ครับ (Đúng vậy)" },
      { word: "ไม่", phonetic: "mâi", meaning: "Không", example: "ไม่เป็นไร (Không sao)" },
      { word: "อร่อย", phonetic: "à-ròi", meaning: "Ngon", example: "อาหารอร่อยมาก (Món ăn rất ngon)" },
    ],
    quiz: [
      { q: "\"สวัสดี\" có nghĩa là gì?", options: ["Cảm ơn", "Xin chào", "Tạm biệt", "Ngon"], answer: 1 },
      { q: "Cách nói \"Cảm ơn\" trong tiếng Thái:", options: ["ใช่", "ไม่", "ขอบคุณ", "สวัสดี"], answer: 2 },
      { q: "\"อร่อย\" nghĩa là?", options: ["Đẹp", "Ngon", "Tốt", "Nhiều"], answer: 1 },
    ],
  },
};

const LESSON_TYPE_ICONS: Record<string, string> = {
  vocabulary: "📚",
  grammar: "📝",
  listening: "🎧",
  reading: "📖",
  speaking: "🗣️",
  writing: "✏️",
  review: "🔄",
};

type Day = { id: string; dayNumber: number; lessonType: string; status: string; lessonId: string | null };
type Week = { id: string; weekNumber: number; theme: string; skills: string; status: string; days: Day[] };
type Roadmap = { id: string; language: string; currentLevel: string; targetLevel: string; totalWeeks: number; weeks: Week[] };

type Props = {
  enRoadmap: Roadmap | null;
  thRoadmap: Roadmap | null;
  defaultLang: string;
  userId: string;
};

type LessonViewState = "list" | "generating" | "learning" | "quiz" | "done";

export default function LessonsClient({ enRoadmap, thRoadmap, defaultLang, userId }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<string>(defaultLang);
  const roadmap = lang === "english" ? enRoadmap : thRoadmap;
  const [lessonState, setLessonState] = useState<LessonViewState>("list");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeLessonKey, setActiveLessonKey] = useState("");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [lessonStartTime, setLessonStartTime] = useState<number>(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  async function openLesson(type: string, language: string, level: string, dayId?: string) {
    const key = `${type}_${language}_${level}`;
    const cached = LESSON_CONTENT[key];
    setActiveDayId(dayId ?? null);

    if (cached) {
      setActiveLesson(cached);
      setActiveLessonKey(key);
      setLessonState("learning");
      setLessonStartTime(Date.now());
      setQuizIndex(0);
      setQuizAnswers([]);
      setQuizSelected(null);
      setQuizScore(0);
      return;
    }

    // Generate via AI
    setActiveLessonKey(key);
    setLessonState("generating");
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonType: type, language, level }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      LESSON_CONTENT[key] = data; // cache in memory for this session
      setActiveLesson(data);
      setLessonState("learning");
      setLessonStartTime(Date.now());
      setQuizIndex(0);
      setQuizAnswers([]);
      setQuizSelected(null);
      setQuizScore(0);
    } catch (e) {
      toast.error("Không thể tạo bài học. Thử lại sau.");
      setLessonState("list");
    }
  }

  function startQuiz() {
    setLessonState("quiz");
    setQuizIndex(0);
    setQuizSelected(null);
  }

  function answerQuiz(idx: number) {
    if (quizSelected !== null) return;
    setQuizSelected(idx);
  }

  function nextQuizQuestion() {
    if (quizSelected === null) return;
    const correct = activeLesson.quiz[quizIndex].answer;
    const newScore = quizScore + (quizSelected === correct ? 1 : 0);
    const newAnswers = [...quizAnswers, quizSelected];
    setQuizScore(newScore);
    setQuizAnswers(newAnswers);
    setQuizSelected(null);

    if (quizIndex + 1 < activeLesson.quiz.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      finishLesson(newScore, activeLesson.quiz.length);
    }
  }

  async function finishLesson(correctCount: number, total: number) {
    const score = Math.round((correctCount / total) * 100);
    setQuizScore(score);
    setLessonState("done");

    try {
      const [lessonType, language, level] = activeLessonKey.split("_");
      const timeSpent = lessonStartTime > 0 ? Math.round((Date.now() - lessonStartTime) / 1000) : null;
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonType, language, level, score, timeSpent, dayId: activeDayId }),
      });
      const data = await res.json();
      const xp = data.xpGained ?? (score >= 70 ? 15 : 8);
      toast.success(`Hoàn thành! ${score}% · +${xp} XP · 🔥 ${data.newStreak} ngày`);
      if (data.weekAdvanced) {
        toast.success("🎉 Hoàn thành tuần học! Tuần tiếp theo đã mở.", { duration: 5000 });
      }
      if (data.newAchievements?.length > 0) {
        for (const name of data.newAchievements) {
          toast.success(`🏅 Thành tích mới: ${name}`, { duration: 5000 });
        }
      }
      router.refresh();
    } catch {
      toast.success(`Hoàn thành! ${score}% chính xác`);
    }
  }

  // ── Generating screen ────────────────────────────────────────
  if (lessonState === "generating") {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-20">
        <Loader2 className="mx-auto animate-spin text-primary" size={48} />
        <div>
          <h2 className="text-lg font-semibold">AI đang tạo bài học...</h2>
          <p className="text-sm text-muted-foreground mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────
  if (lessonState === "quiz" && activeLesson) {
    const q = activeLesson.quiz[quizIndex];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Kiểm tra nhanh</h2>
          <span className="text-sm text-muted-foreground">{quizIndex + 1}/{activeLesson.quiz.length}</span>
        </div>
        <Progress value={((quizIndex) / activeLesson.quiz.length) * 100} />
        <Card>
          <CardContent className="pt-6">
            <p className="font-medium text-lg mb-6">{q.q}</p>
            <div className="grid gap-3">
              {q.options.map((opt: string, i: number) => {
                let cls = "w-full text-left justify-start h-auto py-3 px-4 font-normal border rounded-lg transition-colors ";
                if (quizSelected !== null) {
                  if (i === q.answer) cls += "border-green-500 bg-green-50 text-green-800";
                  else if (i === quizSelected) cls += "border-red-400 bg-red-50 text-red-800";
                  else cls += "opacity-50";
                } else {
                  cls += "hover:bg-muted cursor-pointer";
                }
                return (
                  <div key={i} className={cls} onClick={() => answerQuiz(i)}>
                    <span className="mr-3 font-semibold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>
            {quizSelected !== null && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${quizSelected === q.answer ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {quizSelected === q.answer ? "✓ Chính xác!" : `✗ Đáp án đúng: ${q.options[q.answer]}`}
              </div>
            )}
          </CardContent>
        </Card>
        <Button onClick={nextQuizQuestion} disabled={quizSelected === null} className="w-full" size="lg">
          {quizIndex + 1 === activeLesson.quiz.length ? "Hoàn thành" : "Tiếp theo →"}
        </Button>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────
  if (lessonState === "done") {
    const score = quizScore;
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="text-5xl">{score >= 70 ? "🎉" : "💪"}</div>
        <div>
          <h2 className="text-2xl font-bold">{score >= 70 ? "Xuất sắc!" : "Cố gắng thêm nhé!"}</h2>
          <p className="text-muted-foreground">{activeLesson?.title}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-5xl font-bold text-primary">{score}<span className="text-2xl text-muted-foreground">/100</span></div>
            <p className="text-sm text-muted-foreground mt-2">
              {score >= 90 ? "Hoàn hảo! Tiếp tục phát huy." : score >= 70 ? "Tốt! Bạn nắm vững kiến thức này." : "Ôn lại bài và thử lại để cải thiện."}
            </p>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setLessonState("list")}>Quay lại</Button>
          <Button onClick={() => { setLessonState("learning"); setQuizIndex(0); setQuizSelected(null); setQuizScore(0); setQuizAnswers([]); }}>
            Học lại
          </Button>
        </div>
      </div>
    );
  }

  // ── Learning screen (vocabulary/grammar) ──────────────────────
  if (lessonState === "learning" && activeLesson) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLessonState("list")}>← Quay lại</Button>
          <Badge variant="outline">{activeLessonKey}</Badge>
        </div>
        <h2 className="text-xl font-bold">{activeLesson.title}</h2>

        {/* Vocabulary lesson */}
        {activeLesson.words && (
          <div className="grid gap-4">
            {activeLesson.words.map((w: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold">{w.word}</p>
                      <p className="text-sm text-muted-foreground">{w.phonetic}</p>
                      <p className="text-primary font-medium mt-1">{w.meaning}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 italic">"{w.example}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Grammar lesson */}
        {activeLesson.explanation && (
          <Card>
            <CardContent className="pt-6 prose prose-sm max-w-none">
              {activeLesson.explanation.split("\n").map((line: string, i: number) => {
                if (line.startsWith("# ")) return <h2 key={i} className="text-xl font-bold mt-0">{line.slice(2)}</h2>;
                if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold">{line.slice(3)}</h3>;
                if (line.startsWith("- ")) return <p key={i} className="text-sm">• {line.slice(2)}</p>;
                if (line.startsWith("| ")) return null;
                return <p key={i} className="text-sm">{line}</p>;
              })}
            </CardContent>
          </Card>
        )}

        {/* Reading lesson */}
        {activeLesson.passage && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Đoạn văn</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{activeLesson.passage}</p>
            </CardContent>
          </Card>
        )}

        {/* Listening simulation */}
        {activeLesson.transcript && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🎧 {activeLesson.context}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line bg-muted/50 p-3 rounded-lg">{activeLesson.transcript}</p>
            </CardContent>
          </Card>
        )}

        {/* Writing lesson */}
        {activeLesson.prompt && (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">✏️ Đề bài</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{activeLesson.prompt}</p></CardContent>
            </Card>
            {activeLesson.tips && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Gợi ý</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {activeLesson.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm">• {tip}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {activeLesson.example && (
              <Card className="border-dashed">
                <CardHeader className="pb-2"><CardTitle className="text-base">Bài mẫu</CardTitle></CardHeader>
                <CardContent><p className="text-sm italic text-muted-foreground">{activeLesson.example}</p></CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Speaking lesson */}
        {activeLesson.phrases && (
          <div className="space-y-3">
            <div className="grid gap-3">
              {activeLesson.phrases.map((p: any, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <p className="font-bold text-lg">{p.phrase}</p>
                    <p className="text-sm text-muted-foreground">{p.phonetic}</p>
                    <p className="text-primary font-medium mt-1">{p.meaning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {activeLesson.dialogue && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Hội thoại mẫu</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeLesson.dialogue.map((line: any, i: number) => (
                      <div key={i} className={`flex gap-2 ${line.speaker === "B" ? "flex-row-reverse" : ""}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${line.speaker === "A" ? "bg-muted" : "bg-primary/10"}`}>
                          <p className="font-medium">{line.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{line.translation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Button onClick={startQuiz} size="lg" className="w-full">
          Làm bài kiểm tra nhanh ({activeLesson.quiz?.length ?? 0} câu) →
        </Button>
      </div>
    );
  }

  // ── List screen ──────────────────────────────────────────────
  const hasEn = !!enRoadmap;
  const hasTh = !!thRoadmap;

  const LangTabs = () => (
    <div className="flex gap-2">
      {(hasEn || !hasTh) && (
        <Button
          size="sm"
          variant={lang === "english" ? "default" : "outline"}
          onClick={() => { setLang("english"); setLessonState("list"); }}
          className="gap-1.5"
        >
          🇬🇧 Tiếng Anh
        </Button>
      )}
      {(hasTh || !hasEn) && (
        <Button
          size="sm"
          variant={lang === "thai" ? "default" : "outline"}
          onClick={() => { setLang("thai"); setLessonState("list"); }}
          className="gap-1.5"
        >
          🇹🇭 Tiếng Thái
        </Button>
      )}
    </div>
  );

  if (!roadmap) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Bài học</h1>
          <LangTabs />
        </div>
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 opacity-30" size={48} />
            <p>Bạn chưa có lộ trình {lang === "english" ? "Tiếng Anh" : "Tiếng Thái"}.</p>
            <Button className="mt-4" onClick={() => router.push("/placement")}>
              Làm bài kiểm tra đầu vào
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevel = roadmap.currentLevel;

  const lessonTypes = [
    { type: "vocabulary", label: "Từ vựng", icon: "📚", desc: "Học từ mới theo chủ đề" },
    { type: "grammar", label: "Ngữ pháp", icon: "📝", desc: "Cấu trúc và quy tắc ngữ pháp" },
    { type: "listening", label: "Nghe", icon: "🎧", desc: "Luyện nghe và hiểu" },
    { type: "reading", label: "Đọc hiểu", icon: "📖", desc: "Đọc và phân tích văn bản" },
    { type: "speaking", label: "Nói", icon: "🗣️", desc: "Luyện phát âm và nói" },
    { type: "writing", label: "Viết", icon: "✏️", desc: "Viết đoạn văn và essay" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài học</h1>
          <p className="text-muted-foreground mt-1">Trình độ {currentLevel}</p>
        </div>
        <LangTabs />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessonTypes.map(({ type, label, icon, desc }) => {
          const key = `${type}_${lang}_${currentLevel}`;
          const hasContent = !!LESSON_CONTENT[key];
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-shadow hover:shadow-md ${!hasContent ? "opacity-70" : ""}`}
              onClick={() => openLesson(type, lang, currentLevel)}
            >
              <CardContent className="pt-5 pb-4 flex items-center gap-4">
                <div className="text-3xl w-12 h-12 flex items-center justify-center bg-muted rounded-xl">
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                {hasContent ? (
                  <PlayCircle className="text-primary" size={20} />
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles size={10} />AI
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly plan */}
      {roadmap.weeks.length > 0 && (() => {
        const activeWeek = roadmap.weeks.find((w) => w.status === "active") ?? roadmap.weeks[0];
        return (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Kế hoạch tuần này
            <span className="text-sm font-normal text-muted-foreground ml-2">Tuần {activeWeek.weekNumber}: {activeWeek.theme}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeWeek.days.map((day) => (
              <Card
                key={day.id}
                className={`text-center p-3 cursor-pointer ${day.status === "completed" ? "bg-green-50 border-green-200" : "hover:bg-muted/50"}`}
                onClick={() => day.status !== "completed" && openLesson(day.lessonType, lang, currentLevel, day.id)}
              >
                <p className="text-xs text-muted-foreground">Ngày {day.dayNumber}</p>
                <p className="text-lg mt-1">{LESSON_TYPE_ICONS[day.lessonType] ?? "📌"}</p>
                <p className="text-xs font-medium mt-1 capitalize">{day.lessonType}</p>
                {day.status === "completed" && <CheckCircle2 className="mx-auto mt-1 text-green-500" size={14} />}
              </Card>
            ))}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
