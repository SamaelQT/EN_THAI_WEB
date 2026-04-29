import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const [friendships, requests] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: uid }, { receiverId: uid }],
        status: "accepted",
      },
      include: {
        initiator: { select: { id: true, name: true, image: true, totalXp: true } },
        receiver: { select: { id: true, name: true, image: true, totalXp: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: uid, status: "pending" },
      include: {
        initiator: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  const friends = friendships.map((f) =>
    f.initiatorId === uid ? f.receiver : f.initiator
  );

  return NextResponse.json({ friends, requests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
  if (target.id === uid) return NextResponse.json({ error: "Không thể kết bạn với chính mình" }, { status: 400 });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: uid, receiverId: target.id },
        { initiatorId: target.id, receiverId: uid },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") return NextResponse.json({ error: "Đã là bạn bè rồi" }, { status: 409 });
    return NextResponse.json({ error: "Đã gửi yêu cầu rồi" }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: { initiatorId: uid, receiverId: target.id },
  });

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: "friend_request",
      title: "Yêu cầu kết bạn mới",
      body: `${session.user.name} muốn kết bạn với bạn.`,
    },
  });

  return NextResponse.json({ friendship }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { friendshipId, action } = await req.json();

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "accept") {
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "accepted" },
    });
    await prisma.notification.create({
      data: {
        userId: friendship.initiatorId,
        type: "friend_request",
        title: "Yêu cầu kết bạn được chấp nhận",
        body: `${session.user.name} đã chấp nhận yêu cầu kết bạn của bạn!`,
      },
    });
    return NextResponse.json({ message: "Đã chấp nhận" });
  }

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return NextResponse.json({ message: "Đã từ chối" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
