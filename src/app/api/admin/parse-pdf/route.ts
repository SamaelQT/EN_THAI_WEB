export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 min for large multi-chunk PDFs

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

export const GRAMMAR_TAXONOMY = [
  "present_simple", "present_continuous", "present_perfect", "present_perfect_continuous",
  "past_simple", "past_continuous", "past_perfect", "past_perfect_continuous",
  "future_will", "future_going_to", "future_perfect", "future_continuous",
  "passive_voice", "relative_clauses", "conditionals", "reported_speech",
  "gerunds_infinitives", "modal_verbs", "articles", "prepositions",
  "comparatives_superlatives", "conjunctions", "noun_clauses", "word_form",
  "subject_verb_agreement", "pronouns", "parallel_structure",
  "vocabulary_finance", "vocabulary_hr", "vocabulary_logistics",
  "vocabulary_marketing", "vocabulary_office", "vocabulary_travel",
  "vocabulary_general_business",
  "reading_main_idea", "reading_detail", "reading_inference",
  "reading_vocabulary_in_context", "listening_comprehension", "other",
] as const;

// llama-3.3-70b-versatile: 12 000 TPM (double the 6 000 TPM of 8b-instant)
const EXTRACTION_MODEL = "llama-3.3-70b-versatile";
// Each chunk: ~4 000 chars ≈ 1 000 tokens input + 600 system + 1 500 response ≈ 3 100 tokens
// Base delay between chunks; 429 handler will override with retry-after value
const CHUNK_SIZE = 4_000;
const CHUNK_BASE_DELAY_MS = 5_000; // short — actual wait comes from retry-after if needed

const EXTRACTION_SYSTEM = `You are a precise TOEIC/IELTS question extractor. Extract questions from raw PDF text and return ONLY a valid JSON array.

TOEIC structure:
- Part 5 (Q101-140): incomplete sentences with one blank (_____) — grammar/vocabulary
- Part 6 (Q141-152): short texts with blanks
- Part 7 (Q153-200): passages + comprehension questions
- Listening Part 1 (Q1-6): photo descriptions
- Listening Part 2 (Q7-31): short Q&A
- Listening Part 3 (Q32-70): conversations + questions
- Listening Part 4 (Q71-100): talks + questions

Output JSON array, each item:
{
  "questionNumber": number,
  "part": "Part 5"|"Part 6"|"Part 7"|"Listening Part 1"|"Listening Part 2"|"Listening Part 3"|"Listening Part 4",
  "type": "grammar"|"vocabulary"|"reading"|"listening",
  "level": "A2"|"B1"|"B2"|"C1",
  "question": "text with blank as _____",
  "options": ["A text","B text","C text","D text"],
  "answer": 0,
  "grammarPoint": "taxonomy tag",
  "passage": "passage for Part 6/7 or transcript for Part 3/4 — omit for Part 5",
  "explanation": "why correct"
}

GRAMMAR TAXONOMY: present_simple|present_continuous|present_perfect|past_simple|past_perfect|future_will|future_going_to|passive_voice|relative_clauses|conditionals|gerunds_infinitives|modal_verbs|articles|prepositions|comparatives_superlatives|word_form|subject_verb_agreement|parallel_structure|vocabulary_finance|vocabulary_hr|vocabulary_logistics|vocabulary_marketing|vocabulary_office|vocabulary_travel|vocabulary_general_business|reading_main_idea|reading_detail|reading_inference|reading_vocabulary_in_context|listening_comprehension|other

CEFR LEVEL:
- A2: simple present/past, everyday vocabulary, short sentences
- B1: perfect tenses, passive voice, common business vocabulary
- B2: complex clauses, advanced business vocabulary, multi-step inference
- C1: inversion, cleft sentences, academic vocabulary

RULES:
- options: plain text only, NO "(A)" labels
- answer: 0-based index; -1 if unknown
- Part 5 type: "grammar" for structure, "vocabulary" for word choice
- Return ONLY the JSON array`;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Extract the TEST N section from a multi-test PDF text */
function extractTestSection(text: string, testNum: number): string {
  const re = new RegExp(`TEST\\s*0*${testNum}\\b[\\s\\S]*?(?=\\bTEST\\s*0*${testNum + 1}\\b|$)`, "i");
  const match = text.match(re);
  return match ? match[0] : "";
}

/** Call Groq, auto-retry once on 429 using the retry-after header */
async function groqWithRetry(
  groq: Groq,
  messages: { role: "system" | "user"; content: string }[],
): Promise<string> {
  const call = () => groq.chat.completions.create({
    model: EXTRACTION_MODEL,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  try {
    const res = await call();
    return res.choices[0]?.message?.content ?? "{}";
  } catch (e: unknown) {
    // On 429, read retry-after and wait then retry once
    const status = (e as { status?: number })?.status;
    if (status === 429) {
      const retryAfter = (() => {
        try {
          const headers = (e as { headers?: Headers })?.headers;
          const val = headers?.get("retry-after");
          return val ? (parseInt(val) + 3) * 1000 : 65_000;
        } catch { return 65_000; }
      })();
      console.log(`Rate limited — waiting ${retryAfter / 1000}s`);
      await sleep(retryAfter);
      const res = await call();
      return res.choices[0]?.message?.content ?? "{}";
    }
    throw e;
  }
}

function parseAnswerKey(text: string): Record<number, number> {
  const map: Record<number, number> = {};
  const LETTER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) { arr.forEach((v: number, i: number) => { map[101 + i] = v; }); return map; }
  } catch { /* not JSON */ }
  // Format: "101. A" | "101: B" | "101) C"
  const re1 = /\b(\d{1,3})\s*[.:)]\s*([ABCD])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text)) !== null) map[parseInt(m[1])] = LETTER[m[2].toUpperCase()] ?? 0;
  // Format: "1 (A)" | "2 (B)" — Korean ETS style
  const re2 = /\b(\d{1,3})\s*\(([ABCD])\)/gi;
  while ((m = re2.exec(text)) !== null) map[parseInt(m[1])] = LETTER[m[2].toUpperCase()] ?? 0;
  // Format: "32 D 33 B" — space only, no punctuation (OCR table export)
  const re3 = /\b(\d{1,3})\s+([ABCD])\b/gi;
  while ((m = re3.exec(text)) !== null) {
    const n = parseInt(m[1]);
    if (map[n] === undefined) map[n] = LETTER[m[2].toUpperCase()] ?? 0;
  }
  // Format: "B 32 D 33" — letter BEFORE number (some OCR column layouts)
  const re4 = /\b([ABCD])\s+(\d{1,3})\b/gi;
  while ((m = re4.exec(text)) !== null) {
    const n = parseInt(m[2]);
    if (map[n] === undefined) map[n] = LETTER[m[1].toUpperCase()] ?? 0;
  }
  return map;
}

type RawQ = Record<string, unknown>;

async function extractChunk(
  groq: Groq, chunk: string, exam: string, source: string, answerSection: string
): Promise<RawQ[]> {
  const raw = await groqWithRetry(groq, [
    { role: "system", content: EXTRACTION_SYSTEM },
    { role: "user", content: `Extract all ${exam} questions from this text chunk. Source: "${source}"\n${answerSection}\n--- TEXT ---\n${chunk}\n--- END ---\n\nReturn JSON array.` },
  ]);
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.data ?? []);
  return arr as RawQ[];
}

async function matchTranscripts(
  groq: Groq, questions: RawQ[], scriptText: string
): Promise<RawQ[]> {
  // Only process Part 3/4 that don't yet have a passage
  const needsPassage = questions.filter(q =>
    (String(q.part).includes("Part 3") || String(q.part).includes("Part 4")) && !q.passage
  );
  if (needsPassage.length === 0) return questions;

  const qList = needsPassage
    .map(q => `Q${q.questionNumber}(${q.part})`)
    .join(", ");

  const prompt = `Match TOEIC Listening transcripts to question groups.

TOEIC Part 3 (Q32-70): 13 conversations, 3 questions each → Q32-34, Q35-37, ..., Q68-70
TOEIC Part 4 (Q71-100): 10 talks, 3 questions each → Q71-73, Q74-76, ..., Q98-100

QUESTIONS NEEDING TRANSCRIPT: ${qList}

--- SCRIPT ---
${scriptText.slice(0, 15000)}
--- END ---

Return JSON: {"matches":[{"questionNumbers":[32,33,34],"passage":"full conversation text"},...]
- passage = COMPLETE verbatim transcript of the conversation/talk
- All questions in same group share identical passage`;

  const raw = await groqWithRetry(groq, [{ role: "user", content: prompt }]);
  const { matches = [] } = JSON.parse(raw) as { matches: { questionNumbers: number[]; passage: string }[] };

  const passageMap = new Map<number, string>();
  for (const m of matches) {
    for (const n of (m.questionNumbers ?? [])) {
      passageMap.set(n, m.passage ?? "");
    }
  }

  return questions.map(q => ({
    ...q,
    passage: passageMap.get(q.questionNumber as number) ?? q.passage ?? null,
  }));
}

// Accepts JSON body with extracted text — PDF parsing happens client-side
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, exam = "TOEIC", source = "Unknown", answerKey = "", scriptText = "", testNum } =
    await req.json() as { text: string; exam?: string; source?: string; answerKey?: string; scriptText?: string; testNum?: number };

  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (!process.env.GROQ_API_KEY)
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  // If testNum given, slice question text to just that test's section
  const questionText = testNum ? extractTestSection(text, testNum) || text : text;
  const answerMap = answerKey.trim() ? parseAnswerKey(answerKey) : {};
  const hasAnswers = Object.keys(answerMap).length > 0;
  const answerSection = hasAnswers
    ? `ANSWER KEY: ${Object.entries(answerMap).map(([q, a]) => `Q${q}=${["A","B","C","D"][a]}`).join(" ")}`
    : "No answer key — set answer to -1.";

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // ── Single-shot if text is small enough; otherwise chunk ─────────────────
  // Single-shot: ≤ 10 000 chars ≈ 2 500 tokens input + overhead < 12 000 TPM
  // This avoids multi-chunk delays for typical single-test TXT files (~14 KB)
  const SINGLE_SHOT_LIMIT = 10_000;
  const OVERLAP = 400;

  let allRaw: RawQ[] = [];

  if (questionText.length <= SINGLE_SHOT_LIMIT) {
    // Small file → one request, no delays
    try {
      const results = await extractChunk(groq, questionText, exam, source, answerSection);
      allRaw = results;
    } catch (e) {
      console.error("Single-shot extraction failed:", e);
    }
  } else {
    // Large file → chunk with overlap
    const chunks: string[] = [];
    for (let i = 0; i < questionText.length; i += CHUNK_SIZE - OVERLAP) {
      chunks.push(questionText.slice(i, i + CHUNK_SIZE));
      if (i + CHUNK_SIZE >= questionText.length) break;
    }
    const chunksToProcess = chunks.slice(0, 6);

    for (let i = 0; i < chunksToProcess.length; i++) {
      if (i > 0) await sleep(CHUNK_BASE_DELAY_MS);
      try {
        const results = await extractChunk(groq, chunksToProcess[i], exam, source, answerSection);
        allRaw = allRaw.concat(results);
      } catch (e) {
        console.error(`Chunk ${i + 1} failed:`, e);
      }
    }
  }

  // ── Dedup by questionNumber ───────────────────────────────────────────────
  const seen = new Set<number>();
  allRaw = allRaw.filter(q => {
    const n = q.questionNumber as number;
    if (!n) return true; // keep if no number
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });

  // ── Match transcripts (script pass) ──────────────────────────────────────
  if (scriptText.trim()) {
    await sleep(CHUNK_BASE_DELAY_MS);
    try {
      allRaw = await matchTranscripts(groq, allRaw, scriptText);
    } catch (e) {
      console.error("Script matching failed:", e);
    }
  }

  // ── Apply answer key overrides ────────────────────────────────────────────
  if (hasAnswers) {
    allRaw = allRaw.map(q => {
      const n = q.questionNumber as number;
      if (n && answerMap[n] !== undefined) return { ...q, answer: answerMap[n] };
      return q;
    });
  }

  // ── Normalize ─────────────────────────────────────────────────────────────
  const normalized = allRaw
    .filter(q => q.question && Array.isArray(q.options) && (q.options as unknown[]).length === 4)
    .map(q => ({
      exam,
      part: String(q.part ?? "Part 5"),
      type: String(q.type ?? "grammar"),
      level: (["A2", "B1", "B2", "C1"].includes(String(q.level)) ? String(q.level) : (exam === "IELTS" ? "B2" : "B1")),
      question: String(q.question),
      options: (q.options as string[]).map(String),
      answer: typeof q.answer === "number" && q.answer >= 0 ? q.answer : -1,
      explanation: q.explanation ? String(q.explanation) : null,
      source,
      grammarPoint: q.grammarPoint ? String(q.grammarPoint) : null,
      tags: [] as string[],
      passage: q.passage ? String(q.passage) : null,
      questionNumber: typeof q.questionNumber === "number" ? q.questionNumber : null,
    }));

  return NextResponse.json({
    extracted: normalized.length,
    unanswered: normalized.filter(q => q.answer === -1).length,
    questions: normalized,
  });
}
