import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const [myGroups, publicGroups] = await Promise.all([
    prisma.studyGroup.findMany({
      where: { members: { some: { userId: uid } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    }),
    prisma.studyGroup.findMany({
      where: { members: { none: { userId: uid } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ myGroups, publicGroups });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { name, description, language, maxMembers } = await req.json();
  if (!name?.trim() || !language) {
    return NextResponse.json({ error: "Tên nhóm và ngôn ngữ là bắt buộc" }, { status: 400 });
  }

  const group = await prisma.studyGroup.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      language,
      maxMembers: maxMembers ?? 10,
      createdById: uid,
      members: {
        create: { userId: uid, role: "admin" },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
