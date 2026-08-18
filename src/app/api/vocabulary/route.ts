import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addWords, listWords, getVocabStats } from "@/services/vocabulary.service";

const LANGUAGES = ["english", "thai", "korean"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? "english";
  const filter = searchParams.get("filter") === "due" ? "due" : "all";
  if (!LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const [items, stats] = await Promise.all([
    listWords(session.user.id, language, filter),
    getVocabStats(session.user.id, language),
  ]);
  return NextResponse.json({ items, stats });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (!Array.isArray(body.words)) {
    return NextResponse.json({ error: "words must be an array" }, { status: 400 });
  }

  try {
    const result = await addWords(session.user.id, language, body.words as never);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[vocabulary]", e);
    return NextResponse.json({ error: "Không lưu được từ vựng" }, { status: 500 });
  }
}
