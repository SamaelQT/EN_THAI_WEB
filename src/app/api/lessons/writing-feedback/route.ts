import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { writing, prompt, guide, language, level } = await req.json() as {
    writing: string;
    prompt: string;
    guide?: string;
    language: string;
    level: string;
  };

  if (!writing?.trim()) return NextResponse.json({ error: "Missing writing" }, { status: 400 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const langLabel = language === "english" ? "English" : language === "korean" ? "Korean" : "Thai";

  const evalPrompt = `You are a ${langLabel} writing teacher. Evaluate a Vietnamese learner's ${langLabel} writing at CEFR ${level} level.

Writing task: "${prompt}"
${guide ? `Writing guide: ${guide}` : ""}

Student's writing:
---
${writing}
---

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "feedback": "<2-3 sentence overall assessment in Vietnamese>",
  "strengths": ["<strength 1 in Vietnamese>", "<strength 2 in Vietnamese>"],
  "improvements": ["<improvement suggestion 1 in Vietnamese>", "<improvement suggestion 2 in Vietnamese>"],
  "corrections": [
    { "original": "<exact phrase/sentence from student's writing>", "corrected": "<corrected version>", "note": "<brief explanation in Vietnamese>" }
  ]
}

Scoring (add up to 100):
- Content & task completion: 30 pts
- Grammar accuracy: 30 pts
- Vocabulary range & accuracy: 20 pts
- Organization & coherence: 20 pts

Rules:
- corrections: max 3, only the most important errors; quote EXACTLY from the student's text
- If the student wrote very little (<20 words), score ≤ 30 and note they need to write more
- Be encouraging but honest — mention both what is good and what needs work
- All text in Vietnamese except the "corrected" field (which is in ${langLabel})`;

  const groq = new Groq({ apiKey });
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: evalPrompt }],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(result.choices[0]?.message?.content ?? "{}");
  return NextResponse.json(parsed);
}
