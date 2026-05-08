import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMyInvites } from "@/services/study-group.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invites = await getMyInvites(session.user.id);
  return NextResponse.json({ invites });
}
