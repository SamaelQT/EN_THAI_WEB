import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type QuestionInput = {
  exam: string;
  part: string;
  type: string;
  level: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  source?: string;
};

function validateQuestion(q: unknown, index: number): string | null {
  if (!q || typeof q !== "object") return `[${index}] Not an object`;
  const o = q as Record<string, unknown>;
  if (!["TOEIC", "IELTS"].includes(o.exam as string)) return `[${index}] exam must be TOEIC or IELTS`;
  if (!o.part || typeof o.part !== "string") return `[${index}] Missing part`;
  if (!o.type || typeof o.type !== "string") return `[${index}] Missing type`;
  if (!o.level || typeof o.level !== "string") return `[${index}] Missing level`;
  if (!o.question || typeof o.question !== "string") return `[${index}] Missing question`;
  if (!Array.isArray(o.options) || o.options.length !== 4) return `[${index}] options must be array of 4`;
  if (typeof o.answer !== "number" || (o.answer !== -1 && (o.answer < 0 || o.answer > 3))) return `[${index}] answer must be 0-3 (or -1 for unknown)`;
  return null;
}

// GET: list questions (filterable)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exam = searchParams.get("exam") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const part = searchParams.get("part") ?? undefined;

  const questions = await prisma.examQuestion.findMany({
    where: {
      ...(exam ? { exam } : {}),
      ...(type ? { type } : {}),
      ...(part ? { part } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const stats = await prisma.examQuestion.groupBy({
    by: ["exam", "type"],
    _count: { id: true },
  });

  return NextResponse.json({ questions, stats });
}

// POST: upload batch
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const questions: unknown[] = Array.isArray(body) ? body : body.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Expected array of questions" }, { status: 400 });
  }

  // Validate all before inserting any
  const errors: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    const err = validateQuestion(questions[i], i + 1);
    if (err) errors.push(err);
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  const data = (questions as QuestionInput[]).map((q) => ({
    exam: q.exam,
    part: q.part,
    type: q.type,
    level: q.level,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation ?? null,
    source: q.source ?? null,
  }));

  await prisma.examQuestion.createMany({ data });

  return NextResponse.json({ success: true, inserted: data.length });
}

// DELETE: clear by exam (for re-upload)
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exam = searchParams.get("exam");
  const type = searchParams.get("type");

  if (!exam) return NextResponse.json({ error: "exam param required" }, { status: 400 });

  const result = await prisma.examQuestion.deleteMany({
    where: { exam, ...(type ? { type } : {}) },
  });

  return NextResponse.json({ deleted: result.count });
}
