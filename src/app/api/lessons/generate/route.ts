import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. AI lesson generation will fail.");
}

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a language teaching assistant for Vietnamese learners studying English or Thai.
Generate lesson content as valid JSON only — no markdown, no extra text.
All explanations and instructions must be in Vietnamese.
Keep examples natural and practical for everyday use.`;

type GenerateRequest = {
  lessonType: string;
  language: string;
  level: string;
};

function buildPrompt({ lessonType, language, level }: GenerateRequest): string {
  const langLabel = language === "english" ? "tiếng Anh" : "tiếng Thái";

  const schemas: Record<string, string> = {
    vocabulary: `{
  "title": "Tên bài học",
  "words": [
    { "word": "từ gốc", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ" }
  ],
  "quiz": [
    { "q": "câu hỏi tiếng Việt", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    grammar: `{
  "title": "Tên bài học",
  "explanation": "Giải thích ngữ pháp bằng tiếng Việt, dùng ký hiệu markdown đơn giản",
  "quiz": [
    { "q": "câu hỏi", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    reading: `{
  "title": "Tên bài đọc",
  "passage": "Đoạn văn bản 150-200 từ phù hợp trình độ",
  "quiz": [
    { "q": "câu hỏi hiểu văn bản", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    listening: `{
  "title": "Luyện nghe – Mô phỏng",
  "transcript": "Đoạn hội thoại hoặc văn bản mô phỏng bài nghe",
  "context": "Mô tả tình huống bằng tiếng Việt",
  "quiz": [
    { "q": "câu hỏi về nội dung", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    writing: `{
  "title": "Luyện viết",
  "prompt": "Đề bài viết bằng tiếng Việt",
  "tips": ["gợi ý 1", "gợi ý 2", "gợi ý 3"],
  "example": "Bài viết mẫu ngắn",
  "quiz": [
    { "q": "câu hỏi về cấu trúc/từ vựng trong bài", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    speaking: `{
  "title": "Luyện nói",
  "topic": "Chủ đề nói chuyện",
  "phrases": [
    { "phrase": "câu mẫu", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt" }
  ],
  "dialogue": [
    { "speaker": "A", "text": "câu nói", "translation": "dịch nghĩa" }
  ],
  "quiz": [
    { "q": "câu hỏi", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
    review: `{
  "title": "Ôn tập tổng hợp",
  "summary": "Tóm tắt ngắn các điểm ngữ pháp và từ vựng quan trọng cần ôn lại ở trình độ này",
  "words": [
    { "word": "từ quan trọng cần nhớ", "phonetic": "phiên âm", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ" }
  ],
  "quiz": [
    { "q": "câu hỏi ôn tập tổng hợp", "options": ["A","B","C","D"], "answer": 0 }
  ]
}`,
  };

  const schema = schemas[lessonType] ?? schemas.vocabulary;
  const typeLabel = lessonType === "review" ? "ôn tập tổng hợp" : lessonType;

  return `Tạo một bài học ${typeLabel} về ${langLabel} cho trình độ ${level}.
Bài học phải phù hợp với trình độ ${level} theo khung CEFR, với 6 mục (words/phrases nếu có) và 3 câu hỏi quiz.
Trả về JSON hợp lệ theo schema sau, không có gì thêm:

${schema}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: GenerateRequest = await req.json();
  const { lessonType, language, level } = body;

  if (!lessonType || !language || !level) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check DB cache first
  const lessonId = `${lessonType}_${language}_${level}`;
  const cached = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (cached && cached.content !== "{}") {
    try {
      return NextResponse.json(JSON.parse(cached.content));
    } catch {
      // corrupted cache — fall through to regenerate
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(body) }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const lesson = JSON.parse(cleaned);

    // Persist to DB so future requests skip generation
    await prisma.lesson.upsert({
      where: { id: lessonId },
      update: { content: JSON.stringify(lesson), title: lesson.title ?? lessonId },
      create: {
        id: lessonId,
        language,
        type: lessonType,
        level,
        title: lesson.title ?? lessonId,
        content: JSON.stringify(lesson),
        xpReward: 15,
      },
    });

    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "Invalid AI response", raw }, { status: 500 });
  }
}
