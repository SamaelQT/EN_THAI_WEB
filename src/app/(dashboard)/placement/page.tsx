import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PlacementTestClient from "./PlacementTestClient";

export default async function PlacementPage() {
  const session = await auth();
  const tests = await prisma.placementTest.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { completedAt: "desc" },
  });

  const englishTest = tests.find((t) => t.language === "english") ?? null;
  const thaiTest    = tests.find((t) => t.language === "thai")    ?? null;

  return (
    <PlacementTestClient
      englishTest={englishTest}
      thaiTest={thaiTest}
      allTests={tests}
    />
  );
}
