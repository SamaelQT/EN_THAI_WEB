import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const roadmap = await prisma.roadmap.findUnique({ where: { id } });
  if (!roadmap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (roadmap.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.roadmap.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
