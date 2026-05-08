import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrGenerateReviewSet, getReviewSets, type ReviewType } from "@/services/review.service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? undefined;

  const sets = await getReviewSets(language);
  return NextResponse.json({ sets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, type, topic, level } = await req.json();
  if (!language || !type || !topic || !level) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  try {
    const set = await getOrGenerateReviewSet(language, type as ReviewType, topic, level);
    return NextResponse.json({ set });
  } catch (e: any) {
    console.error("[review/generate]", e);
    if (e.message?.includes("API key")) {
      return NextResponse.json({ error: "Chưa cấu hình API key" }, { status: 503 });
    }
    return NextResponse.json({ error: "Không thể tạo bài ôn tập. Thử lại sau." }, { status: 500 });
  }
}
