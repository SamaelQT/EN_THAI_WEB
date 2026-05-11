"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, PlayCircle, BookOpen, Volume2, Mic, Square } from "lucide-react";
import CalendarView, { type LessonDay } from "./CalendarView";
import { CEFR_WEEK_THEMES, TOEIC_WEEK_THEMES, IELTS_WEEK_THEMES, THAI_WEEK_THEMES, type Level } from "@/lib/roadmap-generator";

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

// ── Helper components ─────────────────────────────────────────

function AudioWaveform() {
  return (
    <div className="flex items-end gap-1 h-8">
      {[0, 0.15, 0.05, 0.25].map((delay, i) => (
        <div
          key={i}
          className="w-2 bg-primary rounded-full"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `waveBar 0.7s ease-in-out ${delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes waveBar { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 0.8) return <Badge className="bg-green-500 text-white">Xuất sắc ✨</Badge>;
  if (score >= 0.6) return <Badge className="bg-yellow-500 text-white">Tốt 👍</Badge>;
  return <Badge variant="destructive">Thử lại 🔄</Badge>;
}

// ── Types ─────────────────────────────────────────────────────

type Roadmap = { id: string; language: string; currentLevel: string; targetLevel: string; totalWeeks: number; targetExam?: string };

type Props = {
  enRoadmap: Roadmap | null;
  thRoadmap: Roadmap | null;
  lessonDays: LessonDay[];
  defaultLang: string;
  userId: string;
  hasPlacementTest: boolean;
};

type LessonViewState = "list" | "browse" | "generating" | "learning" | "quiz" | "done" | "conversation" | "conversation-done";

type ConvMessage = { role: "user" | "assistant"; content: string };

const SCENARIOS: { id: string; label: string; icon: string; desc: string }[] = [
  { id: "restaurant", label: "Nhà hàng", icon: "🍜", desc: "Gọi món, hỏi menu" },
  { id: "interview", label: "Phỏng vấn", icon: "💼", desc: "Xin việc, giới thiệu bản thân" },
  { id: "airport", label: "Sân bay", icon: "✈️", desc: "Check-in, hỏi đường" },
  { id: "shopping", label: "Mua sắm", icon: "🛍️", desc: "Hỏi giá, chọn hàng" },
  { id: "friend", label: "Gặp bạn mới", icon: "👋", desc: "Làm quen, chuyện trò" },
  { id: "hotel", label: "Khách sạn", icon: "🏨", desc: "Đặt phòng, check-in" },
  { id: "doctor", label: "Bác sĩ", icon: "🏥", desc: "Mô tả triệu chứng" },
  { id: "directions", label: "Hỏi đường", icon: "🗺️", desc: "Tìm đường, địa điểm" },
];

export default function LessonsClient({ enRoadmap, thRoadmap, lessonDays, defaultLang, userId, hasPlacementTest }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<string>(defaultLang);
  const [lessonState, setLessonState] = useState<LessonViewState>("list");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeLessonKey, setActiveLessonKey] = useState("");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // Free practice browse state
  const [browseType, setBrowseType] = useState<{ type: string; label: string; icon: string; desc: string } | null>(null);
  const [browseLevel, setBrowseLevel] = useState<string>("");
  const [browseTab, setBrowseTab] = useState<"cefr" | "toeic" | "ielts">("cefr");
  const [browseTopic, setBrowseTopic] = useState<string | null>(null);

  // Conversation state
  const [convScenario, setConvScenario] = useState<string>("");
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convListening, setConvListening] = useState(false);
  const [convLevel, setConvLevel] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  useEffect(() => {
    if (lessonState !== "conversation" || convMessages.length > 0) return;
    // AI nói trước khi user bắt đầu
    setConvLoading(true);
    fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "__START__" }],
        language: lang,
        scenario: convScenario,
        level: convLevel,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.reply) {
          setConvMessages([{ role: "assistant", content: data.reply }]);
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const ttsLangVal = lang === "thai" ? "th-TH" : "en-US";
            const cut = data.reply.search(/💡|Góp ý|Nhận xét|Lưu ý:/);
            const speakPart = (cut > 0 ? data.reply.slice(0, cut) : data.reply).trim();
            const utt = new SpeechSynthesisUtterance(speakPart);
            const voices = window.speechSynthesis.getVoices();
            const picked = voices.find((v) => v.voiceURI === selectedVoiceURI) ?? voices.find((v) => v.lang.startsWith(ttsLangVal.slice(0, 2)));
            if (picked) utt.voice = picked;
            utt.lang = ttsLangVal;
            utt.rate = 0.9;
            window.speechSynthesis.speak(utt);
          }
        }
      })
      .catch(() => toast.error("Không thể kết nối AI."))
      .finally(() => setConvLoading(false));
  }, [lessonState, convScenario]);
  const [lessonStartTime, setLessonStartTime] = useState<number>(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // B1 – TTS per vocabulary word
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  // B2 – Listening
  const [audioRevealed, setAudioRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  // B3 – Speaking mic
  const [micPhraseIdx, setMicPhraseIdx] = useState<number | null>(null);
  const [micResults, setMicResults] = useState<Record<number, { transcript: string; score: number }>>({});

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Speech helpers ────────────────────────────────────────────

  function getTTSLang() {
    return activeLessonKey.includes("_thai_") ? "th-TH" : "en-US";
  }

  function speakWord(word: string, idx: number) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Trình duyệt không hỗ trợ phát âm");
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = getTTSLang();
    utt.onstart = () => setSpeakingIdx(idx);
    utt.onend = () => setSpeakingIdx(null);
    utt.onerror = () => setSpeakingIdx(null);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }

  function playTranscript() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Trình duyệt không hỗ trợ phát âm");
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(activeLesson.transcript);
    utt.lang = getTTSLang();
    utt.onend = () => { setIsPlayingAudio(false); setAudioRevealed(true); };
    utt.onerror = () => { setIsPlayingAudio(false); setAudioRevealed(true); };
    utteranceRef.current = utt;
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utt);
  }

  function stopTranscript() {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setAudioRevealed(true);
  }

  function startMic(phraseIdx: number, phraseText: string) {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) {
      toast.error("Trình duyệt không hỗ trợ nhận giọng nói. Dùng Chrome hoặc Edge.");
      return;
    }
    if (recognitionRef.current) recognitionRef.current.abort();
    const rec = new SR();
    rec.lang = getTTSLang();
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setMicPhraseIdx(phraseIdx);

    let gotResult = false;

    rec.onresult = (e: any) => {
      gotResult = true;
      const spoken = e.results[0][0].transcript as string;
      const score = matchScore(spoken, phraseText);
      setMicResults((prev) => ({ ...prev, [phraseIdx]: { transcript: spoken, score } }));
      setMicPhraseIdx(null);
    };
    rec.onerror = (e: any) => {
      setMicPhraseIdx(null);
      if (e.error === "not-allowed") toast.error("Cần cấp quyền microphone cho trang web");
      else if (e.error === "no-speech") toast.info("Không nghe thấy giọng nói, nói to hơn và thử lại");
      else if (e.error === "network") toast.error("Lỗi mạng, kiểm tra kết nối");
      else toast.error(`Lỗi nhận giọng nói: ${e.error}`);
    };
    rec.onend = () => {
      setMicPhraseIdx(null);
      if (!gotResult) toast.info("Không nhận được giọng nói — thử nói to và rõ hơn");
    };
    rec.start();
  }

  function stopMic() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicPhraseIdx(null);
  }

  function matchScore(spoken: string, target: string): number {
    const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
    const targetWords = target.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (targetWords.length === 0) return 0;
    return targetWords.filter((w) => spokenWords.includes(w)).length / targetWords.length;
  }

  function stopAll() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }

  // ── Lesson flow ───────────────────────────────────────────────

  async function openLesson(type: string, language: string, level: string, dayId?: string, topic?: string, examType?: string) {
    const examSuffix = examType && examType !== "general" ? `_${examType.toLowerCase()}` : "";
    const key = topic ? `${type}_${language}_${level}_${topic}${examSuffix}` : `${type}_${language}_${level}`;
    const cached = LESSON_CONTENT[key];
    setActiveDayId(dayId ?? null);
    // reset speech state
    setAudioRevealed(false);
    setIsPlayingAudio(false);
    setSpeakingIdx(null);
    setMicPhraseIdx(null);
    setMicResults({});
    stopAll();

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
        body: JSON.stringify({ lessonType: type, language, level, topic, examType }),
      });
      const data = await res.json();
      if (data.error) {
        if (res.status === 429) toast.error("AI đang quá tải, thử lại sau vài giây.");
        else toast.error(data.error);
        setLessonState("browse");
        return;
      }
      LESSON_CONTENT[key] = data;
      setActiveLesson(data);
      setLessonState("learning");
      setLessonStartTime(Date.now());
      setQuizIndex(0);
      setQuizAnswers([]);
      setQuizSelected(null);
      setQuizScore(0);
    } catch {
      toast.error("Không thể tạo bài học. Thử lại sau.");
      setLessonState("browse");
    }
  }

  function startQuiz() {
    setLessonState("quiz");
    setQuizIndex(0);
    setQuizSelected(null);
    stopAll();
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

  // ── Browse screen (free practice) ────────────────────────────
  if (lessonState === "browse" && browseType) {
    type BrowseTab = "cefr" | "toeic" | "ielts";
    const CEFR_LEVELS: { lvl: string; desc: string }[] = [
      { lvl: "A1", desc: "Sơ cấp — vừa mới bắt đầu" },
      { lvl: "A2", desc: "Sơ cấp nâng cao" },
      { lvl: "B1", desc: "Trung cấp — giao tiếp hàng ngày" },
      { lvl: "B2", desc: "Trung cấp nâng cao" },
      { lvl: "C1", desc: "Cao cấp — gần như thành thạo" },
      { lvl: "C2", desc: "Thành thạo — tương đương bản ngữ" },
    ];
    const TOEIC_BANDS: { label: string; range: string; cefr: string }[] = [
      { label: "10–254", range: "10–254", cefr: "A1" },
      { label: "255–549", range: "255–549", cefr: "A2" },
      { label: "550–784", range: "550–784", cefr: "B1" },
      { label: "785–989", range: "785–989", cefr: "B2" },
      { label: "990", range: "990", cefr: "C1" },
    ];
    const IELTS_BANDS: { label: string; range: string; cefr: string }[] = [
      { label: "Band 1–2", range: "1.0–2.9", cefr: "A1" },
      { label: "Band 3", range: "3.0–3.9", cefr: "A2" },
      { label: "Band 4–5", range: "4.0–5.4", cefr: "B1" },
      { label: "Band 5.5–6.5", range: "5.5–6.5", cefr: "B2" },
      { label: "Band 7–7.5", range: "7.0–7.5", cefr: "C1" },
      { label: "Band 8+", range: "8.0–9.0", cefr: "C2" },
    ];

    const tabs: { id: BrowseTab; label: string }[] = [
      { id: "cefr", label: "CEFR" },
      { id: "toeic", label: "TOEIC" },
      { id: "ielts", label: "IELTS" },
    ];
    // browseLevel reused as cefr level regardless of tab
    const selectedCefr = browseLevel;

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLessonState("list")}>← Quay lại</Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{browseType.icon}</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">{browseType.label}</h2>
              <p className="text-xs text-muted-foreground">{browseType.desc}</p>
            </div>
          </div>
        </div>

        {/* Tab bar — only show TOEIC/IELTS for English */}
        {lang === "english" && (
          <div className="space-y-2">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setBrowseTab(t.id); setBrowseLevel(""); setBrowseTopic(null); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    browseTab === t.id ? "bg-background shadow-sm" : "hover:bg-background/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {browseTab === "toeic" && (
              <p className="text-xs text-muted-foreground px-1">
                🎯 Lộ trình TOEIC: Listening (Part 1-4) + Reading (Part 5-7) — không có Speaking/Writing
              </p>
            )}
            {browseTab === "ielts" && (
              <p className="text-xs text-muted-foreground px-1">
                🎯 Lộ trình IELTS: Listening + Reading + Writing (Task 1 & 2) + Speaking (Part 1-3)
              </p>
            )}
            {browseTab === "cefr" && (
              <p className="text-xs text-muted-foreground px-1">
                🎯 CEFR tổng quát: Giao tiếp toàn diện, không gắn với kỳ thi cụ thể
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {browseTab === "cefr" || lang === "thai" ? "Chọn trình độ CEFR"
              : browseTab === "toeic" ? "Chọn nhóm điểm TOEIC"
              : "Chọn band IELTS"}
          </p>

          {/* CEFR grid */}
          {(browseTab === "cefr" || lang === "thai") && (
            <div className="grid grid-cols-3 gap-2">
              {CEFR_LEVELS.map(({ lvl, desc }) => (
                <button
                  key={lvl}
                  onClick={() => { setBrowseLevel(lvl); setBrowseTopic(null); }}
                  className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                    selectedCefr === lvl
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}

          {/* TOEIC list */}
          {browseTab === "toeic" && lang === "english" && (
            <div className="grid gap-2">
              {TOEIC_BANDS.map(({ label, range, cefr }) => (
                <button
                  key={cefr}
                  onClick={() => { setBrowseLevel(cefr); setBrowseTopic(null); }}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    selectedCefr === cefr
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="font-semibold">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedCefr === cefr ? "bg-white/20" : "bg-muted"}`}>
                    = {cefr}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* IELTS list */}
          {browseTab === "ielts" && lang === "english" && (
            <div className="grid gap-2">
              {IELTS_BANDS.map(({ label, range, cefr }) => (
                <button
                  key={cefr}
                  onClick={() => { setBrowseLevel(cefr); setBrowseTopic(null); }}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    selectedCefr === cefr
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="font-semibold">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedCefr === cefr ? "bg-white/20" : "bg-muted"}`}>
                    = {cefr}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedCefr && (
            <p className="text-xs text-center text-muted-foreground">
              Bài học ở trình độ CEFR <strong>{selectedCefr}</strong>
            </p>
          )}
        </div>

        {/* Conversation: chọn tình huống */}
        {selectedCefr && browseType.type === "conversation" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Chọn tình huống</p>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setBrowseTopic(s.id)}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                    browseTopic === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-sm font-semibold leading-tight">{s.label}</p>
                  <p className={`text-xs mt-0.5 ${browseTopic === s.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic list — cho các bài học thông thường */}
        {selectedCefr && browseType.type !== "conversation" && (() => {
          let themes: string[];
          if (lang === "thai") {
            themes = THAI_WEEK_THEMES[selectedCefr as Level] ?? [];
          } else if (browseTab === "toeic") {
            themes = TOEIC_WEEK_THEMES[selectedCefr as Level] ?? [];
          } else if (browseTab === "ielts") {
            themes = IELTS_WEEK_THEMES[selectedCefr as Level] ?? [];
          } else {
            themes = CEFR_WEEK_THEMES[selectedCefr as Level] ?? [];
          }
          return (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Chọn chủ đề</p>
              <div className="grid gap-2">
                {themes.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setBrowseTopic(topic)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                      browseTopic === topic
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <Button
          className="w-full"
          size="lg"
          disabled={!selectedCefr || !browseTopic}
          onClick={() => {
            const examType = lang === "english"
              ? (browseTab === "toeic" ? "TOEIC" : browseTab === "ielts" ? "IELTS" : "general")
              : "general";
            if (browseType.type === "conversation") {
              setConvScenario(browseTopic!);
              setConvLevel(selectedCefr);
              setConvMessages([]);
              setLessonState("conversation");
            } else {
              openLesson(browseType.type, lang, selectedCefr, undefined, browseTopic ?? undefined, examType);
            }
          }}
        >
          {browseType.type === "conversation" ? "Bắt đầu hội thoại →" : "Bắt đầu học →"}
        </Button>
      </div>
    );
  }

  // ── Conversation screen ───────────────────────────────────────
  if (lessonState === "conversation") {
    const scenario = SCENARIOS.find((s) => s.id === convScenario);
    const ttsLang = lang === "thai" ? "th-TH" : "en-US";

    function extractSpeakPart(reply: string): string {
      const cut = reply.search(/💡|Góp ý|Nhận xét|Lưu ý:/);
      return (cut > 0 ? reply.slice(0, cut) : reply).trim();
    }

    function speakText(text: string) {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(extractSpeakPart(text));
      const picked = availableVoices.find((v) => v.voiceURI === selectedVoiceURI)
        ?? availableVoices.find((v) => v.lang.startsWith(ttsLang.slice(0, 2)));
      if (picked) utt.voice = picked;
      utt.lang = ttsLang;
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }

    async function sendMessage(userText: string) {
      const newMessages: ConvMessage[] = [...convMessages, { role: "user", content: userText }];
      setConvMessages(newMessages);
      setConvLoading(true);
      try {
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, language: lang, scenario: convScenario, level: convLevel }),
        });
        const data = await res.json();
        if (data.reply) {
          const aiMsg: ConvMessage = { role: "assistant", content: data.reply };
          setConvMessages([...newMessages, aiMsg]);
          speakText(data.reply);
        }
      } catch {
        toast.error("Không thể kết nối AI. Thử lại sau.");
      } finally {
        setConvLoading(false);
      }
    }

    function startListening() {
      const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      if (!SR) { toast.error("Trình duyệt không hỗ trợ. Dùng Chrome hoặc Edge."); return; }
      window.speechSynthesis.cancel();
      const rec = new SR();
      rec.lang = ttsLang;
      rec.interimResults = false;
      setConvListening(true);
      let got = false;
      rec.onresult = (e: any) => {
        got = true;
        sendMessage(e.results[0][0].transcript as string);
      };
      rec.onerror = (e: any) => {
        setConvListening(false);
        if (e.error === "not-allowed") toast.error("Cần cấp quyền microphone");
        else toast.error("Lỗi nhận giọng nói");
      };
      rec.onend = () => {
        setConvListening(false);
        if (!got) toast.info("Không nghe thấy giọng nói, thử lại");
      };
      rec.start();
    }

    function endConversation() {
      window.speechSynthesis.cancel();
      setLessonState("conversation-done");
    }

    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { window.speechSynthesis.cancel(); setLessonState("browse"); }}>← Quay lại</Button>
            <span className="text-lg">{scenario?.icon}</span>
            <div>
              <p className="font-semibold text-sm">{scenario?.label}</p>
              <p className="text-xs text-muted-foreground">{lang === "english" ? "Tiếng Anh" : "Tiếng Thái"} · {convLevel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {availableVoices.filter((v) => v.lang.startsWith(ttsLang.slice(0, 2))).length > 0 && (
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="text-xs rounded-md border bg-background px-2 py-1 max-w-[160px] truncate"
                title="Chọn giọng đọc"
              >
                <option value="">🔊 Giọng mặc định</option>
                {availableVoices
                  .filter((v) => v.lang.startsWith(ttsLang.slice(0, 2)))
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
              </select>
            )}
            <Button variant="destructive" size="sm" onClick={endConversation}>Kết thúc</Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {convMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-4xl mb-3">{scenario?.icon}</p>
              <p className="font-medium">{scenario?.label}</p>
              <p className="text-sm mt-1">{scenario?.desc}</p>
              <p className="text-xs mt-4 text-muted-foreground">Bấm mic để bắt đầu hội thoại</p>
            </div>
          )}
          {convMessages.map((msg, i) => {
            const isUser = msg.role === "user";
            const cut = msg.content.search(/💡|Góp ý|Nhận xét|Lưu ý:/);
            const mainText = (cut > 0 ? msg.content.slice(0, cut) : msg.content).trim();
            const hintText = cut > 0 ? msg.content.slice(cut).replace(/^(💡|Góp ý[^:]*:|Nhận xét[^:]*:|Lưu ý:)\s*/u, "").trim() : null;
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] space-y-1.5`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                    {mainText}
                  </div>
                  {!isUser && hintText && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 rounded-lg px-3 py-2">
                      💡 {hintText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {convLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Mic button */}
        <div className="pt-3 border-t shrink-0 flex justify-center">
          <button
            onClick={startListening}
            disabled={convLoading || convListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              convListening
                ? "bg-red-500 text-white scale-110 animate-pulse"
                : convLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-105"
            }`}
          >
            {convListening ? <Square size={24} /> : <Mic size={24} />}
          </button>
          <p className="absolute mt-20 text-xs text-muted-foreground">
            {convListening ? "Đang nghe..." : convLoading ? "AI đang trả lời..." : "Bấm để nói"}
          </p>
        </div>
      </div>
    );
  }

  // ── Conversation done screen ──────────────────────────────────
  if (lessonState === "conversation-done") {
    const scenario = SCENARIOS.find((s) => s.id === convScenario);
    const userTurns = convMessages.filter((m) => m.role === "user").length;
    const feedbacks = convMessages
      .filter((m) => m.role === "assistant")
      .map((m) => {
        const cut = m.content.search(/💡|Góp ý|Nhận xét|Lưu ý:/);
        return cut > 0 ? m.content.slice(cut).replace(/^(💡|Góp ý[^:]*:|Nhận xét[^:]*:|Lưu ý:)\s*/u, "").trim() : null;
      })
      .filter(Boolean) as string[];

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">{scenario?.icon}</div>
          <h2 className="text-2xl font-bold">Kết thúc hội thoại!</h2>
          <p className="text-muted-foreground">{scenario?.label} · {userTurns} lượt nói</p>
        </div>

        {feedbacks.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">💡 Nhận xét từ AI</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {feedbacks.map((fb, i) => (
                <div key={i} className="text-sm p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 rounded-lg">{fb}</div>
              ))}
            </CardContent>
          </Card>
        )}

        {feedbacks.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Không có lỗi nào được ghi nhận. Xuất sắc!</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLessonState("list")}>Quay lại</Button>
          <Button className="flex-1" onClick={() => { setConvMessages([]); setLessonState("conversation"); }}>Luyện lại</Button>
        </div>
      </div>
    );
  }

  // ── Generating screen ─────────────────────────────────────────
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

  // ── Quiz screen ───────────────────────────────────────────────
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

  // ── Done screen ───────────────────────────────────────────────
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
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => setLessonState("list")}>Quay lại</Button>
          <Button variant="outline" onClick={() => { setLessonState("learning"); setQuizIndex(0); setQuizSelected(null); setQuizScore(0); setQuizAnswers([]); }}>
            Học lại
          </Button>
          {browseType && (
            <Button onClick={() => { setBrowseLevel(""); setBrowseTab("cefr"); setBrowseTopic(null); setLessonState("browse"); }}>
              Chọn bài khác →
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Learning screen ───────────────────────────────────────────
  if (lessonState === "learning" && activeLesson) {
    const isListeningLesson = activeLessonKey.startsWith("listening_");
    const quizLocked = isListeningLesson && !audioRevealed;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { stopAll(); setLessonState("list"); }}>← Quay lại</Button>
          <Badge variant="outline">{activeLessonKey}</Badge>
        </div>
        <h2 className="text-xl font-bold">{activeLesson.title}</h2>

        {/* B1 – Vocabulary with TTS buttons */}
        {activeLesson.words && (
          <div className="grid gap-4">
            {activeLesson.words.map((w: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{w.word}</p>
                        <button
                          onClick={() => speakWord(w.word, i)}
                          disabled={speakingIdx === i}
                          className="text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                          aria-label={`Phát âm ${w.word}`}
                        >
                          {speakingIdx === i
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Volume2 size={16} />
                          }
                        </button>
                      </div>
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

        {/* B2 – Listening lesson */}
        {activeLesson.transcript && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🎧 {activeLesson.context}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Playing state: waveform + stop */}
              {isPlayingAudio && (
                <div className="flex items-center gap-4 bg-primary/5 rounded-lg p-4">
                  <AudioWaveform />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Đang phát...</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={stopTranscript} className="gap-1.5 shrink-0">
                    <Square size={14} />
                    Dừng
                  </Button>
                </div>
              )}

              {/* Not yet played: show play button */}
              {!isPlayingAudio && !audioRevealed && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Button onClick={playTranscript} size="lg" className="gap-2">
                    <PlayCircle size={20} />
                    Nghe đoạn hội thoại
                  </Button>
                  <button
                    onClick={() => setAudioRevealed(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Xem transcript
                  </button>
                </div>
              )}

              {/* During playback: show "Xem transcript" link */}
              {isPlayingAudio && (
                <button
                  onClick={stopTranscript}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Xem transcript
                </button>
              )}

              {/* Transcript revealed */}
              {audioRevealed && (
                <p className="text-sm leading-relaxed whitespace-pre-line bg-muted/50 p-3 rounded-lg">
                  {activeLesson.transcript}
                </p>
              )}
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

        {/* B3 – Speaking lesson with mic */}
        {activeLesson.phrases && (
          <div className="space-y-3">
            <div className="grid gap-3">
              {activeLesson.phrases.map((p: any, i: number) => {
                const result = micResults[i];
                const isRecording = micPhraseIdx === i;
                return (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-lg">{p.phrase}</p>
                          <p className="text-sm text-muted-foreground">{p.phonetic}</p>
                          <p className="text-primary font-medium mt-1">{p.meaning}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isRecording ? "destructive" : "outline"}
                          onClick={() => isRecording ? stopMic() : startMic(i, p.phrase)}
                          className="gap-1.5 shrink-0"
                        >
                          {isRecording ? (
                            <><Square size={14} />Dừng</>
                          ) : (
                            <><Mic size={14} />Luyện phát âm</>
                          )}
                        </Button>
                      </div>
                      {isRecording && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          Đang nghe...
                        </div>
                      )}
                      {result && (
                        <div className="bg-muted/50 rounded-lg px-3 py-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <ScoreBadge score={result.score} />
                            <span className="text-xs text-muted-foreground">{Math.round(result.score * 100)}% khớp</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Nhận được: "{result.transcript}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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

        {/* Quiz button – locked for listening until audio revealed */}
        <div className="space-y-1">
          <Button
            onClick={startQuiz}
            size="lg"
            className="w-full"
            disabled={quizLocked}
          >
            Làm bài kiểm tra nhanh ({activeLesson.quiz?.length ?? 0} câu) →
          </Button>
          {quizLocked && (
            <p className="text-xs text-center text-muted-foreground">Nghe xong bài hội thoại trước nhé</p>
          )}
        </div>
      </div>
    );
  }

  // ── List screen ───────────────────────────────────────────────
  const hasEn = !!enRoadmap;
  const hasTh = !!thRoadmap;
  const hasAnyRoadmap = hasEn || hasTh;
  const currentLevel = (lang === "english" ? enRoadmap : thRoadmap)?.currentLevel ?? "";

  const lessonTypes = [
    { type: "vocabulary", label: "Từ vựng", icon: "📚", desc: "Học từ mới theo chủ đề" },
    { type: "grammar", label: "Ngữ pháp", icon: "📝", desc: "Cấu trúc và quy tắc ngữ pháp" },
    { type: "listening", label: "Nghe", icon: "🎧", desc: "Luyện nghe và hiểu" },
    { type: "reading", label: "Đọc hiểu", icon: "📖", desc: "Đọc và phân tích văn bản" },
    { type: "speaking", label: "Nói", icon: "🗣️", desc: "Luyện phát âm và nói" },
    { type: "writing", label: "Viết", icon: "✏️", desc: "Viết đoạn văn và essay" },
    { type: "conversation", label: "Giao tiếp", icon: "💬", desc: "Hội thoại AI theo tình huống" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài học</h1>
          {currentLevel && <p className="text-muted-foreground mt-1">Trình độ {currentLevel}</p>}
        </div>
        <div className="flex gap-2">
          {hasEn && (
            <Button size="sm" variant={lang === "english" ? "default" : "outline"}
              onClick={() => { setLang("english"); setLessonState("list"); }}
              className="gap-1.5">
              <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-blue-500">EN</span>
              Tiếng Anh
            </Button>
          )}
          {hasTh && (
            <Button size="sm" variant={lang === "thai" ? "default" : "outline"}
              onClick={() => { setLang("thai"); setLessonState("list"); }}
              className="gap-1.5">
              <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-red-500">TH</span>
              Tiếng Thái
            </Button>
          )}
        </div>
      </div>

      {/* Roadmap schedule — only when user has a roadmap */}
      {hasAnyRoadmap ? (
        <CalendarView
          lessonDays={lessonDays}
          onStartLesson={(type, language, level, dayId, examType) => openLesson(type, language, level, dayId, undefined, examType)}
        />
      ) : (
        <Card>
          <CardContent className="py-6 flex items-center gap-4">
            <BookOpen className="opacity-30 shrink-0" size={36} />
            <div className="flex-1">
              <p className="font-medium text-sm">Chưa có lộ trình học</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasPlacementTest ? "Bạn đã có kết quả kiểm tra. Hãy tạo lộ trình!" : "Làm bài kiểm tra đầu vào để nhận lộ trình phù hợp."}
              </p>
            </div>
            <Button size="sm" onClick={() => router.push(hasPlacementTest ? "/roadmap" : "/placement")}>
              {hasPlacementTest ? "Tạo lộ trình →" : "Kiểm tra đầu vào →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Free practice — always visible */}
      <div>
        <h2 className="text-base font-semibold mb-1 text-muted-foreground">Luyện tập tự do</h2>
        <p className="text-xs text-muted-foreground mb-3">Chọn bài học bất kỳ, không giới hạn trình độ</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {lessonTypes.map((lt) => (
            <Card
              key={lt.type}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                const activeRoadmap = lang === "english" ? enRoadmap : thRoadmap;
                const exam = activeRoadmap?.targetExam ?? "general";
                const defaultTab: "cefr" | "toeic" | "ielts" =
                  exam === "TOEIC" ? "toeic" : exam === "IELTS" ? "ielts" : "cefr";
                setBrowseType(lt);
                setBrowseLevel(currentLevel || "B1");
                setBrowseTab(defaultTab);
                setBrowseTopic(null);
                setLessonState("browse");
              }}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-muted rounded-lg shrink-0">
                  {lt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{lt.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{lt.desc}</p>
                </div>
                <PlayCircle className="text-muted-foreground shrink-0" size={16} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
