import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createCramPlan, listCramPlans, CramPlanError } from "@/services/cram-plan.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await listCramPlans(session.user.id);
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = enforceRateLimit(session.user.id, "cramPlanGenerate");
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const plan = await createCramPlan(session.user.id, {
      language: String(body.language ?? ""),
      goalType: body.goalType as never,
      goalLabel: String(body.goalLabel ?? ""),
      examType: typeof body.examType === "string" ? body.examType : null,
      level: typeof body.level === "string" ? body.level : undefined,
      skills: Array.isArray(body.skills) ? (body.skills as never) : [],
      targetAt: String(body.targetAt ?? ""),
      availableMinutes: Number(body.availableMinutes),
    });
    return NextResponse.json({ plan });
  } catch (e) {
    if (e instanceof CramPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[cram-plan/create]", e);
    return NextResponse.json({ error: "Không tạo được kế hoạch. Thử lại sau." }, { status: 500 });
  }
}
