import { prisma } from "@/lib/db";

/**
 * Personal vocabulary notebook with SM-2 spaced repetition.
 *
 * SM-2 (SuperMemo 2) is the algorithm Anki is built on. Each item carries an ease
 * factor, a repetition count and an interval in days; the learner's self-rating after
 * each review moves those three numbers, which decides when the word comes back.
 */

export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

/** Grades below 3 mean the learner failed to recall — the item restarts. */
const FAIL_THRESHOLD = 3;
const MIN_EASE = 1.3;

export type Sm2State = {
  ease: number;
  intervalDay: number;
  repetitions: number;
  lapses: number;
};

/** Pure SM-2 step. Returns the next scheduling state for an item. */
export function sm2(state: Sm2State, grade: Grade): Sm2State & { dueAt: Date } {
  let { ease, intervalDay, repetitions, lapses } = state;

  if (grade < FAIL_THRESHOLD) {
    // Forgotten — start the ladder again, but keep (a reduced) ease
    repetitions = 0;
    intervalDay = 1;
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDay = 1;
    else if (repetitions === 2) intervalDay = 6;
    else intervalDay = Math.round(intervalDay * ease);

    // Standard SM-2 ease adjustment
    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    ease = Math.max(MIN_EASE, ease);
  }

  const dueAt = new Date();
  dueAt.setHours(0, 0, 0, 0);
  dueAt.setDate(dueAt.getDate() + Math.max(1, intervalDay));

  return { ease, intervalDay, repetitions, lapses, dueAt };
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export type NewWord = {
  word: string;
  meaning: string;
  phonetic?: string | null;
  example?: string | null;
  exampleVi?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
};

/**
 * Add words to the notebook, skipping ones already saved.
 * New words are due immediately so they show up in today's queue.
 */
export async function addWords(userId: string, language: string, words: NewWord[]) {
  const cleaned = words
    .filter((w) => typeof w?.word === "string" && w.word.trim() && typeof w?.meaning === "string" && w.meaning.trim())
    .map((w) => ({
      word: w.word.trim().slice(0, 200),
      meaning: w.meaning.trim().slice(0, 500),
      phonetic: w.phonetic?.trim().slice(0, 200) ?? null,
      example: w.example?.trim().slice(0, 1000) ?? null,
      exampleVi: w.exampleVi?.trim().slice(0, 1000) ?? null,
      sourceType: w.sourceType ?? "manual",
      sourceId: w.sourceId ?? null,
    }))
    .slice(0, 50);

  if (cleaned.length === 0) return { added: 0, skipped: 0 };

  const existing = await prisma.vocabularyItem.findMany({
    where: { userId, language, word: { in: cleaned.map((w) => w.word) } },
    select: { word: true },
  });
  const have = new Set(existing.map((e) => e.word));
  const fresh = cleaned.filter((w) => !have.has(w.word));

  if (fresh.length > 0) {
    await prisma.vocabularyItem.createMany({
      data: fresh.map((w) => ({ ...w, userId, language, dueAt: new Date() })),
    });
  }

  return { added: fresh.length, skipped: cleaned.length - fresh.length };
}

export async function listWords(userId: string, language: string, filter: "all" | "due" = "all") {
  return prisma.vocabularyItem.findMany({
    where: {
      userId,
      language,
      ...(filter === "due" ? { dueAt: { lte: new Date() } } : {}),
    },
    orderBy: filter === "due" ? { dueAt: "asc" } : { createdAt: "desc" },
    take: filter === "due" ? 30 : 300,
  });
}

export async function countDue(userId: string, language: string) {
  return prisma.vocabularyItem.count({
    where: { userId, language, dueAt: { lte: new Date() } },
  });
}

export async function reviewWord(userId: string, itemId: string, grade: Grade) {
  const item = await prisma.vocabularyItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw Object.assign(new Error("Not found"), { status: 404 });

  const next = sm2(
    { ease: item.ease, intervalDay: item.intervalDay, repetitions: item.repetitions, lapses: item.lapses },
    grade,
  );

  return prisma.vocabularyItem.update({
    where: { id: itemId },
    data: {
      ease: next.ease,
      intervalDay: next.intervalDay,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastReviewedAt: new Date(),
    },
  });
}

export async function deleteWord(userId: string, itemId: string) {
  const item = await prisma.vocabularyItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw Object.assign(new Error("Not found"), { status: 404 });
  await prisma.vocabularyItem.delete({ where: { id: itemId } });
}

/** Rough progress buckets for the notebook header. */
export async function getVocabStats(userId: string, language: string) {
  const items = await prisma.vocabularyItem.findMany({
    where: { userId, language },
    select: { repetitions: true, intervalDay: true, dueAt: true },
  });

  const now = new Date();
  return {
    total: items.length,
    due: items.filter((i) => i.dueAt <= now).length,
    // "Learning" until it survives two successful reviews, "mature" once the gap is 3 weeks+
    learning: items.filter((i) => i.repetitions < 2).length,
    young: items.filter((i) => i.repetitions >= 2 && i.intervalDay < 21).length,
    mature: items.filter((i) => i.intervalDay >= 21).length,
  };
}
