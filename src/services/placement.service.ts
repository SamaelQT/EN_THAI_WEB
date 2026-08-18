import { prisma } from "@/lib/db";
import { scoreToLevel } from "@/lib/placement-data";
import { scoreSubmission, TEST_TYPES, type Language, type TestType } from "@/lib/placement-engine";
import { deleteRoadmapById } from "./roadmap.service";

const LANGUAGES: Language[] = ["english", "thai", "korean"];

export async function submitPlacementTest(
  userId: string,
  language: string,
  score: number,
  answers: unknown[],
  clientLevel?: string,
  testType?: string,
  questionIds?: unknown,
) {
  if (!LANGUAGES.includes(language as Language)) throw new Error("Invalid language");

  const type = (testType ?? "cefr") as TestType;
  if (!TEST_TYPES[language as Language].includes(type)) throw new Error("Invalid test type");

  // Prefer the server's own scoring: the browser only reports which questions it served.
  // Falling back to the client's numbers keeps older clients working, but any submission
  // that ships question ids is scored here and cannot be forged.
  let level = clientLevel ?? scoreToLevel(score);
  let finalScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));

  if (Array.isArray(questionIds) && questionIds.every((id) => typeof id === "string")) {
    const verified = scoreSubmission(type, questionIds as string[], answers as (number | null)[]);
    if (!verified) throw new Error("Invalid submission");
    level = verified.level;
    finalScore = verified.score;
  }

  const test = await prisma.placementTest.create({
    data: {
      userId,
      language,
      level,
      score: finalScore,
      answers: JSON.stringify(answers),
      testType: type,
    },
  });

  return { test, level, score: finalScore };
}

export async function getPlacementTests(userId: string, language?: string | null) {
  return prisma.placementTest.findMany({
    where: { userId, ...(language ? { language } : {}) },
    orderBy: { completedAt: "desc" },
  });
}

/**
 * Delete a placement test owned by userId.
 * If force=false and a roadmap is linked, throws with info about the roadmap.
 * If force=true, deletes the linked roadmap (cascade) first, then the test.
 */
export async function deletePlacementTest(
  userId: string,
  testId: string,
  force = false
): Promise<{ deletedRoadmap: boolean }> {
  // Ownership check
  const test = await prisma.placementTest.findFirst({
    where: { id: testId, userId },
    include: { roadmap: { select: { id: true, language: true, targetExam: true } } },
  });
  if (!test) throw Object.assign(new Error("Không tìm thấy bài kiểm tra"), { status: 404 });

  const linkedRoadmap = test.roadmap;

  if (linkedRoadmap && !force) {
    throw Object.assign(
      new Error("Bài kiểm tra này đang được dùng bởi một lộ trình học"),
      { status: 409, roadmap: linkedRoadmap }
    );
  }

  // Delete linked roadmap first (Prisma will cascade weeks → days)
  if (linkedRoadmap) {
    await deleteRoadmapById(linkedRoadmap.id);
  }

  await prisma.placementTest.delete({ where: { id: testId } });
  return { deletedRoadmap: !!linkedRoadmap };
}
