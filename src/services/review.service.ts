import { prisma } from "@/lib/db";
import Groq from "groq-sdk";

export type ReviewType =
  | "vocabulary"
  | "grammar"
  | "quiz_15"
  | "quiz_30"
  | "simulation_b1"
  | "simulation_toeic"
  | "simulation_ielts"
  | "simulation_cutfl"
  | "simulation_topik";

const QUESTION_COUNT: Record<ReviewType, number> = {
  vocabulary: 15,
  grammar: 15,
  quiz_15: 20,
  quiz_30: 35,
  simulation_b1: 35,
  simulation_toeic: 35,
  simulation_ielts: 35,
  simulation_cutfl: 35,
  simulation_topik: 35,
};

const DURATION: Record<ReviewType, number> = {
  vocabulary: 15,
  grammar: 15,
  quiz_15: 15,
  quiz_30: 30,
  simulation_b1: 30,
  simulation_toeic: 30,
  simulation_ielts: 30,
  simulation_cutfl: 30,
  simulation_topik: 30,
};

function buildPrompt(
  language: string,
  type: ReviewType,
  topic: string,
  level: string,
  count: number
): string {
  const lang = language === "english" ? "English" : language === "korean" ? "Korean" : "Thai";
  const langNote =
    language === "english"
      ? "Questions and options in English, explanation in Vietnamese."
      : language === "korean"
      ? "Questions and options in Korean (with Vietnamese translation where helpful), explanation in Vietnamese."
      : "Questions and options in Thai (with Vietnamese translation where helpful), explanation in Vietnamese.";

  const typeDesc: Record<ReviewType, string> = {
    vocabulary: `Vocabulary review about the topic "${topic}" at ${level} level. Test word meaning, usage in context, and collocations.`,
    grammar: `Grammar review about "${topic}" at ${level} level. Test understanding and correct usage of this grammar point.`,
    quiz_15: `Mixed 15-minute quiz (vocabulary + grammar) for ${level} level ${lang}. Topic: ${topic}.`,
    quiz_30: `Mixed 30-minute quiz (vocabulary + grammar + reading comprehension) for ${level} level ${lang}. Topic: ${topic}.`,
    simulation_b1: `Simulate a B1 level ${lang} proficiency test. Mix of grammar, vocabulary, and reading comprehension at B1 level.`,
    simulation_toeic: `Simulate a TOEIC Part 5 (incomplete sentence grammar/vocab) test. ${count} questions at B1-B2 business English level. Each question is one sentence with one blank and 4 options.`,
    simulation_ielts: `Simulate an IELTS Academic reading comprehension test. ${count} questions including True/False/Not Given, multiple choice, and vocabulary in context at B2-C1 level.`,
    simulation_cutfl: `Simulate a CU-TFL Thai proficiency test. Mix of vocabulary, grammar, and reading comprehension for Thai language.`,
    simulation_topik: `Simulate a TOPIK (Test of Proficiency in Korean) test. ${count} questions including vocabulary, grammar, and reading comprehension in Korean language at intermediate level.`,
  };

  return `You are a ${lang} language teacher creating a quiz for Vietnamese learners.

Task: ${typeDesc[type]}
Number of questions: ${count}
${langNote}

Return ONLY valid JSON in this exact format, no markdown, no explanation outside JSON:
{
  "title": "string (Vietnamese title for this quiz set)",
  "description": "string (1 sentence describing what this covers, in Vietnamese)",
  "questions": [
    {
      "order": 1,
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "string (brief explanation in Vietnamese why this answer is correct)"
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- "answer" is the 0-based index of the correct option
- Make distractors (wrong answers) plausible but clearly wrong on reflection
- Vary difficulty within the level
- No duplicate questions`;
}

/** Fisher-Yates shuffle */
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Try to pull real ETS questions from the DB for simulation types.
 * Returns null if not enough questions are available.
 */
async function getETSSimulationQuestions(
  exam: "TOEIC" | "IELTS",
  count: number,
): Promise<{ order: number; question: string; options: string[]; answer: number; explanation: string | null }[] | null> {
  const types = exam === "TOEIC" ? ["grammar", "vocabulary"] : ["reading", "grammar"];
  const pool = await prisma.examQuestion.findMany({
    where: { exam, type: { in: types }, answer: { gte: 0 } },
    take: count * 4, // large pool for better shuffle variety
  });
  if (pool.length < count) return null;

  return shuffleArr(pool).slice(0, count).map((q, i) => ({
    order: i + 1,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation ?? null,
  }));
}

/**
 * Get topics the user has recently studied (from completed lessons).
 * Used to personalise grammar/vocabulary review prompts.
 */
export async function getUserStudiedTopics(userId: string, language: string): Promise<string[]> {
  const progresses = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: 30,
  });

  if (progresses.length === 0) return [];

  // Fetch the actual lesson titles
  const lessonIds = [...new Set(progresses.map((p) => p.lessonId))];
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, language },
    select: { id: true, title: true },
  });
  const titleMap = new Map(lessons.map((l) => [l.id, l.title]));

  // Return unique titles in recency order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of progresses) {
    const title = titleMap.get(p.lessonId);
    if (title && !seen.has(title)) {
      seen.add(title);
      result.push(title);
      if (result.length >= 10) break;
    }
  }
  return result;
}

export async function getOrGenerateReviewSet(
  language: string,
  type: ReviewType,
  topic: string,
  level: string,
  userId?: string,
) {
  // ── For simulation types: always generate fresh from real ETS questions ──
  if (type === "simulation_toeic") {
    const etsQuestions = await getETSSimulationQuestions("TOEIC", QUESTION_COUNT[type]);
    if (etsQuestions) {
      // Don't cache — each call returns a freshly shuffled set
      return {
        id: `live_toeic_${Date.now()}`,
        language,
        type,
        topic: "TOEIC Simulation",
        level,
        title: "Mô phỏng TOEIC – Câu hỏi ETS thực tế",
        description: `${etsQuestions.length} câu hỏi TOEIC Part 5 từ đề thi ETS thực tế`,
        duration: DURATION[type],
        questions: etsQuestions,
        _count: { questions: etsQuestions.length },
      };
    }
    // Fall through to AI generation if DB doesn't have enough questions yet
  }

  if (type === "simulation_ielts") {
    const etsQuestions = await getETSSimulationQuestions("IELTS", QUESTION_COUNT[type]);
    if (etsQuestions) {
      return {
        id: `live_ielts_${Date.now()}`,
        language,
        type,
        topic: "IELTS Simulation",
        level,
        title: "Mô phỏng IELTS – Câu hỏi thực tế",
        description: `${etsQuestions.length} câu hỏi IELTS từ đề thi thực tế`,
        duration: DURATION[type],
        questions: etsQuestions,
        _count: { questions: etsQuestions.length },
      };
    }
  }

  // ── Cache check — same params → reuse ────────────────────────────────────
  const existing = await prisma.reviewSet.findFirst({
    where: { language, type, topic, level },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (existing) return existing;

  // ── Generate via Groq ─────────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const groq = new Groq({ apiKey });
  const count = QUESTION_COUNT[type];

  // For grammar/vocab review: personalize by including user's studied topics in prompt
  let personalContext = "";
  if (userId && (type === "grammar" || type === "vocabulary" || type === "quiz_15" || type === "quiz_30")) {
    try {
      const studiedTopics = await getUserStudiedTopics(userId, language);
      if (studiedTopics.length > 0) {
        personalContext = `\n\nCONTEXT: The learner has recently studied these lessons: ${studiedTopics.join(", ")}. Design questions that reinforce or build on this knowledge where relevant.`;
      }
    } catch { /* ignore — personalisation is optional */ }
  }

  const prompt = buildPrompt(language, type, topic, level, count) + personalContext;

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const text = result.choices[0]?.message?.content ?? "{}";

  const parsed = JSON.parse(text) as {
    title: string;
    description: string;
    questions: {
      order: number;
      question: string;
      options: string[];
      answer: number;
      explanation?: string;
    }[];
  };

  const reviewSet = await prisma.reviewSet.create({
    data: {
      language,
      type,
      topic,
      level,
      title: parsed.title,
      description: parsed.description,
      duration: DURATION[type],
      questions: {
        create: parsed.questions.map((q) => ({
          order: q.order,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation ?? null,
        })),
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return reviewSet;
}

export async function getReviewSets(language?: string) {
  return prisma.reviewSet.findMany({
    where: language ? { language } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function getReviewSetById(id: string) {
  return prisma.reviewSet.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}
