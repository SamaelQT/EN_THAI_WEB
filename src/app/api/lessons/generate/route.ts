import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateLesson } from "@/services/lesson.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonType, language, level } = await req.json();
  try {
    const lesson = await generateLesson(lessonType, language, level);
    return NextResponse.json(lesson);
  } catch (e) {
    const err = e as Error & { code?: string };
    if (err.code === "NO_API_KEY") return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    if (err.message === "Missing fields") return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
  }
}
