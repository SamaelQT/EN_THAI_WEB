"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Volume2, Trash2, BookOpen, RotateCcw } from "lucide-react";
import { useTtsRate } from "@/lib/tts";
import SpeechRateControl from "@/components/SpeechRateControl";

type VocabItem = {
  id: string;
  language: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  exampleVi: string | null;
  repetitions: number;
  intervalDay: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
};

type Stats = { total: number; due: number; learning: number; young: number; mature: number };

const LANGS = [
  { id: "english", label: "Tiếng Anh", badge: "EN", color: "bg-blue-500" },
  { id: "thai", label: "Tiếng Thái", badge: "TH", color: "bg-red-500" },
  { id: "korean", label: "Tiếng Hàn", badge: "KR", color: "bg-violet-500" },
];

/** Anki-style buttons mapped onto SM-2 grades. */
const GRADES = [
  { grade: 1, label: "Quên rồi", hint: "Xem lại hôm nay", cls: "bg-red-500 hover:bg-red-600" },
  { grade: 3, label: "Khó", hint: "Nhớ nhưng chật vật", cls: "bg-amber-500 hover:bg-amber-600" },
  { grade: 4, label: "Được", hint: "Nhớ bình thường", cls: "bg-emerald-500 hover:bg-emerald-600" },
  { grade: 5, label: "Dễ", hint: "Nhớ ngay lập tức", cls: "bg-sky-500 hover:bg-sky-600" },
] as const;

function ttsLangOf(language: string) {
  return language === "thai" ? "th-TH" : language === "korean" ? "ko-KR" : "en-US";
}

export default function VocabularyClient({ defaultLang }: { defaultLang: string }) {
  const [lang, setLang] = useState(defaultLang);
  // Shared with the lesson screens, so a learner sets their speed once
  const [ttsRate, setTtsRate] = useTtsRate();
  const [tab, setTab] = useState<"review" | "all">("review");
  const [items, setItems] = useState<VocabItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, due: 0, learning: 0, young: 0, mature: 0 });
  const [loading, setLoading] = useState(true);

  // Review session state
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  const load = useCallback(async (filter: "due" | "all") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vocabulary?language=${lang}&filter=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats);
      if (filter === "due") {
        setQueue(data.items);
        setCursor(0);
        setRevealed(false);
      } else {
        setItems(data.items);
      }
    } catch {
      toast.error("Không tải được sổ từ vựng");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    setSessionDone(0);
    load(tab === "review" ? "due" : "all");
  }, [lang, tab, load]);

  function speak(word: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    const target = ttsLangOf(lang);
    utt.lang = target;
    utt.rate = ttsRate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(target.slice(0, 2)));
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  }

  async function grade(g: number) {
    const item = queue[cursor];
    if (!item) return;
    setGrading(true);
    try {
      const res = await fetch(`/api/vocabulary/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: g }),
      });
      if (!res.ok) throw new Error();
      setSessionDone((n) => n + 1);
      setRevealed(false);
      setCursor((c) => c + 1);
    } catch {
      toast.error("Không lưu được kết quả ôn tập");
    } finally {
      setGrading(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
      toast.success("Đã xóa từ");
    } catch {
      toast.error("Không xóa được");
    }
  }

  const current = queue[cursor];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sổ từ vựng</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ôn theo lịch lặp ngắt quãng — từ nào hay quên sẽ quay lại sớm hơn
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {LANGS.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={lang === l.id ? "default" : "outline"}
              onClick={() => setLang(l.id)}
              className="gap-1.5"
            >
              <span className={`text-[10px] font-bold text-white px-1 py-0.5 rounded ${l.color}`}>{l.badge}</span>
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          ["Tổng số từ", stats.total, "text-foreground"],
          ["Đến hạn ôn", stats.due, "text-orange-500"],
          ["Đang học", stats.learning, "text-blue-500"],
          ["Đã thuộc sơ", stats.young, "text-emerald-500"],
          ["Nhớ lâu", stats.mature, "text-violet-500"],
        ] as [string, number, string][]).map(([label, value, cls]) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {([["review", `Ôn hôm nay${stats.due > 0 ? ` (${stats.due})` : ""}`], ["all", "Tất cả từ"]] as [typeof tab, string][]).map(
          ([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === id ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <SpeechRateControl
        rate={ttsRate}
        onChange={setTtsRate}
        className="rounded-lg border bg-muted/30 p-3 max-w-sm"
      />

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-primary" size={32} /></div>
      ) : tab === "review" ? (
        queue.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Hôm nay không có từ nào đến hạn ôn.</p>
              <p className="text-xs mt-1">
                {stats.total === 0
                  ? "Học một bài từ vựng rồi nhấn \"Lưu vào sổ từ\" để bắt đầu."
                  : "Quay lại vào ngày mai — lịch ôn được tính tự động."}
              </p>
            </CardContent>
          </Card>
        ) : !current ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <div>
                <p className="font-bold text-lg">Xong phiên ôn hôm nay!</p>
                <p className="text-sm text-muted-foreground mt-1">Bạn đã ôn {sessionDone} từ.</p>
              </div>
              <Button variant="outline" onClick={() => load("due")} className="gap-2">
                <RotateCcw size={15} /> Kiểm tra lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{cursor + 1} / {queue.length}</span>
              {current.lapses > 0 && (
                <Badge variant="outline" className="text-xs">Đã quên {current.lapses} lần</Badge>
              )}
            </div>
            <Progress value={(cursor / queue.length) * 100} className="h-1.5" />

            <Card className="min-h-[220px]">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-3xl font-bold">{current.word}</p>
                  <button
                    onClick={() => speak(current.word)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Phát âm ${current.word}`}
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                {current.phonetic && <p className="text-sm text-muted-foreground">{current.phonetic}</p>}

                {revealed ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-lg text-primary font-medium">{current.meaning}</p>
                    {current.example && (
                      <div className="text-sm">
                        <p className="italic">"{current.example}"</p>
                        {current.exampleVi && (
                          <p className="text-xs text-muted-foreground mt-0.5">→ {current.exampleVi}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-4">Nhớ nghĩa của từ này chưa?</p>
                )}
              </CardContent>
            </Card>

            {!revealed ? (
              <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
                Hiện đáp án
              </Button>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g.grade}
                    disabled={grading}
                    onClick={() => grade(g.grade)}
                    className={`rounded-lg px-3 py-3 text-white text-sm font-semibold transition-colors disabled:opacity-50 ${g.cls}`}
                  >
                    {g.label}
                    <span className="block text-[10px] font-normal opacity-80 mt-0.5">{g.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sổ từ vựng đang trống.</p>
            <p className="text-xs mt-1">Mở một bài từ vựng và nhấn "Lưu vào sổ từ".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {items.map((it) => {
            const due = new Date(it.dueAt);
            const isDue = due <= new Date();
            return (
              <Card key={it.id}>
                <CardContent className="pt-3 pb-3 flex items-start gap-3">
                  <button
                    onClick={() => speak(it.word)}
                    className="text-muted-foreground hover:text-primary shrink-0 mt-1"
                    aria-label={`Phát âm ${it.word}`}
                  >
                    <Volume2 size={15} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{it.word}</p>
                    {it.phonetic && <p className="text-xs text-muted-foreground">{it.phonetic}</p>}
                    <p className="text-sm text-primary">{it.meaning}</p>
                    {it.example && <p className="text-xs text-muted-foreground italic mt-0.5">"{it.example}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${isDue ? "border-orange-400 text-orange-600" : ""}`}>
                      {isDue ? "Đến hạn" : due.toLocaleDateString("vi-VN")}
                    </Badge>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label={`Xóa ${it.word}`}
                    >
                      <Trash2 size={14} />
                    </button>
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
