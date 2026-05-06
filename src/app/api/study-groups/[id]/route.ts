import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { joinGroup, kickMember, leaveOrDissolveGroup, StudyGroupError } from "@/services/study-group.service";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;

  try {
    const result = await joinGroup(session.user.id, groupId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  const { targetUserId } = await req.json();

  try {
    const result = await kickMember(session.user.id, groupId, targetUserId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;

  try {
    const result = await leaveOrDissolveGroup(session.user.id, groupId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
