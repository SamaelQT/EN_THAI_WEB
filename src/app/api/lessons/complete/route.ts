import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completeLesson } from "@/services/lesson.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await completeLesson(session.user.id, body);
  return NextResponse.json(result);
}
