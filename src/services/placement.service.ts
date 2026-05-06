import { prisma } from "@/lib/db";
import { scoreToLevel } from "@/lib/placement-data";

export async function submitPlacementTest(
  userId: string,
  language: string,
  score: number,
  answers: unknown[],
  clientLevel?: string,
  testType?: string
) {
  if (!["english", "thai"].includes(language)) throw new Error("Invalid language");

  const level = clientLevel ?? scoreToLevel(score);
  const test = await prisma.placementTest.create({
    data: {
      userId,
      language,
      level,
      score,
      answers: JSON.stringify(answers),
      testType: testType ?? "cefr",
    },
  });

  return { test, level, score };
}

export async function getPlacementTests(userId: string, language?: string | null) {
  return prisma.placementTest.findMany({
    where: { userId, ...(language ? { language } : {}) },
    orderBy: { completedAt: "desc" },
  });
}
