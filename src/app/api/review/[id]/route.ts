import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReviewSetById } from "@/services/review.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const set = await getReviewSetById(id);
  if (!set) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json({ set });
}
