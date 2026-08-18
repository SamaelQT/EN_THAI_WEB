import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import VocabularyClient from "./VocabularyClient";

export default async function VocabularyPage() {
  const session = await auth();
  const uid = session!.user!.id!;

  // Default the language picker to whichever roadmap the learner is actually using
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: uid, status: "active" },
    orderBy: { createdAt: "desc" },
    select: { language: true },
  });

  return <VocabularyClient defaultLang={roadmap?.language ?? "english"} />;
}
