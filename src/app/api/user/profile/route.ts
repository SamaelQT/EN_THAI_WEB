import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateProfile } from "@/services/user.service";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, country } = await req.json();
  await updateProfile(session.user.id, { name, bio, country });
  return NextResponse.json({ message: "Updated" });
}
