import { prisma } from "@/lib/db";
import { sanitizeQuiz } from "./lesson.service";
import { generateJson } from "@/lib/ai-client";

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

  const koreanScriptNote =
    language === "korean"
      ? `
⚠️ KOREAN SCRIPT LOCK: every Korean word, sentence and option must be written in REAL HANGUL (한글).
Romanised Korean ("annyeonghaseyo", "meogeoyo", "jeoneun") is FORBIDDEN in questions and options.
Correct example: "다음 빈칸에 알맞은 것을 고르십시오." options ["먹어요","마셔요","자요","가요"].
Only "explanation" is written in Vietnamese.
`
      : "";

  // A random seed per generation so a second run on the same topic produces a different paper
  const variantSeed = Math.random().toString(36).slice(2, 8);

  return `You are a ${lang} language teacher creating a quiz for Vietnamese learners.

Task: ${typeDesc[type]}
Number of questions: ${count}
${langNote}
${koreanScriptNote}
VARIANT CODE: ${variantSeed} — this must be a FRESH set of questions, not the ones you would write by default.

MANDATORY QUESTION VARIETY — spread across these formats, never more than 1/3 of the paper in one format:
- fill-in-blank inside a sentence
- "which sentence is correct?" (4 full sentences)
- error identification (spot the wrong part)
- word meaning / closest synonym
- short 2-line dialogue completion
- sentence transformation (tense, negation, politeness, question form)
- mini reading item: 1-2 sentences of context followed by a comprehension question
- collocation / word-pairing question

DIFFICULTY RAMP: first third = recall, middle third = applied usage, final third = harder items
with longer sentences and subtle distractors.
Spread the correct answers evenly across index 0, 1, 2 and 3 — do not favour one position.

=== GIẢI THÍCH — BẮT BUỘC CHO MỌI CÂU ===
"explanation" (tiếng Việt, 2-4 câu): nêu quy tắc/nghĩa đang được kiểm tra → chỉ rõ dấu hiệu
TRONG CHÍNH CÂU HỎI khiến đáp án đó đúng → dịch nghĩa câu đúng sang tiếng Việt.
CẤM viết chung chung kiểu "Đáp án B đúng" / "Vì đây là cách dùng đúng".

"why_wrong": mảng đúng bằng số options, cùng thứ tự.
- Vị trí đáp án đúng: chuỗi rỗng ""
- Mỗi vị trí sai: 1 câu tiếng Việt nói RÕ sai ở đâu và vì sao, cụ thể tới mức
  người học nhận ra lỗi của chính mình.
- CẤM: "Đáp án này sai." / "Không phù hợp." / lặp cùng một câu cho nhiều phương án.

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
      "explanation": "string (tiếng Việt: vì sao đáp án đúng là đúng)",
      "why_wrong": ["", "vì sao B sai", "vì sao C sai", "vì sao D sai"]
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

  // ── Cache: keep several variants per (language, type, topic, level) ──────
  // Reusing one single cached set meant a learner redoing a review always got the
  // exact same paper. We build up to MAX_VARIANTS different papers, then serve a
  // random one with its questions reshuffled.
  const MAX_VARIANTS = 4;
  const count = QUESTION_COUNT[type];
  // Same floor used when deciding whether a fresh generation needs a retry (see below) —
  // reused here so a short set cached before that fix isn't served forever either. Rows
  // that don't qualify are simply never picked; they're left in place rather than deleted.
  const minAcceptable = Math.min(count, Math.max(8, Math.ceil(count / 2)));
  const cached = (
    await prisma.reviewSet.findMany({
      where: { language, type, topic, level },
      include: { questions: { orderBy: { order: "asc" } } },
    })
  ).filter((set) => set.questions.length >= minAcceptable);

  const pickCached = () => {
    const chosen = cached[Math.floor(Math.random() * cached.length)];
    return {
      ...chosen,
      questions: shuffleArr(chosen.questions).map((q, i) => ({ ...q, order: i + 1 })),
    };
  };

  // Enough variants banked → just serve one of them
  if (cached.length >= MAX_VARIANTS) return pickCached();

  const apiKey = process.env.GROQ_API_KEY;
  // No AI available → fall back to whatever is already cached
  if (!apiKey) {
    if (cached.length > 0) return pickCached();
    throw new Error("GROQ_API_KEY not configured");
  }

  // Some variants exist but not the full set: usually generate a new one to grow the
  // bank, but sometimes reuse so we don't hit the AI on every single attempt.
  if (cached.length > 0 && Math.random() < cached.length / (MAX_VARIANTS + 1)) {
    return pickCached();
  }

  // ── Generate via Groq ─────────────────────────────────────────────────────

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

  // Tell the model which variants already exist so it writes something genuinely new
  const avoidContext =
    cached.length > 0
      ? `\n\nAVOID REPEATING: ${cached.length} other quiz set(s) already exist for this topic. Write questions that test the same material from DIFFERENT angles, with different sentences and different vocabulary examples.`
      : "";

  const prompt = buildPrompt(language, type, topic, level, count) + personalContext + avoidContext;

  type Sanitized = ReturnType<typeof sanitizeQuiz>;
  async function attemptGenerate(): Promise<{ parsed: Record<string, unknown>; sanitized: Sanitized } | null> {
    const { data: text } = await generateJson({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      // Review sets run up to 35 explained questions (quiz_30, simulation_*) — needs more
      // room than a single lesson's quiz.
      maxTokens: 12000,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    // Drop malformed items — a question with a missing option list or an out-of-range
    // answer index renders as an unanswerable blank in the quiz screen.
    const sanitized = sanitizeQuiz(
      (Array.isArray(parsed.questions) ? parsed.questions : []).map((q) => {
        const item = q as Record<string, unknown>;
        return {
          q: item.question,
          options: item.options,
          answer: item.answer,
          explanation: item.explanation,
          why_wrong: item.why_wrong,
        };
      })
    );
    return { parsed, sanitized };
  }

  // Same failure mode as lesson generation (see the matching comment in lesson.service.ts's
  // generateLessonContent): the model can burn most of its completion budget on hidden
  // reasoning and hand back a JSON-valid but far-too-short question list. Below half of
  // what was asked (floor 8, computed above as minAcceptable) is treated as a failed
  // attempt and retried once, keeping whichever of the two actually has more questions.
  let result = await attemptGenerate();
  if (!result || result.sanitized.length < minAcceptable) {
    console.warn(
      `[review.service] short question set (${result?.sanitized.length ?? 0}/${count}) for ` +
      `${type}/${language}/${topic}/${level} — retrying once`
    );
    const retry = await attemptGenerate();
    if (retry && (!result || retry.sanitized.length > result.sanitized.length)) result = retry;
  }

  if (!result) {
    if (cached.length > 0) return pickCached();
    throw new Error("AI trả về dữ liệu không hợp lệ");
  }

  const { parsed, sanitized } = result;
  const questions = sanitized.map((q, i) => ({
    order: i + 1,
    question: q.q,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation ?? null,
    whyWrong: q.whyWrong ?? [],
  }));

  if (questions.length === 0) {
    if (cached.length > 0) return pickCached();
    throw new Error("AI không tạo được câu hỏi hợp lệ");
  }
  if (questions.length < minAcceptable) {
    console.error(
      `[review.service] question set still short after retry (${questions.length}/${count}) for ` +
      `${type}/${language}/${topic}/${level} — serving anyway`
    );
  }

  const reviewSet = await prisma.reviewSet.create({
    data: {
      language,
      type,
      topic,
      level,
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : `Ôn tập ${topic}`,
      description: typeof parsed.description === "string" ? parsed.description : null,
      duration: DURATION[type],
      questions: { create: questions },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return reviewSet;
}

/**
 * List review sets, newest first.
 *
 * Bounded on purpose: every generated variant is a row, so an unbounded findMany would
 * grow without limit and the /review page loads the whole list into the browser.
 */
export async function getReviewSets(language?: string, limit = 60) {
  return prisma.reviewSet.findMany({
    where: language ? { language } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(200, Math.max(1, limit)),
    include: { _count: { select: { questions: true } } },
  });
}

export async function getReviewSetById(id: string) {
  return prisma.reviewSet.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}
