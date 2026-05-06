import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitPlacementTest, getPlacementTests } from "@/services/placement.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, score, answers, level, testType } = await req.json();
  try {
    const result = await submitPlacementTest(session.user.id, language, score, answers, level, testType);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const language = new URL(req.url).searchParams.get("language");
  const tests = await getPlacementTests(session.user.id, language);
  return NextResponse.json({ tests });
}
