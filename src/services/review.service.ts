import { prisma } from "@/lib/db";
import Groq from "groq-sdk";

export type ReviewType =
  | "vocabulary"
  | "grammar"
  | "quiz_15"
  | "quiz_30"
  | "simulation_b1"
  | "simulation_toeic"
  | "simulation_cutfl";

const QUESTION_COUNT: Record<ReviewType, number> = {
  vocabulary: 15,
  grammar: 15,
  quiz_15: 20,
  quiz_30: 35,
  simulation_b1: 35,
  simulation_toeic: 35,
  simulation_cutfl: 35,
};

const DURATION: Record<ReviewType, number> = {
  vocabulary: 15,
  grammar: 15,
  quiz_15: 15,
  quiz_30: 30,
  simulation_b1: 30,
  simulation_toeic: 30,
  simulation_cutfl: 30,
};

function buildPrompt(
  language: string,
  type: ReviewType,
  topic: string,
  level: string,
  count: number
): string {
  const lang = language === "english" ? "English" : "Thai";
  const langNote =
    language === "english"
      ? "Questions and options in English, explanation in Vietnamese."
      : "Questions and options in Thai (with Vietnamese translation where helpful), explanation in Vietnamese.";

  const typeDesc: Record<ReviewType, string> = {
    vocabulary: `Vocabulary review about the topic "${topic}" at ${level} level. Test word meaning, usage in context, and collocations.`,
    grammar: `Grammar review about "${topic}" at ${level} level. Test understanding and correct usage of this grammar point.`,
    quiz_15: `Mixed 15-minute quiz (vocabulary + grammar) for ${level} level ${lang}. Topic: ${topic}.`,
    quiz_30: `Mixed 30-minute quiz (vocabulary + grammar + reading comprehension) for ${level} level ${lang}. Topic: ${topic}.`,
    simulation_b1: `Simulate a B1 level ${lang} proficiency test. Mix of grammar, vocabulary, and reading comprehension at B1 level.`,
    simulation_toeic: `Simulate a TOEIC test. Include Part 5 (incomplete sentences) and Part 7 (reading comprehension) style questions at intermediate level.`,
    simulation_cutfl: `Simulate a CU-TFL Thai proficiency test. Mix of vocabulary, grammar, and reading comprehension for Thai language.`,
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

export async function getOrGenerateReviewSet(
  language: string,
  type: ReviewType,
  topic: string,
  level: string
) {
  // Cache check — same params → reuse
  const existing = await prisma.reviewSet.findFirst({
    where: { language, type, topic, level },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (existing) return existing;

  // Generate via Groq
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const groq = new Groq({ apiKey });
  const count = QUESTION_COUNT[type];
  const prompt = buildPrompt(language, type, topic, level, count);

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
