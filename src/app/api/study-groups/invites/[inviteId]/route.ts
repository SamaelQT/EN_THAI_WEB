import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { respondInvite, StudyGroupError } from "@/services/study-group.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { inviteId } = await params;
  const { action } = await req.json();
  if (action !== "accept" && action !== "reject") return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });

  try {
    const result = await respondInvite(session.user.id, inviteId, action);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
