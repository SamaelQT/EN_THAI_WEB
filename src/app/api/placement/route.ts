import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreToLevel } from "@/lib/placement-data";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { language, score, answers } = await req.json();

  if (!["english", "thai"].includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const level = scoreToLevel(score);

  const test = await prisma.placementTest.create({
    data: {
      userId: session.user.id,
      language,
      level,
      score,
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({ test, level, score });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const language = url.searchParams.get("language");

  const tests = await prisma.placementTest.findMany({
    where: {
      userId: session.user.id,
      ...(language ? { language } : {}),
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json({ tests });
}
