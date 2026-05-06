import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRoadmap, getRoadmaps, RoadmapServiceError } from "@/services/roadmap.service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const roadmap = await createRoadmap(session.user.id, body);
    return NextResponse.json({ roadmap });
  } catch (e) {
    if (e instanceof RoadmapServiceError)
      return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const language = new URL(req.url).searchParams.get("language");
  const roadmaps = await getRoadmaps(session.user.id, language);
  return NextResponse.json({ roadmaps });
}
