export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

const EXTRACTION_SYSTEM = `You are a precise TOEIC/IELTS question extractor. Extract questions from raw PDF text and return ONLY a valid JSON array.

TOEIC Reading structure:
- Part 5 (Q101-140): 40 incomplete sentences with one blank (_____)
- Part 6 (Q141-152): 4 short texts with blanks
- Part 7 (Q153-200): Longer passages with comprehension questions

Output: JSON array where each item is:
{
  "questionNumber": number,
  "part": "Part 5" | "Part 6" | "Part 7" | "Listening Part 1-4",
  "type": "grammar" | "vocabulary" | "reading" | "listening",
  "level": "A2" | "B1" | "B2" | "C1",
  "question": "sentence with blank as _____",
  "options": ["A text","B text","C text","D text"],
  "answer": 0,
  "grammarPoint": "one tag from taxonomy",
  "passage": "passage text for Part 6/7 only (omit for Part 5)",
  "explanation": "why the answer is correct"
}

GRAMMAR POINT TAXONOMY (use exactly one):
present_simple|present_continuous|present_perfect|past_simple|past_perfect|
future_will|future_going_to|passive_voice|relative_clauses|conditionals|
gerunds_infinitives|modal_verbs|articles|prepositions|comparatives_superlatives|
word_form|subject_verb_agreement|parallel_structure|
vocabulary_finance|vocabulary_hr|vocabulary_logistics|vocabulary_marketing|
vocabulary_office|vocabulary_travel|vocabulary_general_business|
reading_main_idea|reading_detail|reading_inference|reading_vocabulary_in_context|
listening_comprehension|other

CEFR LEVEL CRITERIA — rate each question individually:
- A2: Basic tenses (present/past simple), everyday common vocabulary, short sentences, predictable patterns
- B1: Perfect tenses, passive voice, common business vocabulary, moderate sentence complexity, straightforward inference
- B2: Complex clauses (relative/conditional/noun), advanced business vocabulary, nuanced meaning, multi-step inference
- C1: Inversion, cleft sentences, rare/academic vocabulary, sophisticated reasoning, abstract concepts
For TOEIC Part 5: Q101–115 tend to be A2–B1, Q116–130 B1, Q131–140 B1–B2.
For Part 6–7 and Listening Part 3–4: typically B1–B2.

RULES:
- options array: plain text only, NO "(A)" labels
- answer: 0-based index (0=A, 1=B, 2=C, 3=D); set -1 if unknown
- Part 5 type: "grammar" for verb form/structure, "vocabulary" for word choice
- level: required — assess each question independently based on grammar and vocabulary difficulty
- Return ONLY the JSON array`;

function parseAnswerKey(text: string): Record<number, number> {
  const map: Record<number, number> = {};
  const LETTER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) {
      arr.forEach((v: number, i: number) => { map[101 + i] = v; });
      return map;
    }
  } catch { /* not JSON array */ }
  // Format: "101. A" | "101: B" | "101) C"
  const re1 = /\b(\d{1,3})\s*[.:)]\s*([ABCD])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(text)) !== null) map[parseInt(m[1])] = LETTER[m[2].toUpperCase()] ?? 0;
  // Format: "1 (A)" | "2 (B)" — Korean ETS answer key style
  const re2 = /\b(\d{1,3})\s*\(([ABCD])\)/gi;
  while ((m = re2.exec(text)) !== null) map[parseInt(m[1])] = LETTER[m[2].toUpperCase()] ?? 0;
  return map;
}

const SCRIPT_INSTRUCTIONS = `
TRANSCRIPT MATCHING (script provided):
- The SCRIPT section contains full text of all audio for this test.
- TOEIC Part 3 (Q32-70): 13 conversations, 3 questions each (Q32-34, Q35-37, ..., Q68-70)
- TOEIC Part 4 (Q71-100): 10 talks, 3 questions each (Q71-73, Q74-76, ..., Q98-100)
- IELTS Listening: sections 1-4, questions numbered sequentially
- For EACH question in Part 3 or 4: set "passage" = the COMPLETE transcript of its conversation/talk
- All 3 questions sharing the same conversation/talk must have IDENTICAL "passage" text
- Part 1 (Q1-6) and Part 2 (Q7-31): no passage needed (single-line exchanges)
- Extract the passage text verbatim from the script — do NOT summarize
`;

// Accepts JSON body with extracted text — PDF parsing happens client-side
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, exam = "TOEIC", source = "Unknown", answerKey = "", scriptText = "" } =
    await req.json() as { text: string; exam?: string; source?: string; answerKey?: string; scriptText?: string };

  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const answerMap = answerKey.trim() ? parseAnswerKey(answerKey) : {};
  const hasAnswers = Object.keys(answerMap).length > 0;

  const answerSection = hasAnswers
    ? `\nANSWER KEY: ${Object.entries(answerMap).map(([q, a]) => `Q${q}=${["A","B","C","D"][a]}`).join(" ")}\n`
    : "\nNo answer key — set answer to -1.\n";

  const scriptSection = scriptText.trim()
    ? `\n${SCRIPT_INSTRUCTIONS}\n--- SCRIPT START ---\n${scriptText.slice(0, 30000)}\n--- SCRIPT END ---\n`
    : "";

  const userPrompt = `Extract all ${exam} questions from this text. Source: "${source}"
${answerSection}${scriptSection}
--- TEXT START ---
${text.slice(0, 50000)}
--- TEXT END ---

Return a JSON array of all questions found.`;

  if (!process.env.GROQ_API_KEY)
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let questions: unknown[];
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.data ?? []);
  } catch (e) {
    return NextResponse.json({ error: `AI extraction failed: ${e}` }, { status: 500 });
  }

  type RawQ = Record<string, unknown>;
  const normalized = (questions as RawQ[])
    .filter((q) => q.question && Array.isArray(q.options) && (q.options as unknown[]).length === 4)
    .map((q) => ({
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
    unanswered: normalized.filter((q) => q.answer === -1).length,
    questions: normalized,
  });
}
