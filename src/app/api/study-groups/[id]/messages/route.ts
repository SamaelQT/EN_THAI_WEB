import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMessages, sendMessage, StudyGroupError } from "@/services/study-group.service";
import { sseBroadcast } from "@/lib/sse-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;

  try {
    const messages = await getMessages(session.user.id, groupId);
    return NextResponse.json({ messages });
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await params;
  const { content } = await req.json();

  try {
    const message = await sendMessage(session.user.id, groupId, content);
    sseBroadcast(groupId, { type: "chat", message });
    return NextResponse.json({ message });
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
