import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewWord, deleteWord, type Grade } from "@/services/vocabulary.service";

/** PATCH — grade a review (0-5), advancing the SM-2 schedule. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { grade } = await req.json().catch(() => ({ grade: undefined }));

  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    return NextResponse.json({ error: "grade phải là số nguyên 0-5" }, { status: 400 });
  }

  try {
    const item = await reviewWord(session.user.id, id, grade as Grade);
    return NextResponse.json({ item });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Không tìm thấy từ" }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteWord(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Không tìm thấy từ" }, { status });
  }
}
