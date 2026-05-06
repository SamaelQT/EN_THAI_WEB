import { prisma } from "@/lib/db";
import { scoreToLevel } from "@/lib/placement-data";

export async function submitPlacementTest(userId: string, language: string, score: number, answers: unknown[]) {
  if (!["english", "thai"].includes(language)) throw new Error("Invalid language");

  const level = scoreToLevel(score);
  const test = await prisma.placementTest.create({
    data: { userId, language, level, score, answers: JSON.stringify(answers) },
  });

  return { test, level, score };
}

export async function getPlacementTests(userId: string, language?: string | null) {
  return prisma.placementTest.findMany({
    where: { userId, ...(language ? { language } : {}) },
    orderBy: { completedAt: "desc" },
  });
}
