import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are an expert language teacher creating structured lessons for Vietnamese learners studying English or Thai.
Output ONLY valid JSON — no markdown wrapper, no extra text before or after.
Rules:
- All explanations, instructions, and question text must be in Vietnamese
- All example sentences and phrases must include Vietnamese translations
- Examples must be complete, natural sentences — never fragments
- Grammar explanations must be thorough: cover usage cases, sentence structures, signal words, and common mistakes
- Quiz must have exactly 6 questions with diverse question types (fill-in-blank, meaning, error correction, context usage)
- Content depth must be sufficient that a learner genuinely understands the topic after studying`;

type GenerateRequest = { lessonType: string; language: string; level: string; topic?: string; examType?: string };

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

function buildPrompt({ lessonType, language, level, topic, examType }: GenerateRequest): string {
  const langLabel = language === "english" ? "tiếng Anh" : "tiếng Thái";

  const examContext: Record<string, string> = {
    TOEIC: `Bài học phục vụ ôn thi TOEIC (Listening & Reading). Tập trung từ vựng kinh doanh/văn phòng, ngữ pháp Part 5-6, chiến lược nghe Part 1-4, đọc hiểu Part 7. Câu quiz mô phỏng định dạng TOEIC Part 5 (điền vào chỗ trống) và Part 7 (đọc hiểu đoạn ngắn).`,
    IELTS: `Bài học phục vụ ôn thi IELTS Academic. Listening theo Section 1-4, Reading dạng True/False/Not Given & matching headings, Writing Task 1 (biểu đồ/bảng) hoặc Task 2 (argumentative essay), Speaking Part 1-3 với band descriptor. Câu quiz mô phỏng định dạng IELTS thực tế.`,
    general: `Bài học theo khung CEFR tổng quát, tập trung giao tiếp thực tế và ngữ pháp nền tảng.`,
  };
  const examNote = examType && examContext[examType] ? `\nBỐI CẢNH THI: ${examContext[examType]}\n` : "";

  const quizRequirements = `Quiz phải có ĐÚNG 6 câu hỏi, bao gồm các dạng đa dạng:
- 2 câu điền vào chỗ trống (choose the correct form)
- 2 câu chọn nghĩa / ngữ cảnh phù hợp
- 1 câu phát hiện lỗi sai (error correction)
- 1 câu vận dụng tình huống thực tế
Mỗi câu có đúng 4 lựa chọn (A/B/C/D), chỉ 1 đáp án đúng. Câu hỏi viết bằng tiếng Việt, đáp án có thể là tiếng Anh/Thái.`;

  const schemas: Record<string, string> = {
    vocabulary: `{
  "title": "string — tên bài học cụ thể (vd: 'Từ vựng về Công việc & Văn phòng')",
  "words": [
    {
      "word": "string — từ gốc",
      "phonetic": "string — phiên âm IPA",
      "meaning": "string — nghĩa tiếng Việt chính xác",
      "example": "string — 1 câu ví dụ hoàn chỉnh bằng tiếng Anh/Thái",
      "example_vi": "string — dịch nghĩa câu ví dụ sang tiếng Việt"
    }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU words: Tạo ĐÚNG 10 từ vựng phù hợp trình độ ${level}, mỗi ví dụ phải là câu hoàn chỉnh và tự nhiên, có dịch nghĩa tiếng Việt đi kèm.`,

    grammar: `{
  "title": "string — tên bài học cụ thể (vd: 'Thì Hiện Tại Hoàn Thành')",
  "explanation": "string — giải thích ngữ pháp chi tiết BẰNG TIẾNG VIỆT theo cấu trúc markdown sau:\n## 1. Khi nào dùng?\n(Liệt kê 3-4 trường hợp sử dụng chính, mỗi trường hợp có 1 câu ví dụ kèm dịch nghĩa)\n\n## 2. Cấu trúc câu\n| Loại câu | Công thức | Ví dụ | Dịch nghĩa |\n|----------|-----------|-------|-----------|\n(Tạo bảng đầy đủ: Khẳng định / Phủ định / Câu hỏi Yes-No / Câu hỏi Wh-)\n\n## 3. Từ/dấu hiệu nhận biết\n(Liệt kê 5-7 signal words thường gặp, mỗi cái có 1 ví dụ ngắn + dịch)\n\n## 4. Ví dụ tình huống thực tế\n(Viết 4 câu ví dụ đa dạng tình huống, in đậm phần ngữ pháp trọng tâm, kèm dịch nghĩa tiếng Việt)\n\n## 5. Lỗi thường gặp ❌→✅\n(Liệt kê 3 lỗi sai phổ biến, mỗi lỗi: câu sai → câu đúng → giải thích ngắn)",
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}`,

    reading: `{
  "title": "string — tên bài đọc cụ thể",
  "passage": "string — đoạn văn 180-220 từ, phù hợp trình độ ${level}, viết hoàn chỉnh và tự nhiên. Phải có ít nhất 3 đoạn rõ ràng.",
  "vocab_highlight": [
    { "word": "string — từ khó trong bài", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: vocab_highlight có 4-5 từ quan trọng từ đoạn văn. Quiz 6 câu kiểm tra hiểu ý chính, chi tiết, từ vựng trong bài, và suy luận.`,

    listening: `{
  "title": "string — tên bài nghe cụ thể",
  "context": "string — mô tả tình huống bằng tiếng Việt (ai đang nói, ở đâu, về chủ đề gì)",
  "transcript": "string — hội thoại hoặc độc thoại mô phỏng bài nghe, viết đầy đủ theo format 'A: ... / B: ...' hoặc 'Narrator: ...', dài ít nhất 150 từ, tự nhiên như tiếng nói thật",
  "key_phrases": [
    { "phrase": "string — cụm từ quan trọng trong transcript", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: key_phrases có 4-5 cụm. Quiz 6 câu kiểm tra nội dung nghe: ý chính, chi tiết cụ thể, từ vựng, thái độ/mục đích người nói.`,

    writing: `{
  "title": "string — tên bài viết cụ thể",
  "prompt": "string — đề bài viết rõ ràng bằng tiếng Việt, nêu rõ yêu cầu (viết gì, bao nhiêu từ, cho ai)",
  "structure": [
    { "part": "string — tên phần (Mở bài / Thân bài 1 / Thân bài 2 / Kết bài)", "guide": "string — hướng dẫn viết phần đó bằng tiếng Việt" }
  ],
  "useful_phrases": ["string — cụm từ hữu ích (song ngữ Anh – Việt)"],
  "example": "string — bài viết mẫu hoàn chỉnh theo đề bài, dài 80-120 từ",
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: structure có 4 phần. useful_phrases có 5-6 cụm. Quiz 6 câu về cấu trúc văn bản, từ nối, từ vựng học thuật.`,

    speaking: `{
  "title": "string — tên bài nói cụ thể",
  "topic": "string — chủ đề câu hỏi gợi mở bằng tiếng Việt",
  "phrases": [
    { "phrase": "string — câu mẫu tiếng Anh/Thái", "phonetic": "string — phiên âm", "meaning": "string — nghĩa tiếng Việt", "usage_tip": "string — gợi ý khi nào dùng câu này" }
  ],
  "dialogue": [
    { "speaker": "string — A hoặc B", "text": "string — câu nói", "translation": "string — dịch nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: phrases có ĐÚNG 6 câu mẫu thực tế. dialogue có 8-10 lượt thoại tạo hội thoại hoàn chỉnh. Quiz 6 câu về ngữ cảnh dùng các phrases.`,

    review: `{
  "title": "string — tên bài ôn tập cụ thể",
  "summary": "string — tóm tắt các điểm ngữ pháp và từ vựng quan trọng của tuần, trình bày bằng markdown có đầu mục rõ ràng, dài ít nhất 10 dòng",
  "words": [
    { "word": "string", "phonetic": "string", "meaning": "string", "example": "string — câu ví dụ", "example_vi": "string — dịch nghĩa" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: words có 8 từ quan trọng nhất của chủ đề tuần. Quiz 6 câu ôn tập tổng hợp cả ngữ pháp lẫn từ vựng.`,
  };

  const schema = schemas[lessonType] ?? schemas.vocabulary;
  const topicLine = topic ? `CHỦ ĐỀ BÀI HỌC: "${topic}"\n` : "";

  return `Tạo một bài học ${lessonType} ${langLabel} cho trình độ ${level} (khung CEFR).
${topicLine}${examNote}
${quizRequirements}

Yêu cầu chất lượng:
- Mọi ví dụ phải là câu HOÀN CHỈNH, tự nhiên, có ngữ cảnh rõ ràng
- Mọi câu tiếng Anh/Thái đều phải có dịch nghĩa tiếng Việt đi kèm
- Nội dung phải ĐỦ ĐỘ SÂU: người học cảm thấy hiểu bài sau khi đọc xong
- Độ khó phù hợp đúng trình độ ${level}

Trả về JSON hợp lệ theo schema sau, KHÔNG có text thêm bên ngoài JSON:\n\n${schema}`;
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

export async function generateLesson(lessonType: string, language: string, level: string, topic?: string, userId?: string, examType?: string) {
  if (!lessonType || !language || !level) throw new Error("Missing fields");

  // Topic-based lesson: unique ID per topic, skip fallback chain
  if (topic) {
    const slug = topicToSlug(topic);
    // Include examType in cache key so TOEIC/IELTS lessons are stored separately
    const examSuffix = examType && examType !== "general" ? `_${examType.toLowerCase()}` : "";
    const topicId = `${lessonType}_${language}_${level}_${slug}${examSuffix}`;

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

    const lesson = await callAI(buildPrompt({ lessonType, language, level, topic, examType }));

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
