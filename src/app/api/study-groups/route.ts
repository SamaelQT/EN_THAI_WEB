import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStudyGroups, createStudyGroup, StudyGroupError } from "@/services/study-group.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getStudyGroups(session.user.id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const group = await createStudyGroup(session.user.id, body);
    return NextResponse.json({ group }, { status: 201 });
  } catch (e) {
    if (e instanceof StudyGroupError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
