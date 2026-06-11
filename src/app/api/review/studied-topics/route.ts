import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStudiedTopics } from "@/services/review.service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? "english";

  const topics = await getUserStudiedTopics(session.user.id, language);
  return NextResponse.json({ topics });
}
