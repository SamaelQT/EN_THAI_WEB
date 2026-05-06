import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBusyDays, RoadmapServiceError } from "@/services/roadmap.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { busyDays } = await req.json();

  if (!Array.isArray(busyDays) || busyDays.some((d) => typeof d !== "number" || d < 0 || d > 6)) {
    return NextResponse.json({ error: "busyDays must be array of 0–6" }, { status: 400 });
  }

  try {
    await updateBusyDays(session.user.id, id, busyDays);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof RoadmapServiceError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
