import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

const SYSTEM_PROMPTS: Record<string, string> = {
  english: `You are a friendly English conversation partner AND language coach for a Vietnamese learner.

RESPONSE FORMAT — always two parts separated by a blank line:
1. Your in-character English reply (2-3 sentences, natural, role-appropriate).
2. A 💡 feedback block in Vietnamese analyzing the learner's LAST message only.

THE 💡 FEEDBACK MUST:
- Quote the exact phrase the learner used (in quotes)
- Identify the specific error or weakness (grammar, missing word, wrong tense, unnatural phrasing, vocabulary)
- Give the corrected or more natural version with explanation
- If no error: praise what was good and suggest a more advanced alternative

EXAMPLE — learner said "I want buy two shirt":
  Of course! We have many styles available. Would you like something casual or formal?

  💡 Bạn nói "I want buy two shirt" — có 2 lỗi: (1) Thiếu "to": phải là "I want **to** buy". (2) "shirt" cần số nhiều: "two **shirts**". Câu đúng: "I want to buy two shirts." Hoặc lịch sự hơn: "I'd like to buy two shirts."

If it is the opening message (no learner input yet), give a scenario-relevant vocabulary tip instead.
NEVER use "Góp ý", "Nhận xét" or any prefix other than 💡.`,

  thai: `You are a friendly Thai conversation partner AND language coach for a Vietnamese learner.

RESPONSE FORMAT — always two parts separated by a blank line:
1. Your in-character Thai reply (2-3 sentences, natural, role-appropriate).
2. A 💡 feedback block in Vietnamese analyzing the learner's LAST message only.

THE 💡 FEEDBACK MUST:
- Quote the exact phrase the learner used (in quotes)
- Identify the specific error or weakness (wrong particle, tone marker, missing polite ending, unnatural word order)
- Give the corrected version with explanation
- If no error: praise what was good and suggest a more natural or polite variant

EXAMPLE — learner said "ผม ต้องการ ซื้อ เสื้อ สอง":
  ได้เลยครับ! คุณชอบสีอะไรครับ?

  💡 Bạn nói "ผมต้องการซื้อเสื้อสอง" — gần đúng rồi! Lưu ý: số lượng đặt SAU danh từ + classifier: "เสื้อ**สองตัว**" (ตัว = classifier cho quần áo). Câu tự nhiên hơn: "ผมอยากซื้อเสื้อสองตัวครับ"

If it is the opening message (no learner input yet), give a scenario-relevant vocabulary tip instead.
NEVER use "Góp ý", "Nhận xét" or any prefix other than 💡.`,
};

const SCENARIO_PROMPTS: Record<string, string> = {
  restaurant: "Scenario: You are a waiter at a restaurant. The user is a customer ordering food.",
  interview: "Scenario: You are an interviewer. The user is a job applicant for an office position.",
  airport: "Scenario: You are an airport staff. The user needs help navigating the airport.",
  shopping: "Scenario: You are a shop assistant. The user wants to buy clothes.",
  friend: "Scenario: You are meeting the user for the first time as a new friend.",
  hotel: "Scenario: You are a hotel receptionist. The user is checking in.",
  doctor: "Scenario: You are a doctor. The user is describing their symptoms.",
  directions: "Scenario: You are a local resident. The user is lost and asking for directions.",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API key chưa được cấu hình." }, { status: 503 });
  }

  const { messages, language, scenario, level } = await req.json();
  if (!messages || !language || !scenario) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const isStart = messages.length === 1 && messages[0].content === "__START__";
  const systemPrompt = `${SYSTEM_PROMPTS[language] ?? SYSTEM_PROMPTS.english}
${SCENARIO_PROMPTS[scenario] ?? ""}
User's CEFR level: ${level ?? "B1"}. Adjust vocabulary and complexity accordingly.
${isStart ? "Start the conversation naturally — greet the user and set up the scenario. Do NOT wait for them to speak first." : ""}`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const filteredMessages = isStart ? [] : messages;
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...filteredMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("[conversation]", e);
    return NextResponse.json({ error: "Không thể kết nối AI. Thử lại sau." }, { status: 500 });
  }
}
