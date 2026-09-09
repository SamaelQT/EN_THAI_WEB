import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCramBlockLinkInfo, toggleCramBlockChecklist, CramPlanError } from "@/services/cram-plan.service";

/** GET — link info a block needs to launch its content. Read by LessonsClient on `?startBlock=`. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const link = await getCramBlockLinkInfo(session.user.id, id);
    return NextResponse.json({ link });
  } catch (e) {
    if (e instanceof CramPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PATCH — update which checklist items are ticked; recomputes the parent plan's status. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.checklistDone)) {
    return NextResponse.json({ error: "checklistDone phải là mảng boolean" }, { status: 400 });
  }

  try {
    const result = await toggleCramBlockChecklist(session.user.id, id, body.checklistDone);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CramPlanError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
