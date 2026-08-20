import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateLesson } from "@/services/lesson.service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isModelGoneError, MODEL_GONE_MESSAGE, MODEL_QUALITY } from "@/lib/ai-models";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = enforceRateLimit(session.user.id, "lessonGenerate");
  if (limited) return limited;

  const { lessonType, language, level, topic, examType, weekNumber, totalWeeks, dayId, scriptMode } = await req.json();
  try {
    const lesson = await generateLesson(lessonType, language, level, topic, session.user.id, examType, weekNumber, totalWeeks, dayId, scriptMode);
    // The provider markers are non-enumerable on the lesson object so they never get
    // written into the cached JSON — copy them onto the response explicitly so the UI
    // can tell the learner when Groq was down and a fallback answered.
    const meta = lesson as { _aiProvider?: string; _aiFellBack?: boolean };
    return NextResponse.json({
      ...lesson,
      ...(meta._aiFellBack ? { _aiProvider: meta._aiProvider, _aiFellBack: true } : {}),
    });
  } catch (e) {
    const err = e as Error & { code?: string; status?: number };
    if (err.code === "NO_API_KEY") return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    // Groq retires models without notice — say so plainly instead of "thử lại sau",
    // which sends people hunting for an outage that isn't there.
    if (isModelGoneError(err)) {
      console.error(`[lessons/generate] model "${MODEL_QUALITY}" no longer exists on Groq`);
      return NextResponse.json({ error: MODEL_GONE_MESSAGE, code: "MODEL_GONE" }, { status: 503 });
    }
    if (err.message === "Missing fields") return NextResponse.json({ error: err.message }, { status: 400 });
    if (err.status === 429 || err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Too Many Requests")) {
      return NextResponse.json({ error: "Đang quá tải, thử lại sau vài giây." }, { status: 429 });
    }
    if (err.status === 401 || err.message?.includes("API key") || err.message?.includes("API_KEY_INVALID")) {
      console.error("[lessons/generate] auth error – check GROQ_API_KEY in .env.local");
      return NextResponse.json({ error: "API key không hợp lệ. Kiểm tra cấu hình server." }, { status: 503 });
    }
    console.error("[lessons/generate]", err);
    return NextResponse.json({ error: "Không thể tạo bài học. Thử lại sau." }, { status: 500 });
  }
}
