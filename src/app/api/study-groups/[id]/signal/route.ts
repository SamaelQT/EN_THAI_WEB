import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sseBroadcast, sseSendTo, sseJoinVoice, sseLeaveVoice } from "@/lib/sse-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: groupId } = await params;

  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { type, to, ...payload } = body as { type: string; to?: string; [k: string]: unknown };

  switch (type) {
    case "join-voice":
      sseJoinVoice(groupId, userId, { name: payload.name as string | null, image: payload.image as string | null });
      sseBroadcast(groupId, { type: "join-voice", from: userId, name: payload.name, image: payload.image }, userId);
      break;

    case "leave-voice":
      sseLeaveVoice(groupId, userId);
      sseBroadcast(groupId, { type: "leave-voice", from: userId }, userId);
      break;

    case "mute-update":
      sseBroadcast(groupId, { type: "mute-update", from: userId, muted: payload.muted }, userId);
      break;

    case "offer":
    case "answer":
    case "ice-candidate":
      if (!to) return NextResponse.json({ error: "Missing to" }, { status: 400 });
      sseSendTo(groupId, to, { type: "signal", subtype: type, from: userId, ...payload });
      break;

    default:
      return NextResponse.json({ error: "Unknown signal type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
