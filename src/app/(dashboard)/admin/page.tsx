"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2, RefreshCw, FileJson, BookOpen } from "lucide-react";

type Question = {
  id: string;
  exam: string;
  part: string;
  type: string;
  level: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string | null;
  source: string | null;
};

type Stat = { exam: string; type: string; _count: { id: number } };

const EXAMPLE_JSON = `[
  {
    "exam": "TOEIC",
    "part": "Part 5",
    "type": "grammar",
    "level": "B1",
    "question": "The manager asked all employees to _____ their expense reports by Friday.",
    "options": ["submit", "submits", "submitted", "submitting"],
    "answer": 0,
    "explanation": "After 'to' (infinitive marker), use base form of verb.",
    "source": "Official TOEIC 2023"
  },
  {
    "exam": "TOEIC",
    "part": "Part 5",
    "type": "vocabulary",
    "level": "B1",
    "question": "The new marketing campaign was _____ successful, exceeding all expectations.",
    "options": ["remarkably", "remark", "remarked", "remarkable"],
    "answer": 0,
    "explanation": "Adverb modifies adjective 'successful'.",
    "source": "Official TOEIC 2023"
  }
]`;

const TYPE_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe",
  writing: "Viết",
  speaking: "Nói",
};

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [jsonText, setJsonText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [filterExam, setFilterExam] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterExam !== "ALL") params.set("exam", filterExam);
      if (filterType !== "ALL") params.set("type", filterType);
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setStats(data.stats ?? []);
    } catch {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [filterExam, filterType]);

  function handleJsonChange(text: string) {
    setJsonText(text);
    setParseError("");
    setPreviewCount(null);
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(arr)) { setParseError("JSON phải là mảng []"); return; }
      setPreviewCount(arr.length);
    } catch (e: unknown) {
      setParseError(`JSON không hợp lệ: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleJsonChange(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function handleUpload() {
    if (!jsonText.trim()) return;
    setUploading(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details?.slice(0, 5).join("\n") ?? data.error;
        toast.error(`Upload thất bại:\n${details}`);
        return;
      }
      toast.success(`Đã thêm ${data.inserted} câu hỏi vào ngân hàng!`);
      setJsonText("");
      setPreviewCount(null);
      loadData();
    } catch (e: unknown) {
      toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(exam: string, type?: string) {
    const label = type ? `${exam} - ${TYPE_LABELS[type] ?? type}` : exam;
    if (!confirm(`Xóa toàn bộ câu hỏi ${label}?`)) return;
    const params = new URLSearchParams({ exam });
    if (type) params.set("type", type);
    const res = await fetch(`/api/admin/questions?${params}`, { method: "DELETE" });
    const data = await res.json();
    toast.success(`Đã xóa ${data.deleted} câu hỏi`);
    loadData();
  }

  // Group stats for display
  const toeicStats = stats.filter((s) => s.exam === "TOEIC");
  const ieltsStats = stats.filter((s) => s.exam === "IELTS");
  const totalCount = stats.reduce((sum, s) => sum + s._count.id, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Ngân hàng đề thi</h1>
        <p className="text-muted-foreground mt-1">
          Upload câu hỏi TOEIC/IELTS thực tế — AI sẽ học theo format khi tạo bài học
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Tổng câu hỏi</p>
          </CardContent>
        </Card>
        {["TOEIC", "IELTS"].map((exam) => {
          const examStats = stats.filter((s) => s.exam === exam);
          const total = examStats.reduce((sum, s) => sum + s._count.id, 0);
          return (
            <Card key={exam}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground mt-1">{exam}</p>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">
              {[...new Set(stats.map((s) => s.type))].length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Loại bài</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload"><Upload size={14} className="mr-1.5" />Upload đề</TabsTrigger>
          <TabsTrigger value="library"><BookOpen size={14} className="mr-1.5" />Thư viện câu hỏi</TabsTrigger>
        </TabsList>

        {/* ── Upload tab ── */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          {/* Format guide */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileJson size={16} />
                Format JSON chuẩn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto leading-relaxed">
                {`[
  {
    "exam": "TOEIC",          // TOEIC | IELTS
    "part": "Part 5",         // Part 5 | Part 6 | Part 7 | Listening | Writing | Speaking
    "type": "grammar",        // grammar | vocabulary | reading | listening | writing | speaking
    "level": "B1",            // A2 | B1 | B2 | C1
    "question": "The manager asked all employees to _____ their reports by Friday.",
    "options": ["submit", "submits", "submitted", "submitting"],
    "answer": 0,              // index 0-3 (0 = option A)
    "explanation": "After 'to', use base form",  // optional
    "source": "Official TOEIC 2023 Vol.1"        // optional
  }
]`}
              </pre>
            </CardContent>
          </Card>

          {/* Upload area */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} className="mr-1.5" /> Chọn file .json
                </Button>
                <span className="text-xs text-muted-foreground">hoặc paste JSON trực tiếp bên dưới</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => handleJsonChange(EXAMPLE_JSON)}
                >
                  Dùng ví dụ mẫu
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />

              <textarea
                className="w-full h-64 text-xs font-mono bg-muted/50 border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={`[\n  {\n    "exam": "TOEIC",\n    "part": "Part 5",\n    ...\n  }\n]`}
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
              />

              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}

              {previewCount !== null && !parseError && (
                <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm">
                  <span className="text-green-700">✓ {previewCount} câu hỏi hợp lệ, sẵn sàng upload</span>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {uploading ? "Đang upload..." : `Upload ${previewCount} câu →`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-exam breakdown & delete */}
          {(toeicStats.length > 0 || ieltsStats.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {[{ exam: "TOEIC", statsArr: toeicStats }, { exam: "IELTS", statsArr: ieltsStats }].map(
                ({ exam, statsArr }) =>
                  statsArr.length > 0 ? (
                    <Card key={exam}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{exam}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(exam)}
                          >
                            <Trash2 size={12} className="mr-1" /> Xóa tất cả
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {statsArr.map((s) => (
                          <div key={s.type} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{TYPE_LABELS[s.type] ?? s.type}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{s._count.id} câu</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(exam, s.type)}
                              >
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Library tab ── */}
        <TabsContent value="library" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {["ALL", "TOEIC", "IELTS"].map((e) => (
                <button
                  key={e}
                  onClick={() => setFilterExam(e)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterExam === e ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {["ALL", "grammar", "vocabulary", "reading", "listening", "writing", "speaking"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterType === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {t === "ALL" ? "Tất cả" : (TYPE_LABELS[t] ?? t)}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={loadData}>
              <RefreshCw size={14} />
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <p>Chưa có câu hỏi nào.</p>
                <p className="text-sm mt-1">Upload đề thi ở tab "Upload đề" để bắt đầu.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{questions.length} câu hỏi</p>
              {questions.map((q, i) => (
                <Card key={q.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-6 shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="secondary" className="text-xs">{q.exam}</Badge>
                          <Badge variant="outline" className="text-xs">{q.part}</Badge>
                          <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                          <Badge variant="outline" className="text-xs">{q.level}</Badge>
                          {q.source && <span className="text-xs text-muted-foreground">{q.source}</span>}
                        </div>
                        <p className="text-sm font-medium">{q.question}</p>
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {q.options.map((opt, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded ${
                                idx === q.answer
                                  ? "bg-green-100 text-green-700 font-medium"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              ({String.fromCharCode(65 + idx)}) {opt}
                            </span>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
