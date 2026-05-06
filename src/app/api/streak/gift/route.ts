import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendStreakGift } from "@/services/streak.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, language, message } = await req.json();
  try {
    await sendStreakGift(session.user.id, session.user.name ?? "", receiverId, language, message);
    return NextResponse.json({ message: "Sent" });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
