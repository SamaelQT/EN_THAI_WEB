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
import { CEFR_WEEK_THEMES, TOEIC_WEEK_THEMES, IELTS_WEEK_THEMES, THAI_WEEK_THEMES, KOREAN_WEEK_THEMES, type Level } from "@/lib/roadmap-generator";
import { scorePronunciation, type PronunciationResult } from "@/lib/pronunciation";
import { useTtsRate, TTS_RATES } from "@/lib/tts";
import SpeechRateControl from "@/components/SpeechRateControl";

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

/** Renders a row of flames that grows with the streak count */
function StreakFire({ streak }: { streak: number }) {
  if (streak === 0) return null;

  // Flame tiers: each tier adds one more flame emoji
  const flameCount =
    streak >= 30 ? 5 :
    streak >= 14 ? 4 :
    streak >= 7  ? 3 :
    streak >= 3  ? 2 : 1;

  // Glow intensity grows with streak
  const glowClass =
    streak >= 30 ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)]" :
    streak >= 14 ? "text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]" :
    streak >= 7  ? "text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]" :
    streak >= 3  ? "text-orange-400" : "text-amber-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 select-none">
      <span className={`text-lg leading-none ${glowClass}`}>
        {"🔥".repeat(flameCount)}
      </span>
      <div className="leading-tight">
        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}</span>
        <span className="text-xs text-orange-500/80 dark:text-orange-500/60 ml-1">ngày</span>
      </div>
    </div>
  );
}

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

type Roadmap = { id: string; language: string; currentLevel: string; targetLevel: string; totalWeeks: number; targetExam?: string; targetScore?: number | null; placementTestLevel?: string | null; placementTestType?: string | null; scriptMode?: string | null };

type Props = {
  enRoadmap: Roadmap | null;
  thRoadmap: Roadmap | null;
  krRoadmap: Roadmap | null;
  lessonDays: LessonDay[];
  defaultLang: string;
  userId: string;
  hasPlacementTest: boolean;
  enStreak?: number;
  thStreak?: number;
  krStreak?: number;
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

export default function LessonsClient({ enRoadmap, thRoadmap, krRoadmap, lessonDays, defaultLang, userId, hasPlacementTest, enStreak = 0, thStreak = 0, krStreak = 0 }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<string>(defaultLang);
  const [lessonState, setLessonState] = useState<LessonViewState>("list");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeLessonKey, setActiveLessonKey] = useState("");
  const [activeLessonLang, setActiveLessonLang] = useState<string>("english");
  const [activeLessonType, setActiveLessonType] = useState<string>("vocabulary");
  const [activeLessonLevel, setActiveLessonLevel] = useState<string>("A1");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [lessonContentHidden, setLessonContentHidden] = useState(false);

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
  // Live transcript shown while the learner is still speaking.
  // `convFinal` mirrors the ref so React actually re-renders as words land.
  const [convInterim, setConvInterim] = useState("");
  const [convFinal, setConvFinal] = useState("");
  const convRecognitionRef = useRef<any>(null);
  const convTranscriptRef = useRef<string>("");
  /** true once the learner presses stop — tells onend not to auto-resume */
  const convStopWantedRef = useRef(false);
  const [convLevel, setConvLevel] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  // Listening lesson voice state
  // Up to 4 speaker voices (index 0-3)
  const [listeningVoices, setListeningVoices] = useState<string[]>(["", "", "", ""]);
  // Speaking lesson: the voice used for the "nghe mẫu" button on each phrase
  const [speakingVoiceURI, setSpeakingVoiceURI] = useState<string>("");
  // Shared playback speed, remembered across lessons
  const [ttsRate, setTtsRate] = useTtsRate();
  const [playingLineIdx, setPlayingLineIdx] = useState<number>(-1);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  /**
   * Deep-link from a "Kế hoạch cấp tốc" (Cram Plan) block — `?startBlock=<id>`.
   *
   * Reads the query string directly instead of `useSearchParams()` so this file doesn't
   * need to be wrapped in a `<Suspense>` boundary just for a one-shot read on mount.
   * Deliberately reuses `openLesson()`/the existing conversation state rather than
   * rendering anything new — the cram plan feature owns none of this screen's rendering.
   */
  const startBlockHandledRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || startBlockHandledRef.current) return;
    const blockId = new URLSearchParams(window.location.search).get("startBlock");
    if (!blockId) return;
    startBlockHandledRef.current = true;
    // Strip the param immediately so a refresh/back-nav doesn't relaunch the same block
    router.replace("/lessons");

    fetch(`/api/cram-plan/blocks/${blockId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.link) { toast.error(data.error ?? "Không tìm thấy việc cần làm"); return; }
        const link = data.link as {
          language: string; level: string; linkType: string;
          linkLessonType: string | null; linkTopic: string | null;
          linkExamType: string | null; linkScenario: string | null;
        };
        setLang(link.language);
        if (link.linkType === "lesson" && link.linkLessonType) {
          openLesson(link.linkLessonType, link.language, link.level, undefined, link.linkTopic ?? undefined, link.linkExamType ?? undefined);
        } else if (link.linkType === "conversation") {
          setConvScenario(link.linkScenario ?? "friend");
          setConvLevel(link.level);
          setConvMessages([]);
          setLessonState("conversation");
        } else if (link.linkType === "review") {
          router.push("/review");
        }
      })
      .catch(() => toast.error("Không mở được việc cần làm từ kế hoạch cấp tốc."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        scriptMode: lang === "thai" ? (thRoadmap?.scriptMode ?? "native") : "native",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.reply) {
          setConvMessages([{ role: "assistant", content: data.reply }]);
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const ttsLangVal = lang === "thai" ? "th-TH" : lang === "korean" ? "ko-KR" : "en-US";
            const cut = data.reply.search(/💡|Góp ý|Nhận xét|Lưu ý:/);
            const speakPart = (cut > 0 ? data.reply.slice(0, cut) : data.reply).trim();
            const utt = new SpeechSynthesisUtterance(speakPart);
            const voices = window.speechSynthesis.getVoices();
            const picked = voices.find((v) => v.voiceURI === selectedVoiceURI) ?? voices.find((v) => v.lang.startsWith(ttsLangVal.slice(0, 2)));
            if (picked) utt.voice = picked;
            utt.lang = ttsLangVal;
            utt.rate = ttsRate;
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
  // Snapshot of the finished quiz so the result screen can show what went wrong
  const [quizReview, setQuizReview] = useState<{
    q: string; options: string[]; answer: number; picked: number;
    explanation?: string; whyWrong?: string[];
  }[]>([]);

  // Writing lesson state
  const [writingText, setWritingText] = useState("");
  const [writingFeedback, setWritingFeedback] = useState<{
    score: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
    corrections?: { original: string; corrected: string; note: string }[];
  } | null>(null);
  const [isEvaluatingWriting, setIsEvaluatingWriting] = useState(false);

  // Checkpoint quiz state (after completing 5 days)
  const [checkpointReady, setCheckpointReady] = useState(false);
  const [checkpointTopics, setCheckpointTopics] = useState<string[]>([]);
  const [checkpointQuiz, setCheckpointQuiz] = useState<{ q: string; options: string[]; answer: number }[] | null>(null);
  const [isCheckpointQuiz, setIsCheckpointQuiz] = useState(false);
  const [isLoadingCheckpoint, setIsLoadingCheckpoint] = useState(false);

  // B1 – TTS per vocabulary word
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  // B2 – Listening
  const [audioRevealed, setAudioRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  // B3 – Speaking mic
  const [micPhraseIdx, setMicPhraseIdx] = useState<number | null>(null);
  const [micResults, setMicResults] = useState<Record<number, { transcript: string; result: PronunciationResult }>>({});
  // Live partial transcript while recording a phrase
  const [micInterim, setMicInterim] = useState("");
  const micTranscriptRef = useRef<string>("");
  /** true once the learner presses stop — tells onend not to auto-resume */
  const micStopWantedRef = useRef(false);
  // Saving lesson words into the personal notebook
  const [savingWords, setSavingWords] = useState(false);
  const [wordsSaved, setWordsSaved] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Speech helpers ────────────────────────────────────────────

  function getTTSLang() {
    return activeLessonLang === "thai" ? "th-TH" : activeLessonLang === "korean" ? "ko-KR" : "en-US";
  }

  /** True if text is primarily Vietnamese (contains Vietnamese-specific diacritics) */
  function isVietnamese(text: string): boolean {
    return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text);
  }

  function speakWord(word: string, idx: number) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Trình duyệt không hỗ trợ phát âm");
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = getTTSLang();
    utt.rate = ttsRate;
    // Use the voice the learner picked for this lesson; fall back to any voice of the target language
    const voices = window.speechSynthesis.getVoices();
    const picked =
      voices.find((v) => v.voiceURI === speakingVoiceURI) ??
      voices.find((v) => v.lang.startsWith(getTTSLang().slice(0, 2)));
    if (picked) utt.voice = picked;
    utt.onstart = () => setSpeakingIdx(idx);
    utt.onend = () => setSpeakingIdx(null);
    utt.onerror = () => setSpeakingIdx(null);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }

  /**
   * Normalise a transcript that the AI returned as one flat paragraph.
   * Splits on "SpeakerName: " after sentence-ending punctuation so each
   * turn lands on its own line.  If the text already has newlines, returns as-is.
   *
   * "Welcome. John: Hello. Emily: Hi there?" →
   * "Welcome.\nJohn: Hello.\nEmily: Hi there?"
   */
  function normalizeTranscript(raw: string): string {
    if (!raw) return raw;
    const meaningful = raw.split("\n").filter((l) => l.trim()).length;
    if (meaningful > 2) return raw; // already multi-line — no change needed

    // Insert \n before every "SpeakerName: " that follows sentence-ending punctuation
    return raw
      .replace(/([.!?])\s+(?=[A-Z][a-zA-Z]{0,25}:\s)/g, "$1\n")
      .trim();
  }

  // Parse transcript into per-speaker lines: "A: Hello" → { speaker: "A", text: "Hello" }
  // Only ASCII speaker labels (A, B, Narrator, Man, Woman…) — prevents Vietnamese annotation
  // lines like "Ghi chú: ..." or "(Dịch: ...)" being misread as dialogue
  function parseTranscriptLines(transcript: string): { speaker: string; text: string }[] {
    const normalised = normalizeTranscript(transcript);
    return normalised
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        // Speaker label must be pure ASCII letters/digits/spaces, max 30 chars
        const m = l.match(/^([A-Za-z][A-Za-z0-9 ]{0,29}):\s+(.+)$/);
        return m ? { speaker: m[1].trim(), text: m[2].trim() } : { speaker: "", text: l };
      });
  }

  // Get unique speakers in order of appearance
  function getTranscriptSpeakers(lines: { speaker: string; text: string }[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of lines) {
      if (l.speaker && !seen.has(l.speaker)) { seen.add(l.speaker); out.push(l.speaker); }
    }
    return out;
  }

  function playTranscript() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Trình duyệt không hỗ trợ phát âm");
      return;
    }
    window.speechSynthesis.cancel();

    const allLines = parseTranscriptLines(activeLesson.transcript);
    // Only speak lines in the target language — skip Vietnamese annotations/translations
    const lines = allLines.filter(({ text }) => !isVietnamese(text));
    const speakers = getTranscriptSpeakers(lines);
    const voices = window.speechSynthesis.getVoices();
    const ttsPrefix = getTTSLang().slice(0, 2);
    const defaultVoice = voices.find((v) => v.lang.startsWith(ttsPrefix));

    setIsPlayingAudio(true);
    setPlayingLineIdx(0);

    let idx = 0;
    function playNext() {
      if (idx >= lines.length) {
        setIsPlayingAudio(false);
        setPlayingLineIdx(-1);
        setAudioRevealed(true);
        return;
      }
      // Map back to original line index for highlight sync
      const originalIdx = allLines.indexOf(lines[idx]);
      setPlayingLineIdx(originalIdx);
      const { speaker, text } = lines[idx];
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = getTTSLang();
      utt.rate = ttsRate;

      // Map speaker index to assigned voice (wraps if >4 speakers)
      const speakerIdx = speakers.indexOf(speaker);
      const voiceURI = listeningVoices[speakerIdx] ?? listeningVoices[0] ?? "";
      const picked = voices.find((v) => v.voiceURI === voiceURI) ?? defaultVoice;
      if (picked) utt.voice = picked;

      utt.onend = () => { idx++; playNext(); };
      utt.onerror = () => { setIsPlayingAudio(false); setPlayingLineIdx(-1); setAudioRevealed(true); };
      window.speechSynthesis.speak(utt);
    }
    playNext();
  }

  function stopTranscript() {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setPlayingLineIdx(-1);
    setAudioRevealed(true);
  }

  /**
   * Record one attempt at a phrase.
   *
   * Continuous mode + accumulating final chunks, so a learner reading a long sentence
   * isn't cut off at their first breath. The learner presses stop when they're done.
   */
  function startMic(phraseIdx: number, phraseText: string) {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) {
      toast.error("Trình duyệt không hỗ trợ nhận giọng nói. Dùng Chrome hoặc Edge.");
      return;
    }
    if (recognitionRef.current) {
      micStopWantedRef.current = true;
      recognitionRef.current.abort();
    }

    micTranscriptRef.current = "";
    micStopWantedRef.current = false;
    setMicInterim("");
    setMicPhraseIdx(phraseIdx);

    const spin = () => {
      const rec = new SR();
      rec.lang = getTTSLang();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const chunk = e.results[i][0].transcript as string;
          if (e.results[i].isFinal) micTranscriptRef.current += chunk + " ";
          else interim += chunk;
        }
        setMicInterim(interim);
      };

      rec.onerror = (e: any) => {
        if (e.error === "no-speech" || e.error === "aborted") return; // onend deals with it
        micStopWantedRef.current = true;
        if (e.error === "not-allowed") toast.error("Cần cấp quyền microphone cho trang web");
        else if (e.error === "network") toast.error("Lỗi mạng, kiểm tra kết nối");
        else toast.error(`Lỗi nhận giọng nói: ${e.error}`);
      };

      rec.onend = () => {
        // Silence ended the session but the learner hasn't pressed stop → keep listening
        if (!micStopWantedRef.current) {
          try { rec.start(); return; } catch { /* fall through */ }
        }
        recognitionRef.current = null;
        setMicPhraseIdx(null);
        setMicInterim("");

        const spoken = micTranscriptRef.current.trim();
        micTranscriptRef.current = "";
        if (!spoken) {
          toast.info("Không nhận được giọng nói — thử nói to và rõ hơn");
          return;
        }
        const result = scorePronunciation(spoken, phraseText);
        setMicResults((prev) => ({ ...prev, [phraseIdx]: { transcript: spoken, result } }));
      };

      rec.start();
    };

    spin();
  }

  function stopMic() {
    micStopWantedRef.current = true;
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* already stopped */ }
    } else {
      setMicPhraseIdx(null);
    }
  }

  function stopAll() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }

  // ── Lesson flow ───────────────────────────────────────────────

  async function openLesson(type: string, language: string, level: string, dayId?: string, topic?: string, examType?: string, weekNumber?: number, totalWeeks?: number) {
    const examSuffix = examType && examType !== "general" ? `_${examType.toLowerCase()}` : "";
    // Spoken-only Thai is entirely different content, so it needs its own cache key
    const scriptMode = language === "thai" ? (thRoadmap?.scriptMode ?? "native") : "native";
    const scriptSuffix = scriptMode === "romanized" ? "_rom" : "";
    // Each roadmap day gets its own unique cache key to prevent content duplication
    const key = dayId
      ? `day_${dayId}`
      : topic
        ? `${type}_${language}_${level}_${topic}${examSuffix}${scriptSuffix}`
        : `${type}_${language}_${level}${scriptSuffix}`;
    const cached = LESSON_CONTENT[key];
    setActiveDayId(dayId ?? null);
    setActiveLessonLang(language);
    setActiveLessonType(type);
    setActiveLessonLevel(level);
    setLessonContentHidden(false);
    setListeningVoices(["", "", "", ""]);
    setSpeakingVoiceURI("");
    // reset speech state
    setAudioRevealed(false);
    setIsPlayingAudio(false);
    setSpeakingIdx(null);
    setMicPhraseIdx(null);
    setMicResults({});
    // reset writing state
    setWritingText("");
    setWritingFeedback(null);
    setWordsSaved(false);
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
        body: JSON.stringify({ lessonType: type, language, level, topic, examType, weekNumber, totalWeeks, dayId, scriptMode }),
      });
      const data = await res.json();
      if (data.error) {
        if (res.status === 429) toast.error("AI đang quá tải, thử lại sau vài giây.");
        else toast.error(data.error);
        setLessonState("browse");
        return;
      }
      // Groq went down mid-generation and a backup provider answered. Say so — a silent
      // fallback would hide an outage that still needs fixing.
      if (data._aiFellBack) {
        toast.warning(`Groq đang lỗi — bài này do ${data._aiProvider} tạo. Xem /api/ai-health?probe=1`, { duration: 8000 });
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
    if (!activeLesson?.quiz?.length) {
      toast.error("Bài học này chưa có câu hỏi. Thử tạo lại bài học.");
      return;
    }
    setLessonState("quiz");
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizAnswers([]);
    setQuizScore(0);
    setQuizReview([]);
    stopAll();
  }

  function answerQuiz(idx: number) {
    if (quizSelected !== null) return;
    setQuizSelected(idx);
  }

  function nextQuizQuestion() {
    if (quizSelected === null) return;
    const currentQuiz = isCheckpointQuiz && checkpointQuiz ? checkpointQuiz : activeLesson.quiz;
    const correct = currentQuiz[quizIndex].answer;
    const newScore = quizScore + (quizSelected === correct ? 1 : 0);
    const newAnswers = [...quizAnswers, quizSelected];
    setQuizScore(newScore);
    setQuizAnswers(newAnswers);
    setQuizSelected(null);

    if (quizIndex + 1 < currentQuiz.length) {
      setQuizIndex(quizIndex + 1);
      return;
    }

    // Finished — snapshot every question with what the learner picked
    const reviewSnapshot = currentQuiz.map((item: any, i: number) => ({
      q: item.q,
      options: item.options,
      answer: item.answer,
      picked: newAnswers[i],
      explanation: item.explanation,
      whyWrong: item.whyWrong,
    }));
    setQuizReview(reviewSnapshot);

    // Persist every answer so the weakness report and the review queue can use it
    void fetch("/api/quiz-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: activeLessonLang,
        source: isCheckpointQuiz ? "checkpoint" : "lesson",
        lessonType: activeLessonType,
        level: activeLessonLevel,
        topic: activeLesson?.title ?? null,
        lessonId: activeDayId ? `day_${activeDayId}` : activeLessonKey,
        attempts: reviewSnapshot.map((r: any) => ({
          question: r.q,
          options: r.options,
          correctAnswer: r.answer,
          chosenAnswer: r.picked ?? -1,
          explanation: r.explanation ?? null,
        })),
      }),
    }).catch(() => { /* logging is best-effort — never block the learner */ });

    if (isCheckpointQuiz) {
      const pct = Math.round((newScore / currentQuiz.length) * 100);
      setQuizScore(pct);
      setIsCheckpointQuiz(false);
      setCheckpointReady(false);
      setCheckpointQuiz(null);
      setLessonState("done");
      toast.success(`Kiểm tra tổng hợp: ${pct}% · ${pct >= 70 ? "Xuất sắc! 🎉" : "Cố gắng thêm! 💪"}`, { duration: 5000 });
    } else {
      finishLesson(newScore, currentQuiz.length);
    }
  }

  /** Push this lesson's word list into the learner's spaced-repetition notebook. */
  async function saveWordsToNotebook() {
    const words = activeLesson?.words;
    if (!Array.isArray(words) || words.length === 0) return;
    setSavingWords(true);
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeLessonLang,
          words: words.map((w: any) => ({
            word: w.word,
            phonetic: w.phonetic,
            meaning: w.meaning,
            example: w.example,
            exampleVi: w.example_vi,
            sourceType: "lesson",
            sourceId: activeLessonKey,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWordsSaved(true);
      toast.success(
        data.added > 0
          ? `Đã lưu ${data.added} từ vào sổ${data.skipped > 0 ? ` (${data.skipped} từ đã có sẵn)` : ""}`
          : "Tất cả từ trong bài đã có trong sổ rồi"
      );
    } catch {
      toast.error("Không lưu được từ vựng. Thử lại sau.");
    } finally {
      setSavingWords(false);
    }
  }

  async function evaluateWriting() {
    if (writingText.trim().length < 30) return;
    setIsEvaluatingWriting(true);
    setWritingFeedback(null);
    try {
      const res = await fetch("/api/lessons/writing-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writing: writingText,
          prompt: activeLesson?.prompt ?? "",
          guide: activeLesson?.guide ?? "",
          language: activeLessonLang,
          level: activeLessonLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error || typeof data.score !== "number") {
        toast.error(data.error ?? "Không thể nhận xét bài viết. Thử lại sau.");
        return;
      }
      setWritingFeedback(data);
    } catch {
      toast.error("Không thể nhận xét bài viết. Thử lại sau.");
    } finally {
      setIsEvaluatingWriting(false);
    }
  }

  async function startCheckpointQuiz() {
    setIsLoadingCheckpoint(true);
    try {
      const res = await fetch("/api/lessons/checkpoint-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: checkpointTopics, language: activeLessonLang, level: activeLessonLevel }),
      });
      const data = await res.json();
      if (!data.quiz?.length) throw new Error("no quiz");
      if (data._aiFellBack) {
        toast.warning(`Groq đang lỗi — bài kiểm tra do ${data._aiProvider} tạo`, { duration: 6000 });
      }
      setCheckpointQuiz(data.quiz);
      setIsCheckpointQuiz(true);
      setQuizIndex(0);
      setQuizSelected(null);
      setQuizScore(0);
      setQuizAnswers([]);
      setQuizReview([]);
      setLessonState("quiz");
    } catch {
      toast.error("Không thể tạo bài kiểm tra tổng hợp. Thử lại sau.");
    } finally {
      setIsLoadingCheckpoint(false);
    }
  }

  async function finishLesson(correctCount: number, total: number) {
    const score = Math.round((correctCount / total) * 100);
    setQuizScore(score);
    setLessonState("done");

    try {
      // Use stored state — activeLessonKey can be "day_<id>" so never parse it for type/lang/level
      const timeSpent = lessonStartTime > 0 ? Math.round((Date.now() - lessonStartTime) / 1000) : null;
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonType: activeLessonType,
          language: activeLessonLang,
          level: activeLessonLevel,
          score,
          timeSpent,
          dayId: activeDayId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? "Không lưu được kết quả.");
        return;
      }
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
      if (data.checkpointReady && data.checkpointTopics?.length >= 3) {
        setCheckpointReady(true);
        setCheckpointTopics(data.checkpointTopics);
        toast.success("🎯 Bạn đã học 5 bài! Thử bài kiểm tra tổng hợp →", { duration: 6000 });
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
          } else if (lang === "korean") {
            themes = KOREAN_WEEK_THEMES[selectedCefr as Level] ?? [];
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
    const ttsLang = lang === "thai" ? "th-TH" : lang === "korean" ? "ko-KR" : "en-US";
    const langLabel = lang === "english" ? "Tiếng Anh" : lang === "korean" ? "Tiếng Hàn" : "Tiếng Thái";

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
      utt.rate = ttsRate;
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
          body: JSON.stringify({ messages: newMessages, language: lang, scenario: convScenario, level: convLevel, scriptMode: lang === "thai" ? (thRoadmap?.scriptMode ?? "native") : "native" }),
        });
        const data = await res.json();
        if (data._aiFellBack) {
          toast.warning(`Groq đang lỗi — đang dùng ${data._aiProvider} thay thế`, { duration: 6000 });
        }
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

    /**
     * Press-to-talk.
     *
     * The old version used the default one-shot mode: the recogniser stopped at the first
     * pause and sent whatever it had, cutting people off mid-sentence. Now it runs in
     * continuous mode, accumulates every final chunk, and only sends when the learner
     * presses stop — Chrome still ends the session on long silence, so `restartWanted`
     * transparently starts it again while the learner is still holding the floor.
     */
    function startListening() {
      const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      if (!SR) { toast.error("Trình duyệt không hỗ trợ. Dùng Chrome hoặc Edge."); return; }
      window.speechSynthesis.cancel();

      convTranscriptRef.current = "";
      convStopWantedRef.current = false;
      setConvInterim("");
      setConvFinal("");

      function spin() {
        const rec = new SR();
        rec.lang = ttsLang;
        rec.continuous = true;      // don't stop at the first pause
        rec.interimResults = true;  // show what's being heard as it comes
        convRecognitionRef.current = rec;

        rec.onresult = (e: any) => {
          let interim = "";
          let gotFinal = false;
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const chunk = e.results[i][0].transcript as string;
            if (e.results[i].isFinal) { convTranscriptRef.current += chunk + " "; gotFinal = true; }
            else interim += chunk;
          }
          setConvInterim(interim);
          if (gotFinal) setConvFinal(convTranscriptRef.current);
        };

        rec.onerror = (e: any) => {
          if (e.error === "no-speech" || e.error === "aborted") return; // handled in onend
          convStopWantedRef.current = true;
          setConvListening(false);
          setConvInterim("");
          if (e.error === "not-allowed") toast.error("Cần cấp quyền microphone");
          else if (e.error === "network") toast.error("Lỗi mạng khi nhận giọng nói");
          else toast.error("Lỗi nhận giọng nói");
        };

        rec.onend = () => {
          // Browser ended the session on silence but the learner hasn't pressed stop → resume
          if (!convStopWantedRef.current) {
            try { rec.start(); return; } catch { /* fall through to finish */ }
          }
          convRecognitionRef.current = null;
          setConvListening(false);
          setConvInterim("");
          setConvFinal("");

          const text = convTranscriptRef.current.trim();
          convTranscriptRef.current = "";
          if (text) sendMessage(text);
          else toast.info("Không nghe thấy giọng nói, thử lại");
        };

        rec.start();
      }

      setConvListening(true);
      spin();
    }

    /** Stop listening and send everything captured so far. */
    function stopListening() {
      convStopWantedRef.current = true;
      const rec = convRecognitionRef.current;
      if (rec) {
        try { rec.stop(); } catch { /* already stopped */ }
      } else {
        setConvListening(false);
      }
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
              <p className="text-xs text-muted-foreground">{langLabel} · {convLevel}</p>
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
            <select
              value={ttsRate}
              onChange={(e) => setTtsRate(Number(e.target.value))}
              className="text-xs rounded-md border bg-background px-2 py-1"
              title="Tốc độ đọc"
            >
              {TTS_RATES.map((r) => (
                <option key={r.value} value={r.value}>⏩ {r.label}</option>
              ))}
            </select>
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

        {/* Mic — press once to start, press again when you've finished the sentence */}
        <div className="pt-3 border-t shrink-0 space-y-2">
          {convListening && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 min-h-[2.5rem]">
              <p className="text-sm">
                {convFinal}
                <span className="text-muted-foreground italic">{convInterim}</span>
                {!convFinal && !convInterim && (
                  <span className="text-muted-foreground">Đang nghe, cứ nói hết câu rồi bấm Gửi...</span>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={convListening ? stopListening : startListening}
              disabled={convLoading}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                convListening
                  ? "bg-red-500 text-white scale-110"
                  : convLoading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:scale-105"
              }`}
              aria-label={convListening ? "Nói xong, gửi" : "Bấm để nói"}
            >
              {convListening ? <Square size={24} /> : <Mic size={24} />}
            </button>
            <p className="text-xs text-muted-foreground">
              {convListening
                ? "Nói thoải mái — bấm lại để gửi"
                : convLoading
                ? "AI đang trả lời..."
                : "Bấm để nói"}
            </p>
          </div>
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
  if (lessonState === "quiz" && (activeLesson || (isCheckpointQuiz && checkpointQuiz))) {
    const currentQuiz = isCheckpointQuiz && checkpointQuiz ? checkpointQuiz : activeLesson?.quiz ?? [];
    const q = currentQuiz[quizIndex];

    // Malformed / empty quiz → show a way out instead of crashing on q.q
    if (!q || !Array.isArray(q.options) || q.options.length === 0) {
      return (
        <div className="max-w-md mx-auto text-center space-y-4 py-16">
          <div className="text-4xl">😕</div>
          <p className="font-medium">Bài kiểm tra này bị lỗi dữ liệu.</p>
          <p className="text-sm text-muted-foreground">Quay lại và mở bài học để hệ thống tạo lại câu hỏi.</p>
          <Button onClick={() => { setIsCheckpointQuiz(false); setCheckpointQuiz(null); setLessonState("list"); }}>
            Quay lại danh sách bài học
          </Button>
        </div>
      );
    }

    // Strip leading letter/number labels the AI sometimes embeds: "A) text", "A. text", "1) text"
    function cleanOption(opt: string): string {
      return opt.replace(/^[A-Da-d1-4][.)]\s*/u, "").trim();
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {isCheckpointQuiz ? "🎯 Kiểm tra tổng hợp" : "Kiểm tra nhanh"}
          </h2>
          <span className="text-sm text-muted-foreground">{quizIndex + 1}/{currentQuiz.length}</span>
        </div>
        <Progress value={((quizIndex) / currentQuiz.length) * 100} />
        <Card>
          <CardContent className="pt-6">
            <p className="font-medium text-lg mb-6">{q.q}</p>
            <div className="grid gap-3">
              {q.options.map((opt: string, i: number) => {
                const label = String.fromCharCode(65 + i);
                const text = cleanOption(opt);
                let cls = "w-full text-left justify-start h-auto py-3 px-4 font-normal border rounded-lg transition-colors ";
                if (quizSelected !== null) {
                  if (i === q.answer) cls += "border-green-500 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200";
                  else if (i === quizSelected) cls += "border-red-400 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200";
                  else cls += "opacity-40";
                } else {
                  cls += "hover:bg-muted cursor-pointer";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => answerQuiz(i)}
                    disabled={quizSelected !== null}
                    aria-label={`Phương án ${label}: ${text}`}
                  >
                    <span className="mr-3 font-bold text-muted-foreground">{label}.</span>
                    {text}
                  </button>
                );
              })}
            </div>
            {quizSelected !== null && (
              <div className="mt-4 space-y-2">
                <div className={`p-3 rounded-lg text-sm ${quizSelected === q.answer ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
                  {quizSelected === q.answer ? "✓ Chính xác!" : `✗ Đáp án đúng: ${cleanOption(q.options[q.answer])}`}
                </div>

                {/* Why the option the learner picked is wrong */}
                {quizSelected !== q.answer && q.whyWrong?.[quizSelected] && (
                  <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-background text-sm">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                      Vì sao "{cleanOption(q.options[quizSelected])}" sai
                    </p>
                    <p className="leading-relaxed">{q.whyWrong[quizSelected]}</p>
                  </div>
                )}

                {/* Why the correct answer is correct */}
                {q.explanation && (
                  <div className="p-3 rounded-lg border border-green-200 dark:border-green-900 bg-background text-sm">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                      Vì sao đáp án đúng là "{cleanOption(q.options[q.answer])}"
                    </p>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Button onClick={nextQuizQuestion} disabled={quizSelected === null} className="w-full" size="lg">
          {quizIndex + 1 === currentQuiz.length ? "Hoàn thành" : "Tiếp theo →"}
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

        {/* ── Wrong-answer review — the part that actually teaches ── */}
        {(() => {
          const wrong = quizReview.filter((r) => r.picked !== r.answer);
          if (quizReview.length === 0) return null;
          if (wrong.length === 0) {
            return (
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                ✓ Bạn trả lời đúng toàn bộ {quizReview.length} câu.
              </div>
            );
          }
          return (
            <div className="text-left space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Xem lại {wrong.length} câu sai
              </p>
              <div className="space-y-2">
                {wrong.map((r, i) => (
                  <Card key={i} className="border-red-200 dark:border-red-900">
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <p className="text-sm font-medium leading-relaxed">{r.q}</p>

                      <div className="space-y-2 text-xs">
                        <div className="rounded-md bg-red-50 dark:bg-red-950/40 px-3 py-2">
                          <p className="text-red-700 dark:text-red-400 font-medium">
                            Bạn chọn: <span className="line-through">{r.options[r.picked] ?? "(bỏ qua)"}</span>
                          </p>
                          {r.whyWrong?.[r.picked] && (
                            <p className="mt-1 leading-relaxed text-foreground/80">{r.whyWrong[r.picked]}</p>
                          )}
                        </div>

                        <div className="rounded-md bg-green-50 dark:bg-green-950/40 px-3 py-2">
                          <p className="text-green-800 dark:text-green-400 font-medium">
                            Đáp án đúng: {r.options[r.answer]}
                          </p>
                          {r.explanation && (
                            <p className="mt-1 leading-relaxed text-foreground/80">{r.explanation}</p>
                          )}
                        </div>

                        {/* The remaining distractors, so the whole question is understood */}
                        {r.whyWrong && r.options.some((_, oi) => oi !== r.answer && oi !== r.picked && r.whyWrong?.[oi]) && (
                          <details className="rounded-md border px-3 py-2">
                            <summary className="cursor-pointer text-muted-foreground select-none">
                              Các phương án còn lại
                            </summary>
                            <div className="mt-2 space-y-1.5">
                              {r.options.map((opt, oi) =>
                                oi !== r.answer && oi !== r.picked && r.whyWrong?.[oi] ? (
                                  <p key={oi} className="leading-relaxed">
                                    <span className="font-medium">{opt}</span>
                                    <span className="text-muted-foreground"> — {r.whyWrong[oi]}</span>
                                  </p>
                                ) : null
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Checkpoint quiz CTA after completing day 5 */}
        {checkpointReady && (
          <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300">Bài kiểm tra tổng hợp</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">Bạn đã hoàn thành 5 bài học trong tuần này!</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {checkpointTopics.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-300">{t}</Badge>
              ))}
            </div>
            <Button
              onClick={startCheckpointQuiz}
              disabled={isLoadingCheckpoint}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isLoadingCheckpoint ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tạo bài kiểm tra...</>
              ) : (
                "Bắt đầu kiểm tra tổng hợp →"
              )}
            </Button>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => { setCheckpointReady(false); setCheckpointTopics([]); setLessonState("list"); }}>Quay lại</Button>
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
    const isListeningLesson = activeLessonKey.startsWith("listening_") || !!activeLesson.transcript;
    const isWritingLesson = !!activeLesson.prompt;
    const isSpeakingLesson = !!activeLesson.phrases;
    const quizLocked = isListeningLesson && !audioRevealed;

    const LESSON_TYPE_META: Record<string, { icon: string; label: string; instruction: string }> = {
      vocabulary: { icon: "📚", label: "Từ vựng", instruction: "Đọc từ mới → nhấn 🔊 để nghe phát âm → làm bài kiểm tra" },
      grammar:    { icon: "📝", label: "Ngữ pháp", instruction: "Đọc kỹ giải thích & ví dụ → làm bài kiểm tra" },
      listening:  { icon: "🎧", label: "Nghe",     instruction: "Nhấn PLAY để nghe → sau đó xem transcript → làm bài kiểm tra" },
      reading:    { icon: "📖", label: "Đọc hiểu", instruction: "Đọc đoạn văn → trả lời câu hỏi" },
      speaking:   { icon: "🗣️", label: "Nói",     instruction: "Nhấn 🔊 để nghe mẫu → nhấn 🎤 để luyện phát âm của bạn" },
      writing:    { icon: "✍️", label: "Viết",    instruction: "Đọc đề bài → viết bài của bạn → nhận AI nhận xét → làm bài kiểm tra" },
      review:     { icon: "🔄", label: "Ôn tập",  instruction: "Ôn lại kiến thức trong tuần → làm bài kiểm tra tổng hợp" },
    };
    const lessonMeta = LESSON_TYPE_META[activeLessonType] ?? LESSON_TYPE_META.vocabulary;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { stopAll(); setLessonState("list"); }}>← Quay lại</Button>
          <div className="flex items-center gap-2">
            {/* Show/hide content toggle — especially useful for listening focus */}
            <button
              onClick={() => setLessonContentHidden((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-md px-2.5 py-1.5 transition-colors"
              title={lessonContentHidden ? "Hiện nội dung bài học" : "Ẩn nội dung, tập trung nghe"}
            >
              {lessonContentHidden ? (
                <><BookOpen size={13} /> Hiện nội dung</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> Ẩn nội dung</>
              )}
            </button>
          </div>
        </div>

        {/* Lesson type indicator */}
        <div className="rounded-lg border bg-muted/30 px-4 py-2.5 flex items-start gap-3">
          <span className="text-xl shrink-0">{lessonMeta.icon}</span>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{lessonMeta.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lessonMeta.instruction}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold">{activeLesson.title}</h2>

        {/* B1 – Vocabulary with TTS buttons */}
        {!lessonContentHidden && activeLesson.words && (
          <div className="grid gap-4">
            <SpeechRateControl
              rate={ttsRate}
              onChange={setTtsRate}
              disabled={speakingIdx !== null}
              className="rounded-lg border bg-muted/30 p-3"
            />
            <Button
              variant={wordsSaved ? "outline" : "default"}
              size="sm"
              onClick={saveWordsToNotebook}
              disabled={savingWords || wordsSaved}
              className="gap-2 w-full"
            >
              {savingWords
                ? <><Loader2 size={14} className="animate-spin" />Đang lưu...</>
                : wordsSaved
                  ? <>✓ Đã lưu vào sổ từ</>
                  : <><BookOpen size={14} />Lưu {activeLesson.words.length} từ vào sổ từ (ôn lặp ngắt quãng)</>}
            </Button>

            {activeLesson.words.map((w: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{w.word}</p>
                        <button
                          onClick={() => speakWord(w.thai_script || w.word, i)}
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
                      {/* Spoken-only mode: the script is reference material, never the lesson */}
                      {w.thai_script && (
                        <p className="text-xs text-muted-foreground/50 mt-0.5">{w.thai_script}</p>
                      )}
                      <p className="text-primary font-medium mt-1">{w.meaning}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 italic">"{w.example}"</p>
                  {w.example_vi && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 pl-1">→ {w.example_vi}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Grammar lesson */}
        {!lessonContentHidden && activeLesson.explanation && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              {(() => {
                const lines: string[] = activeLesson.explanation.split("\n");
                const elements: React.ReactNode[] = [];
                let i = 0;
                while (i < lines.length) {
                  const line = lines[i];
                  // Heading ##
                  if (line.startsWith("## ")) {
                    elements.push(
                      <h3 key={i} className="text-sm font-bold text-primary mt-4 mb-1 first:mt-0">
                        {line.slice(3)}
                      </h3>
                    );
                    i++; continue;
                  }
                  // Heading #
                  if (line.startsWith("# ")) {
                    elements.push(
                      <h2 key={i} className="text-base font-bold mt-2 mb-1 first:mt-0">
                        {line.slice(2)}
                      </h2>
                    );
                    i++; continue;
                  }
                  // Markdown table — collect all consecutive | lines
                  if (line.startsWith("|")) {
                    const tableLines: string[] = [];
                    while (i < lines.length && lines[i].startsWith("|")) {
                      tableLines.push(lines[i]);
                      i++;
                    }
                    // Parse rows, skip separator row (---|---)
                    const rows = tableLines
                      .filter((r) => !/^\|[\s\-|]+\|$/.test(r.trim()))
                      .map((r) =>
                        r.split("|").slice(1, -1).map((cell) => cell.trim())
                      );
                    if (rows.length > 0) {
                      const [headerRow, ...bodyRows] = rows;
                      elements.push(
                        <div key={`table-${i}`} className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/60">
                              <tr>
                                {headerRow.map((cell, ci) => (
                                  <th key={ci} className="px-3 py-2 text-left font-semibold text-muted-foreground border-b">
                                    {cell}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {bodyRows.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="px-3 py-2 border-b border-border/40 leading-relaxed">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    continue;
                  }
                  // Bold inline **text**
                  if (line.startsWith("- ") || line.startsWith("* ")) {
                    const text = line.slice(2);
                    elements.push(
                      <p key={i} className="text-sm flex gap-2">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                      </p>
                    );
                    i++; continue;
                  }
                  // Empty line = spacer
                  if (line.trim() === "") {
                    i++; continue;
                  }
                  // Normal paragraph with **bold** support
                  elements.push(
                    <p key={i} className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                    />
                  );
                  i++;
                }
                return elements;
              })()}
            </CardContent>
          </Card>
        )}

        {/* Reading lesson */}
        {!lessonContentHidden && activeLesson.passage && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Đoạn văn</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{activeLesson.passage}</p>
              {activeLesson.vocab_highlight?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Từ vựng trong bài</p>
                  <div className="flex flex-wrap gap-2">
                    {activeLesson.vocab_highlight.map((v: { word: string; meaning: string }, i: number) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1">
                        <strong>{v.word}</strong> — {v.meaning}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Listening lesson */}
        {activeLesson.transcript && (() => {
          // All lines for display; TTS-safe lines (no Vietnamese) are filtered inside playTranscript
          const lines = parseTranscriptLines(activeLesson.transcript);
          const speakers = getTranscriptSpeakers(lines);
          const isDialogue = speakers.length >= 2;
          const langVoices = availableVoices.filter((v) => v.lang.startsWith(getTTSLang().slice(0, 2)));
          const SPEAKER_COLORS = ["bg-blue-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500"];
          // Learner must assign a voice to every speaker before the audio can play.
          // (If the browser ships no voice for this language we can't ask them to — play with the default.)
          const activeSpeakers = isDialogue ? speakers.slice(0, 4) : speakers.slice(0, 1);
          const voicesReady =
            langVoices.length === 0 ||
            activeSpeakers.length === 0 ||
            activeSpeakers.every((_, i) => (listeningVoices[i] ?? "") !== "");
          const langName = activeLessonLang === "korean" ? "tiếng Hàn" : activeLessonLang === "thai" ? "tiếng Thái" : "tiếng Anh";

          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">🎧 {activeLesson.context}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* ── Voice selectors — the learner picks who speaks before pressing play ── */}
                {langVoices.length === 0 ? (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      ⚠️ Trình duyệt chưa có giọng đọc {langName}. Bài nghe sẽ dùng giọng mặc định của máy —
                      cài thêm gói giọng nói {langName} trong Cài đặt hệ thống để nghe chuẩn hơn.
                    </p>
                  </div>
                ) : (() => {
                  return (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Chọn giọng đọc {isDialogue ? `(${activeSpeakers.length} người)` : ""}
                      </p>
                      {!voicesReady && (
                        <p className="text-xs text-muted-foreground">
                          Chọn người nói cho {isDialogue ? "từng nhân vật" : "bài nghe"} trước khi bắt đầu.
                        </p>
                      )}
                      {isDialogue ? (
                        <div className={`grid gap-2 ${activeSpeakers.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
                          {activeSpeakers.map((spk, si) => (
                            <div key={spk} className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 ${SPEAKER_COLORS[si] ?? "bg-gray-500"}`}>
                                  {spk[0]}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium truncate">{spk}</span>
                              </div>
                              <select
                                value={listeningVoices[si] ?? ""}
                                onChange={(e) => setListeningVoices(prev => {
                                  const next = [...prev];
                                  next[si] = e.target.value;
                                  return next;
                                })}
                                disabled={isPlayingAudio}
                                className="w-full text-xs rounded border bg-background px-2 py-1 disabled:opacity-50"
                              >
                                <option value="">— Chọn giọng —</option>
                                {langVoices.map((v) => (
                                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <select
                          value={listeningVoices[0] ?? ""}
                          onChange={(e) => setListeningVoices(prev => { const next = [...prev]; next[0] = e.target.value; return next; })}
                          disabled={isPlayingAudio}
                          className="w-full text-xs rounded border bg-background px-2 py-1 disabled:opacity-50"
                        >
                          <option value="">— Chọn giọng —</option>
                          {langVoices.map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })()}

                <SpeechRateControl
                  rate={ttsRate}
                  onChange={setTtsRate}
                  disabled={isPlayingAudio}
                  className="rounded-lg border bg-muted/30 p-3"
                />

                {/* ── Playback controls — always visible ── */}
                {isPlayingAudio ? (
                  <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-4 py-3">
                    <AudioWaveform />
                    <p className="flex-1 text-sm font-medium">Đang phát...</p>
                    <Button size="sm" variant="outline" onClick={stopTranscript} className="gap-1.5 shrink-0">
                      <Square size={13} /> Dừng
                    </Button>
                  </div>
                ) : !audioRevealed ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Button onClick={playTranscript} size="lg" className="gap-2" disabled={!voicesReady}>
                      <PlayCircle size={20} /> Nghe đoạn hội thoại
                    </Button>
                    {!voicesReady && (
                      <p className="text-xs text-muted-foreground">Chọn giọng đọc phía trên để bắt đầu</p>
                    )}
                    {!lessonContentHidden && (
                      <button
                        onClick={() => setAudioRevealed(true)}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        Xem transcript ngay
                      </button>
                    )}
                  </div>
                ) : (
                  <Button onClick={playTranscript} size="sm" variant="outline" className="w-full gap-2" disabled={!voicesReady}>
                    <PlayCircle size={15} /> Nghe lại
                  </Button>
                )}

                {/* ── Transcript + key phrases — hidden when lessonContentHidden ── */}
                {!lessonContentHidden && (audioRevealed || isPlayingAudio) && (
                  <div className={`rounded-lg border overflow-hidden ${isDialogue ? "divide-y" : "p-3 bg-muted/40"}`}>
                    {isDialogue ? (
                      lines.map((line, li) => {
                        const si = speakers.indexOf(line.speaker);
                        const isActive = playingLineIdx === li;
                        const isVi = isVietnamese(line.text);
                        return (
                          <div
                            key={li}
                            className={`flex gap-3 px-3 py-2 transition-colors ${isActive ? "bg-primary/10" : isVi ? "bg-muted/30" : "bg-background"}`}
                          >
                            {!isVi && (
                              <span className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${SPEAKER_COLORS[si] ?? "bg-gray-400"}`}>
                                {line.speaker ? line.speaker[0] : "·"}
                              </span>
                            )}
                            <div className={`flex-1 min-w-0 ${isVi ? "pl-8" : ""}`}>
                              {!isVi && <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{line.speaker}</p>}
                              <p className={`text-sm leading-relaxed ${isActive ? "text-primary font-medium" : isVi ? "text-muted-foreground/70 italic text-xs" : ""}`}>
                                {line.text}
                              </p>
                            </div>
                            {isActive && <span className="text-primary text-xs mt-1 shrink-0 animate-pulse">▶</span>}
                          </div>
                        );
                      })
                    ) : (
                      lines.map((line, li) => (
                        <p
                          key={li}
                          className={`text-sm leading-relaxed transition-colors ${
                            playingLineIdx === li ? "text-primary font-medium" :
                            isVietnamese(line.text) ? "text-muted-foreground/70 italic text-xs mt-0.5" : "text-foreground"
                          }`}
                        >
                          {line.text}
                        </p>
                      ))
                    )}
                  </div>
                )}

                {/* Prompt to reveal transcript after listening */}
                {!lessonContentHidden && !audioRevealed && !isPlayingAudio && (
                  <p className="text-xs text-center text-muted-foreground">Nghe xong rồi xem transcript để kiểm tra ✓</p>
                )}

                {!lessonContentHidden && activeLesson.key_phrases?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cụm từ quan trọng</p>
                    <div className="space-y-1.5">
                      {activeLesson.key_phrases.map((kp: { phrase: string; meaning: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary shrink-0 mt-0.5">•</span>
                          <span><strong>{kp.phrase}</strong> — <span className="text-muted-foreground">{kp.meaning}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          );
        })()}

        {/* Writing lesson */}
        {!lessonContentHidden && activeLesson.prompt && (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">✏️ Đề bài</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{activeLesson.prompt}</p></CardContent>
            </Card>
            {/* Writing structure guide */}
            {activeLesson.structure && activeLesson.structure.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">📋 Cấu trúc bài viết</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {activeLesson.structure.map((s: { part: string; guide: string }, i: number) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-primary">{s.part}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{s.guide}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {activeLesson.useful_phrases && activeLesson.useful_phrases.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">💡 Cụm từ hữu ích</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {activeLesson.useful_phrases.map((phrase: string, i: number) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1">{phrase}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Fallback for old/generic tips array */}
            {activeLesson.tips && !activeLesson.structure && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">💡 Gợi ý</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {activeLesson.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {activeLesson.example && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground">📄 Bài mẫu tham khảo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-line">{activeLesson.example}</p>
                </CardContent>
              </Card>
            )}

            {/* ── Write area ── */}
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">✍️ Bài viết của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={writingText}
                  onChange={(e) => setWritingText(e.target.value)}
                  placeholder="Viết bài của bạn ở đây. Cố gắng dùng từ vựng và cấu trúc ngữ pháp đã học..."
                  rows={8}
                  className="w-full text-sm border rounded-lg p-3 resize-y bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {writingText.trim().split(/\s+/).filter(Boolean).length} từ
                  </span>
                  <Button
                    size="sm"
                    onClick={evaluateWriting}
                    disabled={writingText.trim().length < 30 || isEvaluatingWriting}
                  >
                    {isEvaluatingWriting ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Đang chấm...</>
                    ) : (
                      "AI nhận xét bài viết →"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── AI Feedback ── */}
            {writingFeedback && (
              <Card className="border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">📊 Nhận xét của AI</CardTitle>
                    <span className={`text-xl font-bold ${writingFeedback.score >= 70 ? "text-green-600 dark:text-green-400" : writingFeedback.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {writingFeedback.score}<span className="text-sm font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{writingFeedback.feedback}</p>
                  {writingFeedback.strengths && writingFeedback.strengths.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400">✅ Điểm mạnh</p>
                      {writingFeedback.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {s}</p>
                      ))}
                    </div>
                  )}
                  {writingFeedback.improvements && writingFeedback.improvements.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">💡 Cần cải thiện</p>
                      {writingFeedback.improvements.map((imp, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {imp}</p>
                      ))}
                    </div>
                  )}
                  {writingFeedback.corrections && writingFeedback.corrections.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">✏️ Sửa lỗi cụ thể</p>
                      {writingFeedback.corrections.map((c, i) => (
                        <div key={i} className="text-xs rounded-lg bg-background border p-2.5 space-y-1">
                          <p className="line-through text-red-600 dark:text-red-400 leading-relaxed">{c.original}</p>
                          <p className="text-green-700 dark:text-green-400 leading-relaxed">→ {c.corrected}</p>
                          {c.note && <p className="text-muted-foreground italic">{c.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* B3 – Speaking lesson with mic */}
        {!lessonContentHidden && activeLesson.phrases && (() => {
          const langVoices = availableVoices.filter((v) => v.lang.startsWith(getTTSLang().slice(0, 2)));
          const voiceReady = langVoices.length === 0 || speakingVoiceURI !== "";
          return (
          <div className="space-y-3">
            {/* ── Voice picker — learner chooses the speaker before hearing the model ── */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Chọn giọng đọc mẫu
              </p>
              {langVoices.length > 0 ? (
                <>
                  <select
                    value={speakingVoiceURI}
                    onChange={(e) => setSpeakingVoiceURI(e.target.value)}
                    className="w-full text-xs rounded border bg-background px-2 py-1.5"
                  >
                    <option value="">— Chọn người nói —</option>
                    {langVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                    ))}
                  </select>
                  {!voiceReady && (
                    <p className="text-xs text-muted-foreground">
                      Hãy chọn giọng đọc trước khi nghe phát âm mẫu.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Trình duyệt chưa có giọng {activeLessonLang === "korean" ? "tiếng Hàn" : activeLessonLang === "thai" ? "tiếng Thái" : "tiếng Anh"}.
                  Máy sẽ dùng giọng mặc định — cài thêm gói giọng nói trong Cài đặt hệ thống để nghe chuẩn hơn.
                </p>
              )}
            </div>

            <SpeechRateControl
              rate={ttsRate}
              onChange={setTtsRate}
              disabled={speakingIdx !== null || micPhraseIdx !== null}
              className="rounded-lg border bg-muted/30 p-3"
            />

            <div className="grid gap-3">
              {activeLesson.phrases.map((p: any, i: number) => {
                const result = micResults[i];
                const isRecording = micPhraseIdx === i;
                const isSpeakingThis = speakingIdx === i;
                return (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-lg">{p.phrase}</p>
                          <p className="text-sm text-muted-foreground">{p.phonetic}</p>
                          {p.thai_script && (
                            <p className="text-xs text-muted-foreground/50 mt-0.5">{p.thai_script}</p>
                          )}
                          <p className="text-primary font-medium mt-1">{p.meaning}</p>
                          {p.context && <p className="text-xs text-muted-foreground/70 mt-1 italic">💬 {p.context}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => speakWord(p.thai_script || p.phrase, i)}
                            disabled={isSpeakingThis || !voiceReady}
                            className="gap-1.5"
                            title={voiceReady ? "Nghe phát âm mẫu" : "Chọn giọng đọc trước"}
                          >
                            {isSpeakingThis ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                          </Button>
                          <Button
                            size="sm"
                            variant={isRecording ? "destructive" : "outline"}
                            onClick={() => isRecording ? stopMic() : startMic(i, p.thai_script || p.phrase)}
                            className="gap-1.5"
                          >
                            {isRecording ? (
                              <><Square size={14} />Dừng</>
                            ) : (
                              <><Mic size={14} />Luyện</>
                            )}
                          </Button>
                        </div>
                      </div>
                      {isRecording && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Đang nghe — nói hết câu rồi bấm Dừng
                          </div>
                          {micInterim && (
                            <p className="text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1">
                              {micInterim}
                            </p>
                          )}
                        </div>
                      )}
                      {result && (
                        <div className="bg-muted/50 rounded-lg px-3 py-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <ScoreBadge score={result.result.score} />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(result.result.score * 100)}% khớp
                            </span>
                          </div>

                          {/* Per-word breakdown — green = chuẩn, vàng = gần đúng, đỏ = sai/thiếu */}
                          <div className="flex flex-wrap gap-1">
                            {result.result.words.map((w, wi) => (
                              <span
                                key={wi}
                                title={
                                  w.verdict === "missing"
                                    ? "Không nghe thấy từ này"
                                    : `Máy nghe thành: "${w.heard}"`
                                }
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  w.verdict === "correct"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : w.verdict === "close"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : w.verdict === "missing"
                                    ? "bg-muted text-muted-foreground line-through"
                                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                }`}
                              >
                                {w.target}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs">{result.result.summary}</p>
                          <p className="text-xs text-muted-foreground">Máy nghe được: "{result.transcript}"</p>
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
          );
        })()}

        {/* Quiz button – locked for listening until audio revealed */}
        <div className="space-y-1">
          <Button
            onClick={startQuiz}
            size="lg"
            className="w-full"
            disabled={quizLocked || !activeLesson.quiz?.length}
          >
            Làm bài kiểm tra nhanh ({activeLesson.quiz?.length ?? 0} câu) →
          </Button>
          {!activeLesson.quiz?.length && (
            <p className="text-xs text-center text-muted-foreground">
              Bài học này chưa có câu hỏi hợp lệ — quay lại và mở lại bài để tạo mới
            </p>
          )}
          {quizLocked && (
            <p className="text-xs text-center text-muted-foreground">Nghe xong bài hội thoại trước nhé</p>
          )}
          {isWritingLesson && !quizLocked && writingText.trim().length === 0 && (
            <p className="text-xs text-center text-muted-foreground">💡 Bạn chưa viết bài — hãy thử viết trước để học hiệu quả hơn</p>
          )}
        </div>
      </div>
    );
  }

  // ── List screen ───────────────────────────────────────────────
  const hasEn = !!enRoadmap;
  const hasTh = !!thRoadmap;
  const hasKr = !!krRoadmap;
  const hasAnyRoadmap = hasEn || hasTh || hasKr;
  const currentLevel = (lang === "english" ? enRoadmap : lang === "korean" ? krRoadmap : thRoadmap)?.currentLevel ?? "";
  const activeRoadmap = lang === "english" ? enRoadmap : lang === "korean" ? krRoadmap : thRoadmap;
  const roadmapSubtitle = (() => {
    if (!activeRoadmap || !currentLevel) return "";
    const exam = activeRoadmap.targetExam;
    const score = activeRoadmap.targetScore;
    // Dùng level gốc từ placement test (TOEIC/IELTS label), không quy đổi sang CEFR
    const rawLevel = activeRoadmap.placementTestLevel ?? currentLevel;
    if (exam === "TOEIC" && score) return `TOEIC · Mục tiêu ${score} · Hiện tại: ${rawLevel}`;
    if (exam === "IELTS" && score) return `IELTS · Mục tiêu ${(score / 10).toFixed(1)} · Hiện tại: ${rawLevel}`;
    return `Trình độ ${currentLevel}`;
  })();

  const lessonTypes = [
    { type: "vocabulary", label: "Từ vựng", icon: "📚", desc: "Học từ mới theo chủ đề" },
    { type: "grammar", label: "Ngữ pháp", icon: "📝", desc: "Cấu trúc và quy tắc ngữ pháp" },
    { type: "listening", label: "Nghe", icon: "🎧", desc: "Luyện nghe và hiểu" },
    { type: "reading", label: "Đọc hiểu", icon: "📖", desc: "Đọc và phân tích văn bản" },
    { type: "speaking", label: "Nói", icon: "🗣️", desc: "Luyện phát âm và nói" },
    { type: "writing", label: "Viết", icon: "✏️", desc: "Viết đoạn văn và essay" },
    { type: "conversation", label: "Giao tiếp", icon: "💬", desc: "Hội thoại AI theo tình huống" },
  ];

  const currentStreak = lang === "english" ? enStreak : lang === "korean" ? krStreak : thStreak;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài học</h1>
          {roadmapSubtitle && <p className="text-muted-foreground mt-1">{roadmapSubtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <StreakFire streak={currentStreak} />
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
          {hasKr && (
            <Button size="sm" variant={lang === "korean" ? "default" : "outline"}
              onClick={() => { setLang("korean"); setLessonState("list"); }}
              className="gap-1.5">
              <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-violet-500">KR</span>
              Tiếng Hàn
            </Button>
          )}
        </div>
      </div>

      {/* Roadmap schedule — only when user has a roadmap */}
      {hasAnyRoadmap ? (
        <CalendarView
          lessonDays={lessonDays}
          onStartLesson={(type, language, level, dayId, examType, weekTheme, weekNumber, totalWeeks) => {
            // Calculate progressive level: interpolate between currentLevel and targetLevel by week
            const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
            const roadmap = language === "english" ? enRoadmap : language === "korean" ? krRoadmap : thRoadmap;
            let progressiveLevel = level;
            if (roadmap?.targetLevel && weekNumber && totalWeeks) {
              const fromIdx = LEVEL_ORDER.indexOf(level);
              const toIdx = LEVEL_ORDER.indexOf(roadmap.targetLevel);
              if (fromIdx >= 0 && toIdx > fromIdx) {
                const progress = weekNumber / totalWeeks;
                const idx = Math.min(
                  Math.floor(fromIdx + progress * (toIdx - fromIdx + 1)),
                  toIdx
                );
                progressiveLevel = LEVEL_ORDER[idx] ?? level;
              }
            }
            openLesson(type, language, progressiveLevel, dayId, weekTheme, examType);
          }}
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
                const activeRoadmap = lang === "english" ? enRoadmap : lang === "korean" ? krRoadmap : thRoadmap;
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
