import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeLesson } from "@/services/lesson.service";

const LESSON_TYPES = ["vocabulary", "grammar", "reading", "listening", "speaking", "writing", "review", "pronunciation"];
const LANGUAGES = ["english", "thai", "korean"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const lessonType = String(body.lessonType ?? "");
  const language = String(body.language ?? "");
  const level = String(body.level ?? "");

  if (!LESSON_TYPES.includes(lessonType) || !LANGUAGES.includes(language) || !level) {
    return NextResponse.json({ error: "Invalid lesson data" }, { status: 400 });
  }

  // Score and time come from the browser — clamp them so a tampered request can't
  // write nonsense into the progress history.
  const rawScore = Number(body.score);
  const score = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 0;

  const rawTime = Number(body.timeSpent);
  const timeSpent = Number.isFinite(rawTime) && rawTime > 0
    ? Math.min(6 * 60 * 60, Math.round(rawTime)) // cap at 6h per lesson
    : undefined;

  const dayId = typeof body.dayId === "string" && body.dayId ? body.dayId : undefined;

  try {
    const result = await completeLesson(session.user.id, {
      lessonType, language, level, score, timeSpent, dayId,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[lessons/complete]", e);
    return NextResponse.json({ error: "Không lưu được kết quả. Thử lại sau." }, { status: 500 });
  }
}
