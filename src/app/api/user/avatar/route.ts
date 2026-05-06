import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadAvatar, UserServiceError } from "@/services/user.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });

  try {
    const imageUrl = await uploadAvatar(session.user.id, file);
    return NextResponse.json({ imageUrl });
  } catch (e) {
    if (e instanceof UserServiceError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
