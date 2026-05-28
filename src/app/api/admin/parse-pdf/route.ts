export const dynamic = "force-dynamic";
export const maxDuration = 60; // PDF parsing + AI can take a while

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

// Standardized grammar point taxonomy used across lesson generation AND PDF extraction
export const GRAMMAR_TAXONOMY = [
  // Verb tenses
  "present_simple", "present_continuous", "present_perfect", "present_perfect_continuous",
  "past_simple", "past_continuous", "past_perfect", "past_perfect_continuous",
  "future_will", "future_going_to", "future_perfect", "future_continuous",
  // Grammar structures
  "passive_voice", "relative_clauses", "conditionals", "reported_speech",
  "gerunds_infinitives", "modal_verbs", "articles", "prepositions",
  "comparatives_superlatives", "conjunctions", "noun_clauses", "word_form",
  "subject_verb_agreement", "pronouns", "parallel_structure",
  // TOEIC vocabulary categories
  "vocabulary_finance", "vocabulary_hr", "vocabulary_logistics",
  "vocabulary_marketing", "vocabulary_office", "vocabulary_travel",
  "vocabulary_general_business",
  // Reading/Listening
  "reading_main_idea", "reading_detail", "reading_inference",
  "reading_vocabulary_in_context", "listening_comprehension",
  "other",
] as const;

const EXTRACTION_SYSTEM_PROMPT = `You are a precise TOEIC/IELTS question extractor. Extract questions from raw PDF text and return ONLY a valid JSON array.

TOEIC Reading structure:
- Part 5 (Q101-140): 40 incomplete sentences. Each has one blank (____) and 4 answer options.
- Part 6 (Q141-152): 4 short texts (email/memo/notice) with 4 blanks each. Questions belong to a passage.
- Part 7 (Q153-200): Longer passages with comprehension questions.

Output format — return a JSON array where each element is:
{
  "questionNumber": number,
  "part": "Part 5" | "Part 6" | "Part 7" | "Listening Part 1" | "Listening Part 2" | "Listening Part 3" | "Listening Part 4",
  "type": "grammar" | "vocabulary" | "reading" | "listening",
  "question": "full question text with blank as _____",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "answer": 0,
  "grammarPoint": "one tag from the taxonomy list",
  "passage": "full passage text (Part 6/7 only, omit for Part 5)",
  "explanation": "brief explanation of why the answer is correct (optional)"
}

GRAMMAR POINT TAXONOMY — use exactly one of these for grammarPoint:
present_simple | present_continuous | present_perfect | present_perfect_continuous |
past_simple | past_continuous | past_perfect | future_will | future_going_to |
future_perfect | passive_voice | relative_clauses | conditionals | reported_speech |
gerunds_infinitives | modal_verbs | articles | prepositions | comparatives_superlatives |
conjunctions | word_form | subject_verb_agreement | pronouns | parallel_structure |
vocabulary_finance | vocabulary_hr | vocabulary_logistics | vocabulary_marketing |
vocabulary_office | vocabulary_travel | vocabulary_general_business |
reading_main_idea | reading_detail | reading_inference | reading_vocabulary_in_context |
listening_comprehension | other

RULES:
- Strip letter labels from options: "submit" NOT "(A) submit" or "A. submit"
- answer is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)
- If answer key is NOT provided, set answer to -1
- For Part 5: type is "grammar" if it tests verb form/structure, "vocabulary" if it tests word choice/meaning
- For Part 6/7: type is "reading", include the full passage in "passage" field (shared by all questions in that set)
- Return ONLY the JSON array, no other text`;

function buildExtractionPrompt(rawText: string, exam: string, source: string, answerMap: Record<number, number>): string {
  const hasAnswers = Object.keys(answerMap).length > 0;
  const answerSection = hasAnswers
    ? `\nANSWER KEY PROVIDED:\n${Object.entries(answerMap).map(([q, a]) => `Q${q}: ${["A","B","C","D"][a]}`).join(", ")}\nUse this answer key to set the "answer" field (0=A, 1=B, 2=C, 3=D).\n`
    : "\nNo answer key provided — set answer to -1 for all questions.\n";

  return `Extract all TOEIC ${exam} questions from this PDF text. Source: "${source}"
${answerSection}
--- RAW PDF TEXT START ---
${rawText.slice(0, 60000)}
--- RAW PDF TEXT END ---

Return a JSON array of all questions found. Follow the schema exactly.`;
}

// Parse answer key text: "101. A  102. C  103. B ..." or JSON array
function parseAnswerKey(text: string): Record<number, number> {
  const map: Record<number, number> = {};
  const LETTER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  // Try JSON array format: [0, 2, 1, ...] (0-indexed, starting from Q101)
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) {
      arr.forEach((val: number, i: number) => { map[101 + i] = val; });
      return map;
    }
  } catch { /* not JSON */ }

  // Try "101. A  102. C" or "101: A" or "101 A" format
  const pattern = /\b(1\d{2}|2\d{2})\s*[.:)]\s*([ABCD])\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    map[parseInt(match[1])] = LETTER[match[2].toUpperCase()] ?? 0;
  }
  return map;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const exam = (formData.get("exam") as string | null) ?? "TOEIC";
  const source = (formData.get("source") as string | null) ?? "Unknown source";
  const level = (formData.get("level") as string | null) ?? "B1";
  const answerKeyRaw = (formData.get("answerKey") as string | null) ?? "";

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // Parse PDF — dynamic import keeps pdf-parse out of the build-time bundle
  let rawText: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    rawText = pdfData.text ?? "";
  } catch (e) {
    return NextResponse.json({ error: `PDF parse error: ${e}` }, { status: 422 });
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });
  }

  // Parse answer key if provided
  const answerMap = answerKeyRaw.trim() ? parseAnswerKey(answerKeyRaw) : {};

  // Call AI to structure questions
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let questions: unknown[];
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionPrompt(rawText, exam, source, answerMap) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // low temp for consistent extraction
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    // AI may return { questions: [...] } or just [...]
    questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.data ?? []);
  } catch (e) {
    return NextResponse.json({ error: `AI extraction failed: ${e}` }, { status: 500 });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "No questions extracted from PDF" }, { status: 422 });
  }

  // Normalize and validate extracted questions
  type RawQ = Record<string, unknown>;
  const normalized = (questions as RawQ[])
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4)
    .map((q) => ({
      exam,
      part: String(q.part ?? "Part 5"),
      type: String(q.type ?? "grammar"),
      level,
      question: String(q.question),
      options: (q.options as string[]).map(String),
      answer: typeof q.answer === "number" && q.answer >= 0 ? q.answer : -1,
      explanation: q.explanation ? String(q.explanation) : null,
      source,
      grammarPoint: q.grammarPoint ? String(q.grammarPoint) : null,
      tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
      passage: q.passage ? String(q.passage) : null,
      questionNumber: typeof q.questionNumber === "number" ? q.questionNumber : null,
    }));

  return NextResponse.json({
    extracted: normalized.length,
    unanswered: normalized.filter((q) => q.answer === -1).length,
    questions: normalized,
  });
}
