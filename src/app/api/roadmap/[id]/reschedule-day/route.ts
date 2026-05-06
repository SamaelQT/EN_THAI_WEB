import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rescheduleDay, RoadmapServiceError } from "@/services/roadmap.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { dayId } = await req.json();
  if (!dayId) return NextResponse.json({ error: "dayId required" }, { status: 400 });

  try {
    await rescheduleDay(session.user.id, id, dayId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof RoadmapServiceError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
