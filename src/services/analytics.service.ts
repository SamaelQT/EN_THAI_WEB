import { prisma } from "@/lib/db";

export type AttemptInput = {
  question: string;
  options: string[];
  correctAnswer: number;
  chosenAnswer: number;
  explanation?: string | null;
};

export type RecordAttemptsInput = {
  userId: string;
  language: string;
  source: string;
  lessonId?: string | null;
  lessonType?: string | null;
  level?: string | null;
  topic?: string | null;
  attempts: AttemptInput[];
};

const SOURCES = ["lesson", "checkpoint", "review", "placement"];
const MAX_ATTEMPTS_PER_CALL = 60;

/**
 * Store one row per answered question.
 *
 * This is the raw material for everything adaptive in the app: the weakness report,
 * the "ôn lại câu sai" queue, and the per-skill accuracy chart. Best-effort by design —
 * the caller fires it without awaiting, so it must never throw into a learner's face.
 */
export async function recordQuizAttempts(input: RecordAttemptsInput): Promise<number> {
  const { userId, language, source, lessonId, lessonType, level, topic } = input;
  if (!SOURCES.includes(source)) throw new Error("Invalid source");

  const rows = input.attempts
    .slice(0, MAX_ATTEMPTS_PER_CALL)
    .filter((a) =>
      typeof a.question === "string" &&
      a.question.trim().length > 0 &&
      Array.isArray(a.options) &&
      a.options.length >= 2 &&
      Number.isInteger(a.correctAnswer) &&
      a.correctAnswer >= 0 &&
      a.correctAnswer < a.options.length
    )
    .map((a) => {
      // -1 means the learner skipped; anything outside the option range is normalised to that
      const chosen =
        Number.isInteger(a.chosenAnswer) && a.chosenAnswer >= 0 && a.chosenAnswer < a.options.length
          ? a.chosenAnswer
          : -1;
      return {
        userId,
        language,
        source,
        lessonId: lessonId ?? null,
        lessonType: lessonType ?? null,
        level: level ?? null,
        topic: topic ?? null,
        question: a.question.trim().slice(0, 1000),
        options: a.options.map((o) => String(o).slice(0, 500)),
        correctAnswer: a.correctAnswer,
        chosenAnswer: chosen,
        isCorrect: chosen === a.correctAnswer,
        explanation: a.explanation?.slice(0, 2000) ?? null,
      };
    });

  if (rows.length === 0) return 0;
  await prisma.quizAttempt.createMany({ data: rows });
  return rows.length;
}

// ── Reporting ──────────────────────────────────────────────────────────────

export type SkillStat = { key: string; total: number; correct: number; accuracy: number };

/**
 * Everything the progress page needs, in one pass over the attempt log.
 * `days` bounds the window so the query stays cheap as history grows.
 */
export async function getProgressReport(userId: string, language: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [attempts, progresses, streak] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId, language, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: {
        lessonType: true, topic: true, level: true, isCorrect: true,
        createdAt: true, source: true,
      },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { gte: since } },
      select: { score: true, timeSpent: true, completedAt: true },
    }),
    prisma.streak.findUnique({ where: { userId_language: { userId, language } } }),
  ]);

  const tally = (keyOf: (a: (typeof attempts)[number]) => string | null) => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const a of attempts) {
      const key = keyOf(a);
      if (!key) continue;
      const cur = map.get(key) ?? { total: 0, correct: 0 };
      cur.total++;
      if (a.isCorrect) cur.correct++;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v, accuracy: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  };

  const bySkill: SkillStat[] = tally((a) => a.lessonType);
  const byTopic: SkillStat[] = tally((a) => a.topic);

  // Daily accuracy series for the chart
  const dayMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const key = a.createdAt.toISOString().slice(0, 10);
    const cur = dayMap.get(key) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    dayMap.set(key, cur);
  }
  const daily = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, total: v.total, correct: v.correct, accuracy: Math.round((v.correct / v.total) * 100) }));

  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;

  return {
    windowDays: days,
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    lessonsCompleted: progresses.length,
    minutesStudied: Math.round(progresses.reduce((s, p) => s + (p.timeSpent ?? 0), 0) / 60),
    averageScore: progresses.length > 0
      ? Math.round(progresses.reduce((s, p) => s + (p.score ?? 0), 0) / progresses.length)
      : 0,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    bySkill,
    // Weakest first — these are what the learner should work on
    weakestSkills: bySkill.filter((s) => s.total >= 3).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
    weakestTopics: byTopic.filter((t) => t.total >= 3).sort((a, b) => a.accuracy - b.accuracy).slice(0, 8),
    daily,
  };
}

/** Questions the learner got wrong and hasn't since answered correctly — the redo queue. */
export async function getWrongAnswerQueue(userId: string, language: string, limit = 20) {
  const rows = await prisma.quizAttempt.findMany({
    where: { userId, language },
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  // Latest attempt per question wins: if they've since got it right, it leaves the queue
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    if (!latest.has(r.question)) latest.set(r.question, r);
  }

  return [...latest.values()]
    .filter((r) => !r.isCorrect)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      question: r.question,
      options: r.options,
      answer: r.correctAnswer,
      explanation: r.explanation,
      topic: r.topic,
      lessonType: r.lessonType,
    }));
}
