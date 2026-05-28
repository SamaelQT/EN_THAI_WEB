import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are an expert language teacher creating structured lessons for Vietnamese learners studying English or Thai.
Output ONLY valid JSON — no markdown wrapper, no extra text before or after.

LANGUAGE RULES:
- Lesson body (explanations, grammar notes, tips): Vietnamese — learners need L1 support to understand
- Quiz questions ("q" field) and options: IN THE TARGET LANGUAGE (English or Thai) — the quiz IS the practice
- Exception: vocabulary "meaning" quiz questions ask for Vietnamese translation → options in Vietnamese
- All example sentences must include Vietnamese translation alongside

⚠️ CONTENT FIELDS LANGUAGE LOCK — THESE FIELDS MUST BE 100% ENGLISH OR THAI, ZERO VIETNAMESE:
- "passage" (reading lesson): write the full reading text in English/Thai only — no Vietnamese words, no translations embedded, no parenthetical notes in Vietnamese inside the passage
- "transcript" (listening lesson): spoken dialogue in English/Thai only — no Vietnamese inside
- "example" (writing lesson): the sample essay/writing must be English/Thai only
- "phrases[].phrase" (speaking lesson): the phrase itself must be English/Thai only
- "words[].example" (vocabulary/review): the example sentence must be English/Thai only
Vietnamese is ONLY allowed in: explanation, meaning, example_vi, guide, prompt, context, quiz question text (for comprehension Qs), and vocab_highlight[].meaning fields.
VIOLATION EXAMPLE (FORBIDDEN): passage contains "Công ty (company) đã..." or "She works at công ty..."
CORRECT: passage is entirely natural English prose with no Vietnamese anywhere inside it.

QUIZ RULES — THE QUIZ MUST FEEL LIKE A REAL ENGLISH/THAI TEST, NOT A VIETNAMESE TEST:
- For grammar lessons: ALL 6 questions written in English, testing ONLY the grammar point of this lesson
- For vocabulary lessons: 5 questions in English testing word usage, 1 question asking Vietnamese meaning
- For reading/listening: questions can be Vietnamese (comprehension), options in English/Thai
- NEVER put random unrelated topics in quiz — every question must test the exact lesson content
- NEVER prefix options with A) B) C) D) — UI adds labels automatically
- NEVER mix Vietnamese and English in same option: "go / đi", "went (quá khứ)" → FORBIDDEN
- Each option is a clean word/phrase/sentence in exactly one language

GRAMMAR TITLE RULE: Always use the English grammar term first, Vietnamese in parentheses.
Examples: "Simple Future Tense (Thì Tương Lai Đơn)", "Present Perfect (Thì Hiện Tại Hoàn Thành)", "Passive Voice (Câu Bị Động)"

TRANSCRIPT RULE: The "transcript" field must contain ONLY English or Thai — no Vietnamese inside it.`;


type ExamExample = { question: string; options: string[]; answer: number };
type GenerateRequest = { lessonType: string; language: string; level: string; topic?: string; examType?: string; weekNumber?: number; totalWeeks?: number; dayId?: string; examExamples?: ExamExample[] };

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

function buildPrompt({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, dayId, examExamples }: GenerateRequest): string {
  const langLabel = language === "english" ? "tiếng Anh" : "tiếng Thái";

  // ── Detailed exam format specs ────────────────────────────────────────────
  const examContext: Record<string, string> = {
    TOEIC: `BỐI CẢNH: Ôn thi TOEIC L&R (ETS format).

TOEIC PART 5 — Incomplete Sentences (grammar/vocab quiz):
- Each question: one sentence with one blank, 4 options of THE SAME PART OF SPEECH or WORD FORM
- Distractors: same root word in different forms (submit/submits/submitted/submitting) OR near-synonyms that don't fit grammatically
- Topics: business email, contracts, HR policy, logistics, office procedures, financial reports
- Example: "The new policy requires all staff to _____ their expense reports by the 5th of each month." → (A) submit (B) submits (C) submitted (D) submitting
- NEVER use random everyday topics — always business/professional context

TOEIC PART 6 — Text Completion (reading quiz):
- Short business text (email/memo/notice) with 4 blanks → each blank has 4 options
- Text types: internal memo, email thread, announcement, advertisement, form

TOEIC PART 7 — Reading Comprehension (reading passage & quiz):
- Text types: single passage (email, article, notice, advertisement, form) or double/triple passage
- Q types: main purpose ("What is the purpose of this email?"), specific detail ("According to the notice, when will..."), inference ("What can be inferred about..."), vocabulary in context ("The word 'expedite' in paragraph 2 is closest in meaning to..."), NOT GIVEN type
- Passage MUST include: date, sender/recipient (for emails), formal business tone
- Word count: 150-200 words for single passage

TOEIC LISTENING (listening transcript & quiz):
- Part 1: photo description — short statements about what's in a picture
- Part 2: question-response — one question + short answer
- Part 3: short conversation between 2-3 people in business setting (32 exchanges minimum)
- Part 4: monologue — announcement, voicemail, advertisement, news report
- Transcript must sound natural, use contractions, hesitations for realism`,

    IELTS: `BỐI CẢNH: Ôn thi IELTS Academic (British Council/IDP format).

IELTS READING (Academic):
- Text types: academic article, scientific report, journal excerpt — formal register
- Q types: True/False/Not Given, Matching headings, Multiple choice, Short answer, Sentence completion
- Passage: 700-900 words (in real test), for lesson use 180-220 words with 3-4 paragraphs

IELTS LISTENING:
- Section 1: conversation between 2 speakers, everyday social context (e.g. booking, enquiry)
- Section 2: monologue, everyday social context (e.g. tour guide, announcement)
- Section 3: conversation up to 4 speakers, educational context (e.g. seminar, tutorial)
- Section 4: academic lecture/talk — formal vocabulary, complex ideas
- Q types: form completion, note completion, multiple choice, matching

IELTS WRITING:
- Task 1: describe visual data (graph, chart, diagram, map) — 150+ words, objective tone, no personal opinion
- Task 2: argumentative/discursive essay — 250+ words, clear position, 4-5 paragraphs structure

IELTS SPEAKING:
- Part 1: personal questions about familiar topics (2-4 minutes)
- Part 2: individual long turn — describe something using cue card (1-2 minutes)
- Part 3: two-way discussion, abstract topics related to Part 2 theme (4-5 minutes)`,

    general: `Bài học theo khung CEFR tổng quát, tập trung giao tiếp thực tế và ngữ pháp nền tảng.`,
  };
  const examNote = examType && examContext[examType] ? `\n${examContext[examType]}\n` : "";

  // ── Inject real exam examples from DB ─────────────────────────────────────
  let examplesSection = "";
  if (examExamples && examExamples.length > 0) {
    const formatted = examExamples.map((ex, i) =>
      `Example ${i + 1}:\nQ: "${ex.question}"\nOptions: ${ex.options.map((o, idx) => `(${String.fromCharCode(65 + idx)}) ${o}`).join(" | ")}\nAnswer: (${String.fromCharCode(65 + ex.answer)}) ${ex.options[ex.answer]}`
    ).join("\n\n");
    examplesSection = `\n=== REAL ${examType} QUESTIONS — Model your quiz questions EXACTLY on this style, difficulty, and format ===\n${formatted}\n`;
  }

  // Per-lesson-type quiz specification
  const quizSpecs: Record<string, string> = {
    grammar: `GRAMMAR QUIZ — 6 questions, ALL written in English, testing ONLY the grammar point "${topic ?? "this lesson"}":
- Q1: Fill-in-blank: "She ___ (go) to the meeting tomorrow." → 4 verb form options in English
- Q2: Fill-in-blank: another sentence using the same grammar point → 4 English options
- Q3: "Which sentence is grammatically correct?" → 4 complete English sentences (only 1 correct)
- Q4: "Identify the error: [incorrect English sentence]" → 4 corrected English sentences (1 correct)
- Q5: "Choose the sentence that expresses [usage case of this grammar]" → 4 English sentences
- Q6: "Which sentence correctly uses [grammar point] in a real-life situation?" → 4 English sentences
ALL questions and options in English. Zero Vietnamese in questions or options.`,

    vocabulary: `VOCABULARY QUIZ — 6 questions testing the 10 words from this lesson:
- Q1-Q3: Fill-in-blank in English: "The accountant prepared the ___ for the client." → 4 English word options from lesson vocabulary
- Q4-Q5: "Which sentence uses [word] correctly?" → 4 complete English sentences
- Q6: "What does '[word from lesson]' mean?" → 4 Vietnamese meaning options (this is the ONLY Vietnamese question)
Questions Q1-Q5 written in English. Q6 written in English too, only options in Vietnamese.`,

    reading: `READING QUIZ — 6 questions about the passage content (remember: the passage itself must be 100% English/Thai):
- Q1-Q3: Comprehension questions in Vietnamese asking about passage content → options in English (phrases/sentences from or about the passage)
- Q4: Vocabulary question in English: "In the passage, '[word]' most likely means..." → 4 English options
- Q5: Inference question in Vietnamese → options in English sentences
- Q6: Main idea question in Vietnamese → options in English phrases`,

    listening: `LISTENING QUIZ — 6 questions about the transcript:
- Q1-Q3: Comprehension questions in Vietnamese → options in English (words/phrases from the transcript)
- Q4: "What does '[speaker]' say about...?" (Vietnamese question) → options in English
- Q5: Vocabulary/phrase question in English from key_phrases → 4 English options
- Q6: Purpose/tone question in Vietnamese → options in English phrases`,

    speaking: `SPEAKING QUIZ — 6 questions in English testing the phrases from this lesson:
- Q1-Q2: "Which phrase is most appropriate when [situation]?" → 4 English phrase options
- Q3-Q4: Fill-in-blank with the correct phrase from the lesson → 4 English options
- Q5: "What does '[phrase from lesson]' mean?" → 4 Vietnamese options
- Q6: "In which situation would you use '[phrase]'?" → 4 English situational options`,

    writing: `WRITING QUIZ — 6 questions about writing skills:
- Q1-Q3: Questions in English testing sentence structure and vocabulary from this lesson → English options
- Q4: Fill-in-blank with correct linking word/phrase → English options
- Q5: "Which paragraph structure is correct for this writing type?" → English options
- Q6: "What does '[useful phrase]' mean?" → 4 Vietnamese options`,

    review: `REVIEW QUIZ — 6 mixed questions in English reviewing the week's grammar and vocabulary:
- Q1-Q2: Grammar fill-in-blank in English → English options
- Q3-Q4: Vocabulary usage in English sentences → English options
- Q5: "Which sentence uses [this week's grammar] correctly?" → English options
- Q6: "What does '[vocabulary word]' mean?" → Vietnamese meaning options`,
  };

  const quizRequirements = quizSpecs[lessonType] ?? quizSpecs.vocabulary;

  const schemas: Record<string, string> = {
    vocabulary: `{
  "title": "string — English topic name + Vietnamese (e.g. 'Finance & Banking Vocabulary (Từ vựng Tài chính & Ngân hàng)', 'Office Equipment (Từ vựng Đồ dùng Văn phòng)')",
  "words": [
    {
      "word": "string — từ gốc",
      "phonetic": "string — phiên âm IPA",
      "meaning": "string — nghĩa tiếng Việt chính xác",
      "example": "string — 1 complete example sentence in English/Thai ONLY (no Vietnamese inside the sentence), relevant to the topic",
      "example_vi": "string — dịch nghĩa câu ví dụ sang tiếng Việt"
    }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU words: Tạo ĐÚNG 10 từ vựng thuộc CHỦ ĐỀ "${topic ?? "chủ đề bài học"}" ở trình độ ${level}.
- Mỗi từ PHẢI thực sự thuộc chủ đề đó — KHÔNG dùng từ chung chung (hello, good, very...) không liên quan đến chủ đề
- Chọn từ đặc trưng nhất, hữu ích nhất cho chủ đề này (danh từ chuyên ngành, động từ đặc trưng, tính từ miêu tả...)
- Mỗi câu ví dụ phải hoàn chỉnh, tự nhiên, đặt từ đó vào ngữ cảnh thực tế của chủ đề
- ${weekNumber ? `Đây là tuần ${weekNumber} — chọn từ khó hơn so với tuần đầu, không trùng lặp với từ vựng cơ bản đã học` : ""}`,

    grammar: `{
  "title": "string — English grammar term first, Vietnamese in parentheses (e.g. 'Simple Future Tense (Thì Tương Lai Đơn)', 'Present Perfect (Thì Hiện Tại Hoàn Thành)', 'Passive Voice (Câu Bị Động)')",
  "explanation": "string — giải thích ngữ pháp chi tiết BẰNG TIẾNG VIỆT theo cấu trúc markdown sau:\n## 1. Khi nào dùng?\n(Liệt kê 3-4 trường hợp sử dụng chính, mỗi trường hợp có 1 câu ví dụ kèm dịch nghĩa)\n\n## 2. Cấu trúc câu\n| Loại câu | Công thức | Ví dụ | Dịch nghĩa |\n|----------|-----------|-------|-----------|\n(Tạo bảng đầy đủ: Khẳng định / Phủ định / Câu hỏi Yes-No / Câu hỏi Wh-)\n\n## 3. Từ/dấu hiệu nhận biết\n(Liệt kê 5-7 signal words thường gặp, mỗi cái có 1 ví dụ ngắn + dịch)\n\n## 4. Ví dụ tình huống thực tế\n(Viết 4 câu ví dụ đa dạng tình huống, in đậm phần ngữ pháp trọng tâm, kèm dịch nghĩa tiếng Việt)\n\n## 5. Lỗi thường gặp ❌→✅\n(Liệt kê 3 lỗi sai phổ biến, mỗi lỗi: câu sai → câu đúng → giải thích ngắn)",
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}`,

    reading: `{
  "title": "string — specific English/Thai article title (e.g. 'The Rise of Remote Work', 'Climate Change and Agriculture')",
  "passage": "string — 180-220 word reading passage written 100% in English/Thai. ABSOLUTELY NO Vietnamese inside this field — not a single Vietnamese word, no translations in parentheses, no notes. Write natural, flowing English/Thai prose only. Include at least 3 clear paragraphs. Use the lesson vocabulary naturally in context.",
  "vocab_highlight": [
    { "word": "string — difficult word from the passage (English/Thai)", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
YÊU CẦU: vocab_highlight có 4-5 từ quan trọng từ đoạn văn. Quiz 6 câu kiểm tra hiểu ý chính, chi tiết, từ vựng trong bài, và suy luận.`,

    listening: `{
  "title": "string — tên bài nghe cụ thể",
  "context": "string — mô tả tình huống bằng tiếng Việt (ai đang nói, ở đâu, về chủ đề gì)",
  "transcript": "string — CRITICAL FORMAT: each speaker turn MUST be on its own line separated by \\n. Use real speaker names (John, Emily, Manager, etc.) not just A/B. Example value: 'John: Good morning, everyone.\\nEmily: Good morning! Are we ready to start?\\nJohn: Yes, let us begin with the agenda.\\nDavid: I have a quick question first.' — minimum 150 words total, natural spoken English/Thai only, NO Vietnamese inside transcript",
  "key_phrases": [
    { "phrase": "string — cụm từ quan trọng trong transcript", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0 }]
}
TRANSCRIPT REQUIREMENT: The transcript MUST use \\n to separate each speaker turn — never write all turns as one continuous paragraph. If there are 3 speakers (John, Emily, David), the UI will automatically assign each a different voice. Minimum 8 speaker turns for dialogue, minimum 150 words.
key_phrases: 4-5 cụm quan trọng từ transcript.`,

    writing: `{
  "title": "string — tên bài viết cụ thể",
  "prompt": "string — đề bài viết rõ ràng bằng tiếng Việt, nêu rõ yêu cầu (viết gì, bao nhiêu từ, cho ai)",
  "structure": [
    { "part": "string — tên phần (Mở bài / Thân bài 1 / Thân bài 2 / Kết bài)", "guide": "string — hướng dẫn viết phần đó bằng tiếng Việt" }
  ],
  "useful_phrases": ["string — cụm từ hữu ích (song ngữ Anh – Việt)"],
  "example": "string — complete sample writing (80-120 words) in English/Thai ONLY — zero Vietnamese inside the writing sample itself",
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
  // Include dayId as a unique seed so each roadmap day gets fresh AI content (not cached repeat)
  const uniqueSeed = dayId ? `\nMÃ BÀI HỌC DUY NHẤT: ${dayId.slice(-8)} — tạo nội dung HOÀN TOÀN MỚI, không lặp lại bài trước.\n` : "";
  const topicLine = topic ? `CHỦ ĐỀ BÀI HỌC: "${topic}"\n${uniqueSeed}` : uniqueSeed;

  // Week-based difficulty context
  let weekContext = "";
  if (weekNumber && totalWeeks) {
    const pct = Math.round((weekNumber / totalWeeks) * 100);
    if (pct <= 25) {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn đầu – xây nền tảng, giải thích kỹ, ví dụ đơn giản và rõ ràng).\n`;
    } else if (pct <= 60) {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn giữa – nâng độ phức tạp, thêm ngoại lệ, tình huống thực tế đa dạng).\n`;
    } else {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn cuối – nội dung nâng cao, câu phức, học thuật/thi cử, quiz khó).\n`;
    }
  }

  return `Create a ${lessonType} lesson in ${langLabel} for CEFR level ${level}.
${topicLine}${weekContext}${examNote}${examplesSection}
=== QUIZ SPECIFICATION (follow exactly) ===
${quizRequirements}

=== CONTENT QUALITY ===
- Every example sentence must be complete and natural, not a fragment
- Every English/Thai sentence must have a Vietnamese translation alongside
- Depth must be enough that the learner genuinely understands after one read
- Difficulty must match level ${level} precisely

Return valid JSON matching the schema below. NO text outside the JSON object:

${schema}`;
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

  // Resolve lesson ID: roadmap days use day_<id>, free practice uses type_lang_level
  const resolvedLessonId = dayId ? `day_${dayId}` : `${lessonType}_${language}_${level}`;

  // Upsert placeholder lesson
  const lesson = await prisma.lesson.upsert({
    where: { id: resolvedLessonId },
    update: {},
    create: {
      id: resolvedLessonId,
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

// ── ETS quiz replacement ───────────────────────────────────────────────────

/**
 * Try to find 6 real ETS questions for this lesson type + topic.
 * Returns null if not enough questions exist (AI quiz will be used instead).
 */
async function getETSQuiz(
  examType: string | undefined,
  lessonType: string,
  topic?: string,
  level?: string
): Promise<{ q: string; options: string[]; answer: number }[] | null> {
  if (!examType || (examType !== "TOEIC" && examType !== "IELTS")) return null;

  // Map lesson type → ETS question type
  const typeMap: Record<string, string[]> = {
    grammar: ["grammar"],
    vocabulary: ["vocabulary"],
    reading: ["reading"],
    listening: ["listening"],
    review: ["grammar", "vocabulary"],
  };
  const types = typeMap[lessonType];
  if (!types) return null;

  // Extract keywords from topic for grammarPoint matching
  const topicKeywords = topic
    ? topic
        .toLowerCase()
        .replace(/[()]/g, " ")
        .split(/[\s,_-]+/)
        .filter((w) => w.length > 3)
    : [];

  const baseWhere = {
    exam: examType,
    type: { in: types },
    answer: { gte: 0 }, // exclude unanswered (-1)
    ...(level ? { level } : {}),
  };

  // 1. Try topic-matched + exact level
  if (topicKeywords.length > 0) {
    const topicMatched = await prisma.examQuestion.findMany({
      where: {
        ...baseWhere,
        OR: topicKeywords.map((kw) => ({
          grammarPoint: { contains: kw, mode: "insensitive" as const },
        })),
      },
      take: 6,
      orderBy: { createdAt: "asc" },
    });
    if (topicMatched.length >= 10) {
      return topicMatched.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
    }
  }

  // 2. Any questions of this type at exact level
  const levelMatched = await prisma.examQuestion.findMany({
    where: baseWhere,
    take: 10,
    orderBy: { createdAt: "asc" },
  });
  if (levelMatched.length >= 10) {
    return levelMatched.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
  }

  // 3. Fallback: ignore level (use any available — better than AI-generated for ETS exams)
  const fallback = await prisma.examQuestion.findMany({
    where: { exam: examType, type: { in: types }, answer: { gte: 0 } },
    take: 10,
    orderBy: { createdAt: "asc" },
  });
  if (fallback.length >= 10) {
    return fallback.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
  }

  return null; // not enough — AI generates quiz
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

async function fetchExamExamples(examType: string | undefined, lessonType: string): Promise<ExamExample[]> {
  if (!examType || (examType !== "TOEIC" && examType !== "IELTS")) return [];
  try {
    const rows = await prisma.examQuestion.findMany({
      where: { exam: examType, type: lessonType },
      take: 3,
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({ question: r.question, options: r.options, answer: r.answer }));
  } catch {
    return [];
  }
}

/** Generate lesson content via AI, then replace quiz with real ETS questions if available. */
async function generateLessonContent(req: GenerateRequest): Promise<Record<string, unknown>> {
  const lesson = await callAI(buildPrompt(req));
  const etsQuiz = await getETSQuiz(req.examType, req.lessonType, req.topic, req.level);
  if (etsQuiz) {
    lesson.quiz = etsQuiz;
    lesson._quizSource = "ETS"; // flag for debugging
  }
  return lesson;
}

export async function generateLesson(lessonType: string, language: string, level: string, topic?: string, userId?: string, examType?: string, weekNumber?: number, totalWeeks?: number, dayId?: string) {
  if (!lessonType || !language || !level) throw new Error("Missing fields");
  const examExamples = await fetchExamExamples(examType, lessonType);

  // Roadmap day lesson: each day gets its own unique cached content
  if (dayId) {
    const dayLessonId = `day_${dayId}`;

    // Return cached lesson unless user already completed it (then generate fresh variant)
    const alreadyCompleted = userId
      ? await prisma.lessonProgress.findFirst({ where: { userId, lessonId: dayLessonId } })
      : null;

    if (!alreadyCompleted) {
      const existing = await prisma.lesson.findUnique({ where: { id: dayLessonId } });
      if (existing && existing.content !== "{}") {
        try { return JSON.parse(existing.content); } catch { /* fall through to generate */ }
      }
    }

    if (!process.env.GROQ_API_KEY) {
      const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
      err.code = "NO_API_KEY";
      throw err;
    }

    const lesson = await generateLessonContent({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, dayId, examExamples });

    if (!alreadyCompleted) {
      await prisma.lesson.upsert({
        where: { id: dayLessonId },
        update: { content: JSON.stringify(lesson), title: String(lesson.title ?? dayLessonId) },
        create: { id: dayLessonId, language, type: lessonType, level, title: String(lesson.title ?? dayLessonId), content: JSON.stringify(lesson), xpReward: 15 },
      });
    }
    return lesson;
  }

  // Topic-based lesson: unique ID per topic, skip fallback chain
  if (topic) {
    const slug = topicToSlug(topic);
    const examSuffix = examType && examType !== "general" ? `_${examType.toLowerCase()}` : "";
    const topicId = `${lessonType}_${language}_${level}_${slug}${examSuffix}`;

    const alreadyCompleted = userId
      ? await prisma.lessonProgress.findFirst({ where: { userId, lessonId: topicId } })
      : null;

    if (!alreadyCompleted) {
      const existing = await prisma.lesson.findUnique({ where: { id: topicId } });
      if (existing && existing.content !== "{}") {
        try {
          const cached = JSON.parse(existing.content);
          // Replace quiz with ETS questions if available (even for cached lessons)
          const etsQuiz = await getETSQuiz(examType, lessonType, topic, level);
          if (etsQuiz) cached.quiz = etsQuiz;
          return cached;
        } catch { /* fall through to generate */ }
      }
    }

    if (!process.env.GROQ_API_KEY) {
      const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
      err.code = "NO_API_KEY";
      throw err;
    }

    const lesson = await generateLessonContent({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, examExamples });

    if (!alreadyCompleted) {
      await prisma.lesson.upsert({
        where: { id: topicId },
        update: { content: JSON.stringify(lesson), title: String(lesson.title ?? topicId) },
        create: { id: topicId, language, type: lessonType, level, title: String(lesson.title ?? topicId), content: JSON.stringify(lesson), xpReward: 15 },
      });
    }
    return lesson;
  }

  // No topic: seeded lesson
  const lessonId = `${lessonType}_${language}_${level}`;
  const exact = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (exact && exact.content !== "{}") {
    try {
      const cached = JSON.parse(exact.content);
      const etsQuiz = await getETSQuiz(examType, lessonType, undefined, level);
      if (etsQuiz) cached.quiz = etsQuiz;
      return cached;
    } catch { /* fall through */ }
  }

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

  const anyLesson = await prisma.lesson.findFirst({ where: { language, content: { not: "{}" } } });
  if (anyLesson) {
    try { return JSON.parse(anyLesson.content); } catch { /* fall through */ }
  }

  if (!process.env.GROQ_API_KEY) {
    const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
    err.code = "NO_API_KEY";
    throw err;
  }

  const lesson = await generateLessonContent({ lessonType, language, level, examExamples });
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: { content: JSON.stringify(lesson), title: String(lesson.title ?? lessonId) },
    create: { id: lessonId, language, type: lessonType, level, title: String(lesson.title ?? lessonId), content: JSON.stringify(lesson), xpReward: 15 },
  });
  return lesson;
}
