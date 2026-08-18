import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordQuizAttempts, getWrongAnswerQueue } from "@/services/analytics.service";
import { rateLimit } from "@/lib/rate-limit";

const LANGUAGES = ["english", "thai", "korean"];

/** POST — log the answers of a finished quiz (fire-and-forget from the client). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Writes one row per question — keep a lid on how often a client can push batches
  const limited = rateLimit(`attempts:${session.user.id}`, 40, 10 * 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const language = String(body.language ?? "");
  if (!LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }
  if (!Array.isArray(body.attempts)) {
    return NextResponse.json({ error: "attempts must be an array" }, { status: 400 });
  }

  try {
    const saved = await recordQuizAttempts({
      userId: session.user.id,
      language,
      source: String(body.source ?? "lesson"),
      lessonId: typeof body.lessonId === "string" ? body.lessonId : null,
      lessonType: typeof body.lessonType === "string" ? body.lessonType : null,
      level: typeof body.level === "string" ? body.level : null,
      topic: typeof body.topic === "string" ? body.topic : null,
      attempts: body.attempts as never,
    });
    return NextResponse.json({ saved });
  } catch (e) {
    console.error("[quiz-attempts]", e);
    return NextResponse.json({ error: "Không lưu được kết quả chi tiết" }, { status: 500 });
  }
}

/** GET — questions the learner is still getting wrong, for the redo queue. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const language = new URL(req.url).searchParams.get("language") ?? "english";
  if (!LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const questions = await getWrongAnswerQueue(session.user.id, language);
  return NextResponse.json({ questions });
}
