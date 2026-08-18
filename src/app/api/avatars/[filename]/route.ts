import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Serve a user's avatar.
 *
 * The route segment is the user id (it used to be a filename back when avatars were
 * written to disk — the name is kept so existing `User.image` URLs stay valid).
 * Avatars are not secret, so no session is required; the id is unguessable enough
 * and the image is already shown on public profiles.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Ids are cuid-like: letters, digits, hyphens and underscores only
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const avatar = await prisma.userAvatar.findUnique({
    where: { userId: filename },
    select: { mimeType: true, data: true, updatedAt: true },
  });
  if (!avatar) return new NextResponse("Not found", { status: 404 });

  const buffer = Buffer.from(avatar.data, "base64");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": avatar.mimeType,
      "Content-Length": String(buffer.byteLength),
      // The URL carries a ?v= timestamp, so a stored copy is safe to keep
      "Cache-Control": "private, max-age=86400",
      "Last-Modified": avatar.updatedAt.toUTCString(),
    },
  });
}
