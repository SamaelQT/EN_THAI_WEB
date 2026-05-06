import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFriends, sendFriendRequest, respondFriendRequest, FriendshipError } from "@/services/friendship.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getFriends(session.user.id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  try {
    const result = await sendFriendRequest(session.user.id, session.user.name ?? "", email);
    return NextResponse.json(result, { status: result.status });
  } catch (e) {
    if (e instanceof FriendshipError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendshipId, action } = await req.json();
  try {
    const result = await respondFriendRequest(session.user.id, session.user.name ?? "", friendshipId, action);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof FriendshipError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
