import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateLesson } from "@/services/lesson.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonType, language, level, topic, examType } = await req.json();
  try {
    const lesson = await generateLesson(lessonType, language, level, topic, session.user.id, examType);
    return NextResponse.json(lesson);
  } catch (e) {
    const err = e as Error & { code?: string; status?: number };
    if (err.code === "NO_API_KEY") return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    if (err.message === "Missing fields") return NextResponse.json({ error: err.message }, { status: 400 });
    if (err.status === 429 || err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Too Many Requests")) {
      return NextResponse.json({ error: "Đang quá tải, thử lại sau vài giây." }, { status: 429 });
    }
    if (err.status === 401 || err.message?.includes("API key") || err.message?.includes("API_KEY_INVALID")) {
      console.error("[lessons/generate] Gemini auth error – check GEMINI_API_KEY in .env.local");
      return NextResponse.json({ error: "API key không hợp lệ. Kiểm tra cấu hình server." }, { status: 503 });
    }
    console.error("[lessons/generate]", err);
    return NextResponse.json({ error: "Không thể tạo bài học. Thử lại sau." }, { status: 500 });
  }
}
