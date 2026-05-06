import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotifications, markAllRead } from "@/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getNotifications(session.user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markAllRead(session.user.id);
  return NextResponse.json({ ok: true });
}
