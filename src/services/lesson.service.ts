import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are a language teaching assistant for Vietnamese learners studying English or Thai.
Generate lesson content as valid JSON only — no markdown, no extra text.
All explanations and instructions must be in Vietnamese.
Keep examples natural and practical for everyday use.`;

type GenerateRequest = { lessonType: string; language: string; level: string; topic?: string };

export function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildPrompt({ lessonType, language, level, topic }: GenerateRequest): string {
  const langLabel = language === "english" ? "tiếng Anh" : "tiếng Thái";
  const schemas: Record<string, string> = {
    vocabulary: `{
  "title": "Tên bài học",
  "words": [{ "word": "từ gốc", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ" }],
  "quiz": [{ "q": "câu hỏi tiếng Việt", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    grammar: `{
  "title": "Tên bài học",
  "explanation": "Giải thích ngữ pháp bằng tiếng Việt, dùng ký hiệu markdown đơn giản",
  "quiz": [{ "q": "câu hỏi", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    reading: `{
  "title": "Tên bài đọc",
  "passage": "Đoạn văn bản 150-200 từ phù hợp trình độ",
  "quiz": [{ "q": "câu hỏi hiểu văn bản", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    listening: `{
  "title": "Luyện nghe – Mô phỏng",
  "transcript": "Đoạn hội thoại hoặc văn bản mô phỏng bài nghe",
  "context": "Mô tả tình huống bằng tiếng Việt",
  "quiz": [{ "q": "câu hỏi về nội dung", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    writing: `{
  "title": "Luyện viết",
  "prompt": "Đề bài viết bằng tiếng Việt",
  "tips": ["gợi ý 1", "gợi ý 2", "gợi ý 3"],
  "example": "Bài viết mẫu ngắn",
  "quiz": [{ "q": "câu hỏi về cấu trúc/từ vựng trong bài", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    speaking: `{
  "title": "Luyện nói",
  "topic": "Chủ đề nói chuyện",
  "phrases": [{ "phrase": "câu mẫu", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt" }],
  "dialogue": [{ "speaker": "A", "text": "câu nói", "translation": "dịch nghĩa" }],
  "quiz": [{ "q": "câu hỏi", "options": ["A","B","C","D"], "answer": 0 }]
}`,
    review: `{
  "title": "Ôn tập tổng hợp",
  "summary": "Tóm tắt ngắn các điểm ngữ pháp và từ vựng quan trọng",
  "words": [{ "word": "từ quan trọng", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ" }],
  "quiz": [{ "q": "câu hỏi ôn tập tổng hợp", "options": ["A","B","C","D"], "answer": 0 }]
}`,
  };

  const schema = schemas[lessonType] ?? schemas.vocabulary;
  const typeLabel = lessonType === "review" ? "ôn tập tổng hợp" : lessonType;
  const topicLine = topic ? `Chủ đề bài học: "${topic}".\n` : "";
  return `Tạo một bài học ${typeLabel} về ${langLabel} cho trình độ ${level}.
${topicLine}Bài học phải phù hợp với trình độ ${level} theo khung CEFR, với 6 mục (words/phrases nếu có) và 3 câu hỏi quiz.
Trả về JSON hợp lệ theo schema sau, không có gì thêm:\n\n${schema}`;
}

// ── Achievement rules ──────────────────────────────────────────────────────

const ACHIEVEMENT_RULES = [
  { code: "first_lesson",  name: "Bước đầu tiên", description: "Hoàn thành bài học đầu tiên",      icon: "🎯", category: "lesson",     xpReward: 50,  check: (t: number, s: number, x: number) => t === 1 },
  { code: "lessons_10",    name: "Siêng năng",     description: "Hoàn thành 10 bài học",            icon: "📚", category: "lesson",     xpReward: 100, check: (t: number) => t >= 10 },
  { code: "lessons_50",    name: "Học giả",        description: "Hoàn thành 50 bài học",            icon: "🏆", category: "lesson",     xpReward: 300, check: (t: number) => t >= 50 },
  { code: "streak_7",      name: "Lửa tuần",       description: "Học liên tiếp 7 ngày",             icon: "🔥", category: "streak",     xpReward: 100, check: (t: number, s: number) => s >= 7 },
  { code: "streak_30",     name: "Lửa tháng",      description: "Học liên tiếp 30 ngày",            icon: "🌟", category: "streak",     xpReward: 500, check: (t: number, s: number) => s >= 30 },
  { code: "perfect_score", name: "Hoàn hảo",       description: "Đạt 100% trong bài kiểm tra",      icon: "💯", category: "score",      xpReward: 75,  check: (t: number, s: number, x: number, score: number) => score === 100 },
  { code: "xp_500",        name: "Tích lũy",       description: "Đạt 500 XP",                       icon: "⭐", category: "milestone",  xpReward: 50,  check: (t: number, s: number, x: number) => x >= 500 },
] as const;

// ── completeLesson ─────────────────────────────────────────────────────────

export async function completeLesson(
  userId: string,
  opts: { lessonType: string; language: string; level: string; score: number; timeSpent?: number; dayId?: string }
) {
  const { lessonType, language, level, score, timeSpent, dayId } = opts;

  // Upsert placeholder lesson
  const lesson = await prisma.lesson.upsert({
    where: { id: `${lessonType}_${language}_${level}` },
    update: {},
    create: {
      id: `${lessonType}_${language}_${level}`,
      language, type: lessonType, level,
      title: `${lessonType} – ${level}`,
      content: "{}",
      xpReward: score >= 70 ? 15 : 8,
    },
  });

  await prisma.lessonProgress.create({
    data: { userId, lessonId: lesson.id, score, timeSpent: timeSpent ?? null },
  });

  const xpGained = score >= 70 ? 15 : 8;
  await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: xpGained } } });

  // ── Streak ──────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const streak = await prisma.streak.findUnique({ where: { userId_language: { userId, language } } });
  let newStreak = 1;

  if (streak) {
    const last = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - last.getTime()) / 86400000);
      if (diff === 0) newStreak = streak.currentStreak;
      else if (diff === 1) newStreak = streak.currentStreak + 1;
      else newStreak = (streak.frozenUntil && new Date(streak.frozenUntil) >= today) ? streak.currentStreak : 1;
    }
    await prisma.streak.update({
      where: { userId_language: { userId, language } },
      data: { currentStreak: newStreak, longestStreak: Math.max(newStreak, streak.longestStreak), lastActivityDate: new Date(), frozenUntil: null },
    });
  } else {
    await prisma.streak.create({
      data: { userId, language, currentStreak: 1, longestStreak: 1, lastActivityDate: new Date() },
    });
  }

  // ── Achievements ────────────────────────────────────────────
  const [totalLessons, currentUser] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } }),
  ]);
  const totalXp = currentUser?.totalXp ?? 0;
  const newAchievements: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (!rule.check(totalLessons, newStreak, totalXp, score)) continue;
    const exists = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: rule.code } },
    });
    if (exists) continue;

    await prisma.achievement.upsert({
      where: { code: rule.code },
      update: {},
      create: { id: rule.code, code: rule.code, name: rule.name, description: rule.description, icon: rule.icon, category: rule.category, xpReward: rule.xpReward },
    });
    await prisma.userAchievement.create({ data: { userId, achievementId: rule.code, language } });
    await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: rule.xpReward } } });
    await createNotification({ userId, type: "achievement", title: `Thành tích mới: ${rule.name} ${rule.icon}`, body: rule.description });
    newAchievements.push(rule.name);
  }

  // ── Roadmap progression ─────────────────────────────────────
  let weekAdvanced = false;
  if (dayId) {
    const day = await prisma.roadmapDay.findUnique({
      where: { id: dayId },
      include: { week: { include: { days: true, roadmap: true } } },
    });

    if (day && day.week.roadmap.userId === userId && day.status !== "completed") {
      await prisma.roadmapDay.update({ where: { id: dayId }, data: { status: "completed", completedAt: new Date() } });

      const allDone = day.week.days.map((d) => d.id === dayId ? { ...d, status: "completed" } : d).every((d) => d.status === "completed");
      if (allDone) {
        await prisma.roadmapWeek.update({ where: { id: day.week.id }, data: { status: "completed" } });
        const nextWeek = await prisma.roadmapWeek.findFirst({
          where: { roadmapId: day.week.roadmapId, weekNumber: day.week.weekNumber + 1, status: "pending" },
        });
        if (nextWeek) {
          await prisma.roadmapWeek.update({ where: { id: nextWeek.id }, data: { status: "active" } });
          weekAdvanced = true;
        } else {
          await prisma.roadmap.update({ where: { id: day.week.roadmapId }, data: { status: "completed" } });
          await createNotification({ userId, type: "roadmap_completed", title: "🎓 Hoàn thành lộ trình!", body: "Bạn đã hoàn thành toàn bộ lộ trình học tập. Chúc mừng!" });
        }
      }
    }
  }

  return { xpGained, newStreak, newAchievements, weekAdvanced };
}

// ── Groq helper ────────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<any> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

// ── generateLesson ─────────────────────────────────────────────────────────

export async function generateLesson(lessonType: string, language: string, level: string, topic?: string, userId?: string) {
  if (!lessonType || !language || !level) throw new Error("Missing fields");

  // Topic-based lesson: unique ID per topic, skip fallback chain
  if (topic) {
    const slug = topicToSlug(topic);
    const topicId = `${lessonType}_${language}_${level}_${slug}`;

    // Check if user already completed this lesson → generate fresh variant
    const alreadyCompleted = userId
      ? await prisma.lessonProgress.findFirst({ where: { userId, lessonId: topicId } })
      : null;

    if (!alreadyCompleted) {
      const existing = await prisma.lesson.findUnique({ where: { id: topicId } });
      if (existing && existing.content !== "{}") {
        try { return JSON.parse(existing.content); } catch { /* fall through to generate */ }
      }
    }

    if (!process.env.GROQ_API_KEY) {
      const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
      err.code = "NO_API_KEY";
      throw err;
    }

    const lesson = await callAI(buildPrompt({ lessonType, language, level, topic }));

    // Only cache if first time (not a variant for completed lesson)
    if (!alreadyCompleted) {
      await prisma.lesson.upsert({
        where: { id: topicId },
        update: { content: JSON.stringify(lesson), title: lesson.title ?? topicId },
        create: { id: topicId, language, type: lessonType, level, title: lesson.title ?? topicId, content: JSON.stringify(lesson), xpReward: 15 },
      });
    }
    return lesson;
  }

  // No topic: use seeded lesson (exact match first)
  const lessonId = `${lessonType}_${language}_${level}`;
  const exact = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (exact && exact.content !== "{}") {
    try { return JSON.parse(exact.content); } catch { /* fall through */ }
  }

  // Fallback: same type + language, closest level
  const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const targetIdx = LEVEL_ORDER.indexOf(level);
  const fallbacks = await prisma.lesson.findMany({
    where: { language, type: lessonType, content: { not: "{}" } },
  });
  if (fallbacks.length > 0) {
    const sorted = fallbacks.sort((a, b) => {
      const da = Math.abs(LEVEL_ORDER.indexOf(a.level) - targetIdx);
      const db = Math.abs(LEVEL_ORDER.indexOf(b.level) - targetIdx);
      return da - db;
    });
    try { return JSON.parse(sorted[0].content); } catch { /* fall through */ }
  }

  // Last resort: same language, any type
  const anyLesson = await prisma.lesson.findFirst({ where: { language, content: { not: "{}" } } });
  if (anyLesson) {
    try { return JSON.parse(anyLesson.content); } catch { /* fall through */ }
  }

  if (!process.env.GROQ_API_KEY) {
    const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
    err.code = "NO_API_KEY";
    throw err;
  }

  const lesson = await callAI(buildPrompt({ lessonType, language, level }));
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: { content: JSON.stringify(lesson), title: lesson.title ?? lessonId },
    create: { id: lessonId, language, type: lessonType, level, title: lesson.title ?? lessonId, content: JSON.stringify(lesson), xpReward: 15 },
  });
  return lesson;
}
