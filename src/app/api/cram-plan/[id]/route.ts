import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCramPlanById, deleteCramPlan, CramPlanError } from "@/services/cram-plan.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const plan = await getCramPlanById(session.user.id, id);
    return NextResponse.json({ plan });
  } catch (e) {
    if (e instanceof CramPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteCramPlan(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CramPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
