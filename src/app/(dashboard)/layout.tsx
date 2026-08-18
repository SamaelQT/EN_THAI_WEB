import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const uid = session.user.id!;

  // Name + avatar are read here rather than inside the auth session callback: this runs
  // once per page render instead of once per authenticated request, and `router.refresh()`
  // after a profile edit picks up the change immediately without waiting for a token refresh.
  const [friendRequestCount, groupInviteCount, profile] = await Promise.all([
    prisma.friendship.count({ where: { receiverId: uid, status: "pending" } }),
    prisma.studyGroupInvite.count({ where: { inviteeId: uid, status: "pending_invitee" } }),
    prisma.user.findUnique({ where: { id: uid }, select: { name: true, image: true } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          ...session.user,
          name: profile?.name ?? session.user.name,
          image: profile?.image ?? session.user.image,
        }}
        friendRequestCount={friendRequestCount}
        groupInviteCount={groupInviteCount}
      />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
