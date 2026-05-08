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
    await prisma.roadmap.delete({ where: { id: linkedRoadmap.id } });
  }

  await prisma.placementTest.delete({ where: { id: testId } });
  return { deletedRoadmap: !!linkedRoadmap };
}
