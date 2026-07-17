import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      ? "Questions and options in Korean (with brief Vietnamese note in explanation only)."
      : "Questions and options in Thai (with brief Vietnamese note in explanation only).";

  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `You are a ${langLabel} language teacher creating a COMPREHENSIVE CHECKPOINT QUIZ for Vietnamese learners.

The learner recently completed these ${topics.length} lessons:
${topicList}

Create exactly 10 quiz questions that REVIEW ALL the above lessons.
- Distribute: roughly 2 questions per lesson topic
- Mix question types: fill-in-blank, choose-correct-sentence, error-identification, vocabulary meaning
- Difficulty: CEFR ${level} — match what was studied in these lessons
- ${langNote}

Each question must clearly test ONE of the listed lessons above (record which in the "topic" field).

Return ONLY valid JSON, no markdown:
{
  "quiz": [
    {
      "q": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": 0,
      "topic": "which lesson title this tests (from the list above)"
    }
  ]
}

Rules:
- Exactly 10 questions
- Each question has exactly 4 options
- "answer" is 0-based index of the correct option
- NEVER prefix options with A) B) C) D) — the UI adds labels automatically
- Make distractors plausible but clearly wrong on reflection
- Spread questions across all topics — don't cluster on just 1-2 topics`;

  const groq = new Groq({ apiKey });
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0]?.message?.content ?? "{}") as {
    quiz?: { q: string; options: string[]; answer: number; topic?: string }[];
  };

  if (!parsed.quiz?.length) {
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }

  return NextResponse.json({ quiz: parsed.quiz });
}
