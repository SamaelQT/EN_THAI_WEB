import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sanitizeQuiz } from "@/services/lesson.service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateJson } from "@/lib/ai-client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = enforceRateLimit(session.user.id, "quizGenerate");
  if (limited) return limited;

  const { topics, language, level } = await req.json() as {
    topics: string[];
    language: string;
    level: string;
  };

  if (!topics?.length || !language || !level) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const langLabel = language === "english" ? "English" : language === "korean" ? "Korean" : "Thai";
  const langNote =
    language === "english"
      ? "All questions and options in English. NEVER mix Vietnamese into options."
      : language === "korean"
      ? `Questions and options in Korean, written in REAL HANGUL (한글) characters only.
  ⚠️ FORBIDDEN: romanised Korean in questions or options ("annyeonghaseyo", "meogeoyo", "jeoneun").
  ⚠️ CORRECT: "다음 빈칸에 알맞은 것은?" with options ["먹어요", "마셔요", "자요", "가요"].
  Only the "explanation" field is in Vietnamese.`
      : "Questions and options in Thai (with brief Vietnamese note in explanation only).";

  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");
  // The number of questions scales with how much was studied, floor 12 / ceiling 20 —
  // a fixed 10-question checkpoint was too short to actually check a week of lessons.
  const questionCount = Math.min(20, Math.max(12, topics.length * 3));

  const prompt = `You are a ${langLabel} language teacher creating a COMPREHENSIVE CHECKPOINT QUIZ for Vietnamese learners.

The learner recently completed these ${topics.length} lessons:
${topicList}

Create exactly ${questionCount} quiz questions that REVIEW ALL the above lessons.
- Distribute evenly: every listed lesson must be tested by at least 2 questions
- Difficulty must RAMP UP: the first third easy recall, the middle third applied usage, the last third harder (multi-step, longer sentences, subtle distractors)
- MANDATORY FORMAT VARIETY — use every one of these shapes at least once, never the same shape more than 4 times:
  1. Fill-in-blank in a sentence
  2. "Which sentence is correct?" (4 full sentences)
  3. Error identification (spot the wrong part)
  4. Vocabulary meaning (options in Vietnamese)
  5. Short 2-line dialogue completion
  6. Sentence transformation (tense / negation / politeness / question form)
  7. Odd-one-out or closest-meaning (synonym)
  8. A mini reading item: 1-2 sentence context, then a comprehension question
- ${langNote}

Each question must clearly test ONE of the listed lessons above (record which in the "topic" field).

=== GIẢI THÍCH — BẮT BUỘC CHO MỌI CÂU ===
"explanation" (tiếng Việt, 2-4 câu): nêu quy tắc/nghĩa đang kiểm tra → chỉ ra dấu hiệu trong
chính câu hỏi khiến đáp án đó đúng → dịch nghĩa câu đúng sang tiếng Việt.
CẤM viết chung chung kiểu "Đáp án B đúng" hay "Vì đây là cách dùng đúng".

"why_wrong" (mảng đúng 4 phần tử, cùng thứ tự options):
- Vị trí đáp án đúng: chuỗi rỗng ""
- Mỗi vị trí sai: 1 câu tiếng Việt nói RÕ sai ở đâu và vì sao
  (VD: "'have' sai vì chủ ngữ 'She' số ít, phải dùng 'has'.")
- CẤM: "Đáp án này sai." / "Không phù hợp." / lặp cùng một câu cho nhiều phương án.

Return ONLY valid JSON, no markdown:
{
  "quiz": [
    {
      "q": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": 0,
      "explanation": "giải thích tiếng Việt vì sao đáp án đúng là đúng",
      "why_wrong": ["", "vì sao B sai", "vì sao C sai", "vì sao D sai"],
      "topic": "which lesson title this tests (from the list above)"
    }
  ]
}

Rules:
- Exactly ${questionCount} questions
- Each question has exactly 4 options
- "answer" is 0-based index of the correct option
- Spread the correct answers across positions 0-3 — do NOT put most answers at the same index
- NEVER prefix options with A) B) C) D) — the UI adds labels automatically
- Make distractors plausible but clearly wrong on reflection
- Spread questions across all topics — don't cluster on just 1-2 topics
- No two questions may be near-duplicates of each other`;

  let ai;
  try {
    ai = await generateJson({
      messages: [{ role: "user", content: prompt }],
      // Higher temperature so retaking the checkpoint doesn't return the same paper
      temperature: 0.9,
    });
  } catch {
    return NextResponse.json({ error: "Không kết nối được AI. Thử lại sau." }, { status: 503 });
  }

  let parsed: { quiz?: unknown };
  try {
    parsed = JSON.parse(ai.data || "{}");
  } catch {
    return NextResponse.json({ error: "AI trả về dữ liệu không hợp lệ. Thử lại." }, { status: 502 });
  }

  const quiz = sanitizeQuiz(parsed.quiz);
  // A checkpoint with only a couple of usable questions isn't worth showing
  if (quiz.length < 5) {
    return NextResponse.json({ error: "Không tạo được bài kiểm tra. Thử lại sau." }, { status: 502 });
  }

  return NextResponse.json({ quiz, ...(ai.fellBack ? { _aiProvider: ai.provider, _aiFellBack: true } : {}) });
}
