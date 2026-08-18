import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProgressClient from "./ProgressClient";

export default async function ProgressPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: uid, status: "active" },
    orderBy: { createdAt: "desc" },
    select: { language: true },
  });

  return <ProgressClient defaultLang={roadmap?.language ?? "english"} />;
}
