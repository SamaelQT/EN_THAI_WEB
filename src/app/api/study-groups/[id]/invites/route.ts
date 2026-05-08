import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroupPendingInvites, StudyGroupError } from "@/services/study-group.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;

  try {
    const invites = await getGroupPendingInvites(session.user.id, groupId);
    return NextResponse.json({ invites });
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
