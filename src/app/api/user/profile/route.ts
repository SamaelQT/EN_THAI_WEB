import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, country } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, country },
  });

  return NextResponse.json({ message: "Updated" });
}
