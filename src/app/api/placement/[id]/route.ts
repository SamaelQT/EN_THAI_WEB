import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deletePlacementTest } from "@/services/placement.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const force = new URL(req.url).searchParams.get("force") === "true";

  try {
    const result = await deletePlacementTest(session.user.id, id, force);
    return NextResponse.json({ ok: true, deletedRoadmap: result.deletedRoadmap });
  } catch (e: any) {
    if (e.status === 409) {
      return NextResponse.json(
        { error: e.message, roadmap: e.roadmap },
        { status: 409 }
      );
    }
    if (e.status === 404) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
