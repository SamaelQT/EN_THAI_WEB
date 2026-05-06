import { NextResponse } from "next/server";
import { registerUser, UserServiceError } from "@/services/user.service";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    const user = await registerUser(name, email, password);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof UserServiceError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
