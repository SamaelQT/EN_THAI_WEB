import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/ai-client";
import { createNotification } from "./notification.service";
import { buildCramPlan, type Skill, type GoalType } from "@/lib/cram-templates";

const LANGUAGES = ["english", "thai", "korean"];
const MAX_AVAILABLE_MINUTES = 24 * 60; // v1 scope: single-sitting to ~1 day of study time
const MIN_AVAILABLE_MINUTES = 15;

export class CramPlanError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Short 1-2 sentence Vietnamese intro for the plan, best-effort only.
 *
 * Block content/timing must never depend on AI (see cram-templates.ts), so this is
 * wrapped in its own timeout and falls back to a canned line on any failure — a slow or
 * unavailable model must never block creating a plan for something time-critical.
 */
async function generateIntroBlurb(goalLabel: string, language: string, availableMinutes: number): Promise<string> {
  const langLabel = language === "english" ? "tiếng Anh" : language === "korean" ? "tiếng Hàn" : "tiếng Thái";
  const hours = Math.round((availableMinutes / 60) * 10) / 10;
  const fallback = `Kế hoạch ${hours} giờ cho "${goalLabel}" — làm lần lượt từng việc, tick khi xong.`;

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
  try {
    const result = await Promise.race([
      generateJson({
        messages: [{
          role: "user",
          content: `Viết 1-2 câu tiếng Việt ngắn gọn, tạo động lực, mở đầu cho một kế hoạch ôn tập cấp tốc ${langLabel} với mục tiêu "${goalLabel}", có khoảng ${hours} giờ để chuẩn bị. Không dùng emoji. Trả về JSON: {"blurb": "..."}`,
        }],
        temperature: 0.8,
        maxTokens: 200,
      }),
      timeout,
    ]);
    if (!result) return fallback;
    const parsed = JSON.parse(result.data || "{}");
    const blurb = typeof parsed.blurb === "string" ? parsed.blurb.trim() : "";
    return blurb.length > 0 && blurb.length < 400 ? blurb : fallback;
  } catch {
    return fallback;
  }
}

/** Resolve a level when the caller didn't specify one: active Roadmap, else latest PlacementTest, else B1. */
async function resolveLevel(userId: string, language: string): Promise<string> {
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, language, status: "active" },
    select: { currentLevel: true },
  });
  if (roadmap) return roadmap.currentLevel;

  const test = await prisma.placementTest.findFirst({
    where: { userId, language },
    orderBy: { completedAt: "desc" },
    select: { level: true },
  });
  return test?.level ?? "B1";
}

export type CreateCramPlanInput = {
  language: string;
  goalType: GoalType;
  goalLabel: string;
  examType?: string | null;
  level?: string;
  skills: Skill[];
  targetAt: string; // ISO datetime
  availableMinutes: number;
};

export async function createCramPlan(userId: string, input: CreateCramPlanInput) {
  if (!LANGUAGES.includes(input.language)) throw new CramPlanError("Ngôn ngữ không hợp lệ", 400);
  if (!["exam", "upcoming_need", "skill_push"].includes(input.goalType)) {
    throw new CramPlanError("Loại mục tiêu không hợp lệ", 400);
  }
  if (!input.goalLabel?.trim()) throw new CramPlanError("Thiếu tên mục tiêu", 400);
  if (!Array.isArray(input.skills) || input.skills.length === 0) {
    throw new CramPlanError("Chọn ít nhất 1 kỹ năng", 400);
  }
  const availableMinutes = Math.round(Number(input.availableMinutes));
  if (!Number.isFinite(availableMinutes) || availableMinutes < MIN_AVAILABLE_MINUTES || availableMinutes > MAX_AVAILABLE_MINUTES) {
    throw new CramPlanError(`Thời gian phải từ ${MIN_AVAILABLE_MINUTES} phút đến ${MAX_AVAILABLE_MINUTES / 60} giờ`, 400);
  }
  const targetAt = new Date(input.targetAt);
  if (Number.isNaN(targetAt.getTime())) throw new CramPlanError("Hạn chót không hợp lệ", 400);

  const level = input.level?.trim() || (await resolveLevel(userId, input.language));

  const { blocks, totalMinutes } = buildCramPlan({
    language: input.language,
    goalType: input.goalType,
    goalLabel: input.goalLabel.trim(),
    examType: input.examType ?? undefined,
    level,
    skills: input.skills,
    availableMinutes,
  });
  if (blocks.length === 0) throw new CramPlanError("Không tạo được kế hoạch từ lựa chọn này", 400);

  const introBlurb = await generateIntroBlurb(input.goalLabel.trim(), input.language, availableMinutes);

  const plan = await prisma.cramPlan.create({
    data: {
      userId,
      language: input.language,
      goalType: input.goalType,
      goalLabel: input.goalLabel.trim(),
      examType: input.examType?.trim() || null,
      level,
      skills: input.skills,
      targetAt,
      totalMinutes,
      introBlurb,
      blocks: {
        create: blocks.map((b) => ({
          order: b.order,
          skill: b.skill,
          title: b.title,
          goalText: b.goalText,
          durationMin: b.durationMin,
          checklist: b.checklist,
          checklistDone: b.checklistDone,
          template: b.template,
          linkType: b.linkType,
          linkLessonType: b.linkLessonType,
          linkTopic: b.linkTopic,
          linkExamType: b.linkExamType,
          linkScenario: b.linkScenario,
        })),
      },
    },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  await createNotification({
    userId,
    type: "cram_plan_created",
    title: "Kế hoạch cấp tốc đã sẵn sàng 🎯",
    body: `"${plan.goalLabel}" — ${blocks.length} việc, ${Math.round(totalMinutes / 60 * 10) / 10} giờ.`,
  });

  return plan;
}

export async function listCramPlans(userId: string) {
  return prisma.cramPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getCramPlanById(userId: string, id: string) {
  const plan = await prisma.cramPlan.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!plan || plan.userId !== userId) throw new CramPlanError("Không tìm thấy kế hoạch", 404);
  return plan;
}

export async function deleteCramPlan(userId: string, id: string) {
  const plan = await prisma.cramPlan.findUnique({ where: { id }, select: { userId: true } });
  if (!plan || plan.userId !== userId) throw new CramPlanError("Không tìm thấy kế hoạch", 404);
  await prisma.cramPlan.delete({ where: { id } }); // cascades to blocks
}

/** Thin resolver LessonsClient calls to find out what a "Bắt đầu" block should open. */
export async function getCramBlockLinkInfo(userId: string, blockId: string) {
  const block = await prisma.cramBlock.findUnique({
    where: { id: blockId },
    include: { plan: { select: { userId: true, language: true, level: true } } },
  });
  if (!block || block.plan.userId !== userId) throw new CramPlanError("Không tìm thấy việc cần làm", 404);

  return {
    language: block.plan.language,
    level: block.plan.level,
    linkType: block.linkType,
    linkLessonType: block.linkLessonType,
    linkTopic: block.linkTopic,
    linkExamType: block.linkExamType,
    linkScenario: block.linkScenario,
  };
}

export async function toggleCramBlockChecklist(userId: string, blockId: string, checklistDone: boolean[]) {
  const block = await prisma.cramBlock.findUnique({
    where: { id: blockId },
    include: { plan: { select: { id: true, userId: true } } },
  });
  if (!block || block.plan.userId !== userId) throw new CramPlanError("Không tìm thấy việc cần làm", 404);
  if (!Array.isArray(checklistDone) || checklistDone.length !== block.checklist.length) {
    throw new CramPlanError("Dữ liệu checklist không hợp lệ", 400);
  }

  await prisma.cramBlock.update({ where: { id: blockId }, data: { checklistDone } });

  // Recompute the parent plan's status: done once every block with a non-empty
  // checklist has every item checked. Blocks with no checklist (e.g. a "Ngủ" reminder)
  // are informational only and never block completion.
  const siblings = await prisma.cramBlock.findMany({
    where: { planId: block.plan.id },
    select: { checklist: true, checklistDone: true },
  });
  const allDone = siblings.every((s) => s.checklist.length === 0 || s.checklistDone.every(Boolean));
  await prisma.cramPlan.update({
    where: { id: block.plan.id },
    data: { status: allDone ? "done" : "active" },
  });

  return { checklistDone, planStatus: allDone ? "done" : "active" };
}
