import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createInvite, StudyGroupError } from "@/services/study-group.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    const result = await createInvite(session.user.id, groupId, userId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
