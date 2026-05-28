"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2, RefreshCw, FileJson, BookOpen, FileText, CheckCircle, AlertCircle, FileUp } from "lucide-react";

type Question = {
  id: string; exam: string; part: string; type: string; level: string;
  question: string; options: string[]; answer: number;
  explanation: string | null; source: string | null; grammarPoint: string | null;
};
type ParsedQuestion = Omit<Question, "id"> & { questionNumber: number | null; passage: string | null };
type Stat = { exam: string; type: string; _count: { id: number } };

const TYPE_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp", vocabulary: "Từ vựng", reading: "Đọc hiểu",
  listening: "Nghe", writing: "Viết", speaking: "Nói",
};

const EXAMPLE_JSON = `[
  {
    "exam": "TOEIC", "part": "Part 5", "type": "grammar", "level": "B1",
    "question": "The manager asked all employees to _____ their reports by Friday.",
    "options": ["submit", "submits", "submitted", "submitting"],
    "answer": 0, "explanation": "After 'to', use base form.", "source": "ETS TOEIC 2024 Test 1"
  }
]`;

// ── Stats overview ─────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stat[] }) {
  const total = stats.reduce((s, r) => s + r._count.id, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground mt-1">Tổng câu hỏi</p></CardContent></Card>
      {["TOEIC", "IELTS"].map((exam) => {
        const n = stats.filter((s) => s.exam === exam).reduce((a, s) => a + s._count.id, 0);
        return <Card key={exam}><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-muted-foreground mt-1">{exam}</p></CardContent></Card>;
      })}
      <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{[...new Set(stats.map((s) => s.type))].length}</p><p className="text-xs text-muted-foreground mt-1">Loại bài</p></CardContent></Card>
    </div>
  );
}

// ── PDF Parse tab ──────────────────────────────────────────────────────────

/** Extract text from PDF using pdfjs-dist in the browser (no server-side parsing) */
async function extractPDFText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }
  return pages.join("\n");
}

/** Extract the TEST N section from a multi-test answer key PDF text */
function extractTestSection(text: string, testNum: number): string {
  const curr = new RegExp(`TEST\\s*${testNum}\\b[\\s\\S]*?(?=\\bTEST\\s*${testNum + 1}\\b|$)`, "i");
  const match = text.match(curr);
  return match ? match[0] : text;
}

function ParsePDFTab({ onSaved }: { onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const answerKeyFileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [exam, setExam] = useState("TOEIC");
  const [source, setSource] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerTestNum, setAnswerTestNum] = useState(1);
  const [extractingAnswerKey, setExtractingAnswerKey] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ extracted: number; unanswered: number; questions: ParsedQuestion[] } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "extracting" | "ai" | "done">("idle");

  async function handleAnswerKeyPDF(f: File, testNum: number) {
    setAnswerKeyFile(f);
    setExtractingAnswerKey(true);
    try {
      const text = await extractPDFText(f);
      const section = extractTestSection(text, testNum);
      setAnswerKey(section || text);
    } catch {
      toast.error("Không đọc được PDF đáp án");
    } finally {
      setExtractingAnswerKey(false);
    }
  }

  async function handleParse() {
    if (!file) { toast.error("Chọn file PDF trước"); return; }
    setResult(null);
    try {
      // Step 1: extract text client-side
      setStep("extracting");
      setExtracting(true);
      const text = await extractPDFText(file);
      setExtracting(false);

      if (!text.trim()) throw new Error("Không thể đọc text từ PDF này");

      // Step 2: send text to AI
      setStep("ai");
      setParsing(true);
      const res = await fetch("/api/admin/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, exam, source: source || file.name, answerKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep("done");
      toast.success(`Trích xuất được ${data.extracted} câu hỏi`);
    } catch (e: unknown) {
      toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
      setStep("idle");
    } finally {
      setExtracting(false);
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.questions),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details?.slice(0, 3).join("\n") ?? data.error;
        toast.error(`Lỗi:\n${details}`);
        return;
      }
      toast.success(`Đã lưu ${data.inserted} câu hỏi vào ngân hàng!`);
      setResult(null);
      setFile(null);
      setAnswerKey("");
      onSaved();
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  const unansweredPct = result ? Math.round((result.unanswered / result.extracted) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Guide */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-medium mb-2">Workflow</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="bg-muted px-2 py-1 rounded">1. Upload PDF</span>
            <span>→</span>
            <span className="bg-muted px-2 py-1 rounded">2. Paste đáp án (tùy chọn)</span>
            <span>→</span>
            <span className="bg-muted px-2 py-1 rounded">3. AI trích xuất câu hỏi</span>
            <span>→</span>
            <span className="bg-muted px-2 py-1 rounded">4. Review & lưu vào DB</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Nếu không có đáp án → AI đặt answer=-1. Có thể upload lại sau khi có file đáp án PDF. File đáp án nhiều test → chọn "Test số" để lấy đúng phần.
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Loại đề</label>
              <select value={exam} onChange={(e) => setExam(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background">
                <option value="TOEIC">TOEIC</option>
                <option value="IELTS">IELTS</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nguồn (tùy chọn)</label>
              <input type="text" placeholder="ETS TOEIC 2024 Test 1" value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background" />
            </div>
          </div>

          {/* File upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-border hover:border-primary/50"}`}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStep("idle"); setResult(null); }} />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click để chọn file PDF</p>
                <p className="text-xs mt-1">ETS 2024 Reading hoặc Listening (không cần chia trình độ)</p>
              </div>
            )}
          </div>

          {/* Answer key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium">
                Đáp án <span className="text-muted-foreground font-normal">(tùy chọn)</span>
              </label>
              <div className="flex items-center gap-2">
                {answerKeyFile && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground">Test số</label>
                    <input
                      type="number" min={1} max={10} value={answerTestNum}
                      onChange={(e) => {
                        const n = parseInt(e.target.value) || 1;
                        setAnswerTestNum(n);
                        if (answerKeyFile) handleAnswerKeyPDF(answerKeyFile, n);
                      }}
                      className="w-12 text-xs border rounded px-1.5 py-0.5 bg-background text-center"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => answerKeyFileRef.current?.click()}
                  disabled={extractingAnswerKey}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <FileUp size={12} />
                  {extractingAnswerKey ? "Đang đọc..." : answerKeyFile ? answerKeyFile.name : "Upload PDF đáp án"}
                </button>
                <input ref={answerKeyFileRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAnswerKeyPDF(f, answerTestNum);
                  }}
                />
              </div>
            </div>
            <textarea
              className="w-full h-20 text-xs font-mono bg-muted/50 border rounded-lg p-3 resize-none"
              placeholder={"Format 1 — text: 101. A  102. C  hoặc  1 (A)  2 (B)  3 (C)...\nFormat 2 — JSON: [0, 2, 1, 3, ...] (0=A, 1=B, 2=C, 3=D)"}
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
            />
          </div>

          {/* Step indicator */}
          {(extracting || parsing || extractingAnswerKey) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
              <span className="animate-spin text-lg">⏳</span>
              {extractingAnswerKey ? "Đọc PDF đáp án..." : step === "extracting" ? "Đọc text từ PDF đề thi..." : "AI đang phân tích và cấu trúc câu hỏi..."}
            </div>
          )}

          <Button onClick={handleParse} disabled={extracting || parsing || !file} className="w-full">
            <FileText size={16} className="mr-2" /> Trích xuất câu hỏi từ PDF
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-green-200">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle size={16} /> {result.extracted} câu hỏi
                </span>
                {result.unanswered > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle size={16} /> {result.unanswered} chưa có đáp án ({unansweredPct}%)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setReviewOpen(!reviewOpen)}>
                  {reviewOpen ? "Ẩn preview" : "Xem câu hỏi"}
                </Button>
                <Button size="sm" disabled={saving} onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white">
                  {saving ? "Đang lưu..." : `Lưu ${result.extracted} câu →`}
                </Button>
              </div>
            </div>

            {/* Breakdown by type */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(
                result.questions.reduce((acc: Record<string, number>, q) => {
                  acc[q.type] = (acc[q.type] ?? 0) + 1; return acc;
                }, {})
              ).map(([type, count]) => (
                <Badge key={type} variant="secondary">{TYPE_LABELS[type] ?? type}: {count}</Badge>
              ))}
            </div>

            {/* Preview */}
            {reviewOpen && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {result.questions.slice(0, 20).map((q, i) => (
                  <div key={i} className="border rounded-lg p-3 text-xs space-y-1">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{q.part}</Badge>
                      <Badge variant="outline">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                      {q.grammarPoint && <Badge variant="outline" className="text-blue-600">{q.grammarPoint}</Badge>}
                      {q.answer === -1 && <Badge variant="outline" className="text-amber-600">No answer</Badge>}
                    </div>
                    <p className="font-medium">{q.question}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {q.options.map((opt, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded ${idx === q.answer ? "bg-green-100 text-green-700 font-medium" : "bg-muted text-muted-foreground"}`}>
                          ({String.fromCharCode(65 + idx)}) {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {result.questions.length > 20 && (
                  <p className="text-xs text-center text-muted-foreground">... và {result.questions.length - 20} câu nữa</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── JSON Upload tab ────────────────────────────────────────────────────────

function JSONUploadTab({ stats, onSaved }: { stats: Stat[]; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  function handleJsonChange(text: string) {
    setJsonText(text); setParseError(""); setPreviewCount(null);
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(arr)) { setParseError("JSON phải là mảng []"); return; }
      setPreviewCount(arr.length);
    } catch (e: unknown) { setParseError(`JSON không hợp lệ: ${e instanceof Error ? e.message : String(e)}`); }
  }

  async function handleUpload() {
    if (!jsonText.trim()) return;
    setUploading(true);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch("/api/admin/questions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(`Upload thất bại:\n${data.details?.slice(0,5).join("\n") ?? data.error}`); return; }
      toast.success(`Đã thêm ${data.inserted} câu hỏi!`);
      setJsonText(""); setPreviewCount(null); onSaved();
    } catch (e: unknown) { toast.error(String(e)); } finally { setUploading(false); }
  }

  const toeicStats = stats.filter((s) => s.exam === "TOEIC");
  const ieltsStats = stats.filter((s) => s.exam === "IELTS");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileJson size={16} />Format JSON</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">{`[\n  {\n    "exam": "TOEIC",    // TOEIC | IELTS\n    "part": "Part 5",   // Part 5 | Part 6 | Part 7 | Listening Part 3...\n    "type": "grammar",  // grammar | vocabulary | reading | listening\n    "level": "B1",      // A2 | B1 | B2 | C1\n    "question": "...",  // blank = _____\n    "options": ["A","B","C","D"],\n    "answer": 0,        // 0-3 index\n    "grammarPoint": "passive_voice",  // optional, for quiz matching\n    "explanation": "...",  // optional\n    "source": "ETS TOEIC 2024 Test 1"\n  }\n]`}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={14} className="mr-1.5" />Chọn file .json</Button>
            <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => handleJsonChange(EXAMPLE_JSON)}>Dùng ví dụ mẫu</Button>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => handleJsonChange(ev.target?.result as string ?? ""); r.readAsText(f); }} />
          <textarea className="w-full h-48 text-xs font-mono bg-muted/50 border rounded-lg p-3 resize-none"
            placeholder='[{"exam":"TOEIC","part":"Part 5",...}]' value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)} />
          {parseError && <p className="text-xs text-destructive">{parseError}</p>}
          {previewCount !== null && !parseError && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm">
              <span className="text-green-700">✓ {previewCount} câu hỏi hợp lệ</span>
              <Button size="sm" onClick={handleUpload} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white">
                {uploading ? "Đang upload..." : `Upload ${previewCount} câu →`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(toeicStats.length > 0 || ieltsStats.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {[{ exam: "TOEIC", arr: toeicStats }, { exam: "IELTS", arr: ieltsStats }].map(({ exam, arr }) =>
            arr.length > 0 ? (
              <Card key={exam}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{exam}</CardTitle>
                    <button onClick={async () => { if (!confirm(`Xóa toàn bộ ${exam}?`)) return; const r = await fetch(`/api/admin/questions?exam=${exam}`, { method: "DELETE" }); const d = await r.json(); toast.success(`Đã xóa ${d.deleted} câu`); onSaved(); }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <Trash2 size={11} /> Xóa tất cả
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {arr.map((s) => (
                    <div key={s.type} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{TYPE_LABELS[s.type] ?? s.type}</span>
                      <Badge variant="secondary">{s._count.id} câu</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

// ── Library tab ────────────────────────────────────────────────────────────

function LibraryTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterExam !== "ALL") p.set("exam", filterExam);
    if (filterType !== "ALL") p.set("type", filterType);
    const res = await fetch(`/api/admin/questions?${p}`);
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterExam, filterType]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {["ALL", "TOEIC", "IELTS"].map((e) => (
            <button key={e} onClick={() => setFilterExam(e)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterExam === e ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "grammar", "vocabulary", "reading", "listening"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
              {t === "ALL" ? "Tất cả" : (TYPE_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={load}><RefreshCw size={14} /></Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> :
        questions.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground"><p>Chưa có câu hỏi nào.</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{questions.length} câu hỏi</p>
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1.5 flex-wrap mb-1.5">
                        <Badge variant="secondary" className="text-xs">{q.exam}</Badge>
                        <Badge variant="outline" className="text-xs">{q.part}</Badge>
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                        {q.grammarPoint && <Badge variant="outline" className="text-xs text-blue-600">{q.grammarPoint}</Badge>}
                        {q.source && <span className="text-xs text-muted-foreground">{q.source}</span>}
                      </div>
                      <p className="text-sm">{q.question}</p>
                      <div className="grid grid-cols-2 gap-1 mt-1.5">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className={`text-xs px-2 py-0.5 rounded ${idx === q.answer ? "bg-green-100 text-green-700 font-medium" : "bg-muted text-muted-foreground"}`}>
                            ({String.fromCharCode(65 + idx)}) {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<Stat[]>([]);

  async function loadStats() {
    const res = await fetch("/api/admin/questions");
    const data = await res.json();
    setStats(data.stats ?? []);
  }

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Ngân hàng đề thi</h1>
        <p className="text-muted-foreground mt-1">Upload đề TOEIC/IELTS thật — AI sẽ dùng làm quiz khi đủ câu</p>
      </div>

      <StatsBar stats={stats} />

      <Tabs defaultValue="pdf">
        <TabsList>
          <TabsTrigger value="pdf"><FileText size={14} className="mr-1.5" />Parse PDF</TabsTrigger>
          <TabsTrigger value="json"><FileJson size={14} className="mr-1.5" />Upload JSON</TabsTrigger>
          <TabsTrigger value="library"><BookOpen size={14} className="mr-1.5" />Thư viện</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="mt-4">
          <ParsePDFTab onSaved={loadStats} />
        </TabsContent>

        <TabsContent value="json" className="mt-4">
          <JSONUploadTab stats={stats} onSaved={loadStats} />
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
