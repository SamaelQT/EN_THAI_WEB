import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProgressReport } from "@/services/analytics.service";

const LANGUAGES = ["english", "thai", "korean"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? "english";
  const days = Math.min(180, Math.max(7, Number(searchParams.get("days")) || 30));

  if (!LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const report = await getProgressReport(session.user.id, language, days);
  return NextResponse.json({ report });
}
